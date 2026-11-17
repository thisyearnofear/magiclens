"""Leaderboard cycle management and auto-promote scheduler.

Manages daily leaderboard cycles:
  open → closed → promoting → completed

The scheduler background task checks for closed days and auto-promotes
top-3 entries to Flow Iconic Moments via CrossVMService.
"""
import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from core.database import execute_query, execute_update, get_db_connection, return_db_connection
from core.crossvm_service import crossvm_service, CrossVMMintRequest
from core import tapeout

logger = logging.getLogger(__name__)

# ── Database DDL ─────────────────────────────────────────────────────

LEADERBOARD_CYCLES_TABLE = """
CREATE TABLE IF NOT EXISTS leaderboard_cycles (
    day INTEGER PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed', 'promoting', 'completed')),
    closed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

LEADERBOARD_ENTRIES_TABLE = """
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY,
    day INTEGER NOT NULL REFERENCES leaderboard_cycles(day),
    rank INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    creator VARCHAR(100) NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    reward VARCHAR(20) DEFAULT '',
    xlayer_token_id BIGINT NOT NULL,
    xlayer_tx_hash VARCHAR(128) NOT NULL,
    xlayer_creator_address VARCHAR(64) NOT NULL,
    media_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day, rank)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_day ON leaderboard_entries(day);
"""


# ── Service ──────────────────────────────────────────────────────────

class LeaderboardService:
    """Manages leaderboard day cycles and auto-promotion."""

    def ensure_tables(self):
        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(LEADERBOARD_CYCLES_TABLE)
                cur.execute(LEADERBOARD_ENTRIES_TABLE)
                # Backfill for pre-existing deployments (CREATE TABLE IF NOT EXISTS is a no-op there)
                cur.execute("ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS media_url TEXT")
            conn.commit()
        except Exception as e:
            logger.error(f"Failed to create leaderboard tables: {e}")
            raise
        finally:
            return_db_connection(conn)

    def get_or_create_day(self, day: int) -> dict:
        """Get a leaderboard cycle day, creating it if it doesn't exist."""
        self.ensure_tables()
        rows = execute_query(
            "SELECT * FROM leaderboard_cycles WHERE day = %s", (day,)
        )
        if rows:
            return rows[0]
        execute_update(
            "INSERT INTO leaderboard_cycles (day, status) VALUES (%s, 'open')",
            (day,),
        )
        return {"day": day, "status": "open"}

    def submit_day_results(
        self,
        day: int,
        entries: List[Dict[str, Any]],
    ) -> dict:
        """Close a leaderboard day and store its final top entries.
        
        Args:
            day: The leaderboard day number
            entries: List of top-N entries with keys:
                rank, title, creator, votes, reward,
                xlayer_token_id, xlayer_tx_hash, xlayer_creator_address
        """
        self.ensure_tables()
        cycle = self.get_or_create_day(day)

        if cycle["status"] != "open":
            return {"success": False, "error": f"Day {day} is already {cycle['status']}"}

        # Insert entries
        for entry in entries:
            import uuid
            execute_update(
                """INSERT INTO leaderboard_entries
                   (id, day, rank, title, creator, votes, reward,
                    xlayer_token_id, xlayer_tx_hash, xlayer_creator_address, media_url)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (day, rank) DO UPDATE SET
                       title = EXCLUDED.title,
                       creator = EXCLUDED.creator,
                       votes = EXCLUDED.votes,
                       reward = EXCLUDED.reward,
                       xlayer_token_id = EXCLUDED.xlayer_token_id,
                       xlayer_tx_hash = EXCLUDED.xlayer_tx_hash,
                       xlayer_creator_address = EXCLUDED.xlayer_creator_address,
                       media_url = EXCLUDED.media_url""",
                (
                    str(uuid.uuid4()),
                    day,
                    entry["rank"],
                    entry["title"],
                    entry["creator"],
                    entry["votes"],
                    entry.get("reward", ""),
                    entry["xlayer_token_id"],
                    entry["xlayer_tx_hash"],
                    entry["xlayer_creator_address"],
                    entry.get("media_url"),
                ),
            )

        # Mark day as closed
        execute_update(
            "UPDATE leaderboard_cycles SET status = 'closed', closed_at = NOW() WHERE day = %s",
            (day,),
        )

        return {"success": True, "day": day, "entries_count": len(entries)}

    async def process_day(self, day: int) -> dict:
        """Process a closed day: promote top-3 to Flow Iconic Moments.
        
        Called by the scheduler or manually via API.
        """
        self.ensure_tables()
        cycles = execute_query(
            "SELECT * FROM leaderboard_cycles WHERE day = %s", (day,)
        )
        if not cycles:
            return {"success": False, "error": f"Day {day} not found"}
        cycle = cycles[0]

        if cycle["status"] not in ("closed", "promoting"):
            return {
                "success": False,
                "error": f"Day {day} is {cycle['status']}, need 'closed' or 'promoting'",
            }

        # Mark as promoting
        execute_update(
            "UPDATE leaderboard_cycles SET status = 'promoting' WHERE day = %s",
            (day,),
        )

        # Get top-3 entries for this day
        entries = execute_query(
            "SELECT * FROM leaderboard_entries WHERE day = %s ORDER BY rank ASC LIMIT 3",
            (day,),
        )
        if not entries:
            execute_update(
                "UPDATE leaderboard_cycles SET status = 'completed', completed_at = NOW() WHERE day = %s",
                (day,),
            )
            return {"success": True, "day": day, "promoted": 0, "message": "No entries to promote"}

        # Check which are already promoted
        already_promoted = 0
        promoted_count = 0
        skipped_guests = 0
        gate_rejected = 0
        errors = []

        for entry in entries:
            # Guest entries have no on-chain mint yet (`guest:<id>` creator,
            # `guest-…` tx hash, or negative placeholder token id). They close
            # with the day but must never trigger a Flow mint — the owner
            # promotes after connecting a wallet and minting on X Layer.
            creator = str(entry.get("xlayer_creator_address") or "")
            tx_hash = str(entry.get("xlayer_tx_hash") or "")
            if (
                creator.startswith("guest:")
                or tx_hash.startswith("guest-")
                or (entry.get("xlayer_token_id") or 0) < 0
            ):
                skipped_guests += 1
                continue
            # Check if already promoted
            existing = await crossvm_service.get_iconic_moment(
                entry["xlayer_token_id"], day
            )
            if existing and existing["status"] == "minted":
                already_promoted += 1
                continue
            if existing and existing["status"] == "pending":
                # Already being processed, skip
                already_promoted += 1
                continue

            try:
                # ── TapeOut gate: ICONIC-GATE circuit on X Layer decides ──
                # Guests were filtered above, so minted=1 here. The circuit
                # also requires a playable clip and a nonzero vote bucket.
                tapeout_verdict = None
                if tapeout.TAPEOUT_ENABLED:
                    verdict = tapeout.eval_iconic_gate(
                        minted=1,
                        media=1 if entry.get("media_url") else 0,
                        rank=entry["rank"],
                        votes=entry.get("votes") or 0,
                    )
                    if verdict is None:
                        errors.append(
                            f"Rank #{entry['rank']}: TapeOut eval unreachable"
                        )
                        continue
                    tapeout_verdict = verdict
                    if not verdict["promote"]:
                        tapeout.record_verification(
                            day, entry["rank"], entry["xlayer_token_id"],
                            verdict, promoted=False,
                        )
                        gate_rejected += 1
                        continue

                request = CrossVMMintRequest(
                    xlayer_token_id=entry["xlayer_token_id"],
                    xlayer_tx_hash=entry["xlayer_tx_hash"],
                    xlayer_creator_address=entry["xlayer_creator_address"],
                    title=entry["title"],
                    overlay_ids="",
                    day=day,
                    rank=entry["rank"],
                    promoted_by="auto-scheduler",
                    media_url=entry.get("media_url"),
                )
                result = await crossvm_service.promote_to_iconic(request)
                if tapeout_verdict is not None:
                    tapeout.record_verification(
                        day, entry["rank"], entry["xlayer_token_id"],
                        tapeout_verdict,
                        promoted=bool(result.get("flow_mint", {}).get("success")),
                    )
                if result.get("flow_mint", {}).get("success"):
                    promoted_count += 1
                else:
                    errors.append(
                        f"Rank #{entry['rank']}: {result.get('flow_mint', {}).get('error', 'unknown error')}"
                    )
            except Exception as e:
                logger.error(f"Auto-promote failed for day {day} rank {entry['rank']}: {e}")
                errors.append(f"Rank #{entry['rank']}: {str(e)}")

        # Mark as completed
        execute_update(
            "UPDATE leaderboard_cycles SET status = 'completed', completed_at = NOW() WHERE day = %s",
            (day,),
        )

        return {
            "success": True,
            "day": day,
            "promoted": promoted_count,
            "already_promoted": already_promoted,
            "skipped_guests": skipped_guests,
            "gate_rejected": gate_rejected,
            "tapeout_enabled": tapeout.TAPEOUT_ENABLED,
            "errors": errors,
        }

    async def process_all_pending_days(self) -> List[dict]:
        """Process all days that are 'closed' and need promotion.
        
        Called periodically by the scheduler.
        """
        self.ensure_tables()
        closed_days = execute_query(
            "SELECT day FROM leaderboard_cycles WHERE status = 'closed' ORDER BY day ASC"
        )
        results = []
        for row in (closed_days or []):
            result = await self.process_day(row["day"])
            results.append(result)
        return results

    def get_day_status(self, day: int) -> Optional[dict]:
        """Get the status of a leaderboard day including its entries."""
        self.ensure_tables()
        cycles = execute_query(
            "SELECT * FROM leaderboard_cycles WHERE day = %s", (day,)
        )
        if not cycles:
            return None
        cycle = cycles[0]
        entries = execute_query(
            "SELECT * FROM leaderboard_entries WHERE day = %s ORDER BY rank ASC",
            (day,),
        )
        # Check iconic moment status for top-3
        for entry in (entries or []):
            if entry["rank"] <= 3:
                iconic = execute_query(
                    """SELECT status, flow_nft_id, flow_tx_hash FROM iconic_moments
                       WHERE xlayer_token_id = %s AND day = %s""",
                    (entry["xlayer_token_id"], day),
                )
                if iconic:
                    entry["iconic_status"] = iconic[0]["status"]
                    entry["flow_nft_id"] = iconic[0].get("flow_nft_id")
                    entry["flow_tx_hash"] = iconic[0].get("flow_tx_hash")
                else:
                    entry["iconic_status"] = None
            else:
                entry["iconic_status"] = None

        return {
            "day": cycle["day"],
            "status": cycle["status"],
            "closed_at": cycle.get("closed_at"),
            "completed_at": cycle.get("completed_at"),
            "entries": entries or [],
        }


# ── Background Scheduler ────────────────────────────────────────────

leaderboard_service = LeaderboardService()

_scheduler_task: Optional[asyncio.Task] = None

async def _auto_promote_loop(interval_seconds: int = 60):
    """Background loop: periodically check for closed days and auto-promote."""
    logger.info(f"Auto-promote scheduler started (interval={interval_seconds}s)")
    while True:
        try:
            results = await leaderboard_service.process_all_pending_days()
            if results:
                for r in results:
                    if r.get("promoted", 0) > 0:
                        logger.info(
                            f"Auto-promote day {r['day']}: "
                            f"{r['promoted']} promoted, "
                            f"{r['already_promoted']} already done"
                        )
                    elif r.get("errors"):
                        logger.warning(
                            f"Auto-promote day {r['day']}: "
                            f"errors: {', '.join(r['errors'])}"
                        )
        except Exception as e:
            logger.error(f"Auto-promote scheduler error: {e}")
        await asyncio.sleep(interval_seconds)


def start_auto_promote_scheduler(interval_seconds: int = 60):
    """Start the auto-promote background scheduler.
    
    Called during FastAPI startup.
    """
    global _scheduler_task
    if _scheduler_task is not None and not _scheduler_task.done():
        logger.warning("Auto-promote scheduler already running")
        return
    _scheduler_task = asyncio.create_task(_auto_promote_loop(interval_seconds))
