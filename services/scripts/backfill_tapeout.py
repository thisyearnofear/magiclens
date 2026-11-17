"""Backfill tapeout_verifications for already-promoted iconic moments.

Runs ICONIC-GATE on each existing iconic_moment using its stored rank, day,
votes (from leaderboard_entries when present, else a nominal bucket), and
records the verdict so the Screening Room can show silicon provenance for
moments promoted before the gate shipped.
"""
import sys
sys.path.insert(0, ".")
from core import tapeout
from core.database import init_db, execute_query

init_db()

rows = execute_query(
    """SELECT im.day, im.rank, im.xlayer_token_id, im.media_url,
              COALESCE(le.votes, 64) AS votes
       FROM iconic_moments im
       LEFT JOIN leaderboard_entries le
         ON le.day = im.day AND le.xlayer_token_id = im.xlayer_token_id
       ORDER BY im.day, im.rank"""
)

ok = skipped = 0
for r in rows or []:
    verdict = tapeout.eval_iconic_gate(
        minted=1,
        media=1 if r.get("media_url") else 0,
        rank=r["rank"],
        votes=r["votes"],
    )
    if verdict is None:
        print(f"day {r['day']} rank {r['rank']}: eval failed")
        skipped += 1
        continue
    tapeout.record_verification(
        r["day"], r["rank"], r["xlayer_token_id"], verdict,
        promoted=verdict["promote"] == 1,
    )
    print(f"day {r['day']} rank {r['rank']} token {r['xlayer_token_id']}: "
          f"promote={verdict['promote']} score={verdict['score']} "
          f"inputs={verdict['inputs_hex']}")
    ok += 1

print(f"done: {ok} verified, {skipped} skipped")
