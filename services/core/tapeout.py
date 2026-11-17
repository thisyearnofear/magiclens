"""TapeOut circuit verification for Iconic Moment promotion.

ICONIC-GATE (circuit 20 on OrderGuard, X Layer mainnet) is the on-chain judge:
the backend packs each leaderboard entry's quantized features into the
circuit's 14 input bits, calls `processor.eval(circuitId, inputs)` — a
permissionless, free eth_call anyone can re-run — and only promotes entries
the circuit approves. Every verdict is journaled in `tapeout_verifications`
so judges and users can audit exactly what the silicon decided.

Enable with TAPEOUT_ENABLED=true. Config (all optional, defaults shown):
  TAPEOUT_RPC        https://rpc.xlayer.tech
  TAPEOUT_PROCESSOR  0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355  (OrderGuard)
  TAPEOUT_CIRCUIT_ID 20
"""
import os
from typing import Optional

import requests

from core.database import execute_query, execute_update, get_db_connection, return_db_connection

TAPEOUT_ENABLED = os.getenv("TAPEOUT_ENABLED", "").lower() in ("1", "true", "yes")
TAPEOUT_RPC = os.getenv("TAPEOUT_RPC", "https://rpc.xlayer.tech")
TAPEOUT_PROCESSOR = os.getenv(
    "TAPEOUT_PROCESSOR", "0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355"
)
TAPEOUT_CIRCUIT_ID = int(os.getenv("TAPEOUT_CIRCUIT_ID", "20"))

EVAL_SELECTOR = "0x934d06ea"  # eval(uint256,bytes)

VERIFICATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS tapeout_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    xlayer_token_id BIGINT NOT NULL,
    circuit_id INTEGER NOT NULL,
    processor VARCHAR(64) NOT NULL,
    inputs_hex VARCHAR(16) NOT NULL,
    output_hex VARCHAR(16) NOT NULL,
    promote INTEGER NOT NULL,
    score INTEGER NOT NULL,
    promoted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tapeout_verifications_moment
    ON tapeout_verifications(day, xlayer_token_id);
"""

_tables_ready = False


def ensure_tables():
    global _tables_ready
    if _tables_ready:
        return
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(VERIFICATIONS_TABLE)
        conn.commit()
    finally:
        return_db_connection(conn)
    _tables_ready = True


def quantize_votes(votes: int) -> int:
    """votes -> 8-bit bucket: min(votes // 16, 255)."""
    return min(max(int(votes), 0) // 16, 255)


def pack_inputs(minted: int, media: int, rank: int, votes_q: int) -> str:
    """Pack the 14 input bits little-endian -> '0x'-prefixed hex bytes."""
    word = (
        (minted & 1)
        | ((media & 1) << 1)
        | ((rank & 0xF) << 2)
        | ((votes_q & 0xFF) << 6)
    )
    return "0x" + word.to_bytes(2, "little").hex()


def _rpc_call(method: str, params: list) -> dict:
    resp = requests.post(
        TAPEOUT_RPC,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def eval_iconic_gate(minted: int, media: int, rank: int, votes: int) -> Optional[dict]:
    """Run ICONIC-GATE on X Layer. Returns {promote, score, inputs_hex,
    output_hex} or None when the RPC call fails."""
    votes_q = quantize_votes(votes)
    inputs_hex = pack_inputs(minted, media, rank, votes_q)

    # ABI-encode eval(uint256 circuitId, bytes inputs)
    data = (
        EVAL_SELECTOR
        + f"{TAPEOUT_CIRCUIT_ID:064x}"
        + f"{64:064x}"          # offset to bytes
        + f"{len(bytes.fromhex(inputs_hex[2:])):064x}"
        + inputs_hex[2:].ljust(64, "0")
    )
    payload = {
        "to": TAPEOUT_PROCESSOR,
        "data": data,
    }
    try:
        result = _rpc_call("eth_call", [payload, "latest"])
    except Exception:
        return None
    if "error" in result or "result" not in result:
        return None

    # eval returns ABI-encoded `bytes`: [offset 0x20][length][data padded to 32]
    raw = result["result"]
    blob = bytes.fromhex(raw[2:]) if raw.startswith("0x") else b""
    out_bytes = b""
    if len(blob) >= 64:
        length = int.from_bytes(blob[32:64], "big")
        out_bytes = blob[64 : 64 + length]
    word = int.from_bytes(out_bytes, "little") if out_bytes else 0
    return {
        "promote": word & 1,
        "score": (word >> 1) & 0xF,
        "inputs_hex": inputs_hex,
        "output_hex": "0x" + out_bytes.hex(),
        "votes_q": votes_q,
    }


def record_verification(
    day: int,
    rank: int,
    xlayer_token_id: int,
    verdict: dict,
    promoted: bool,
):
    ensure_tables()
    import uuid
    execute_update(
        """INSERT INTO tapeout_verifications
           (id, day, rank, xlayer_token_id, circuit_id, processor,
            inputs_hex, output_hex, promote, score, promoted)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (
            str(uuid.uuid4()),
            day,
            rank,
            xlayer_token_id,
            TAPEOUT_CIRCUIT_ID,
            TAPEOUT_PROCESSOR,
            verdict["inputs_hex"],
            verdict["output_hex"],
            verdict["promote"],
            verdict["score"],
            1 if promoted else 0,
        ),
    )


def get_verification(day: int, xlayer_token_id: int) -> Optional[dict]:
    """Latest verification row for a leaderboard entry (for API/frontend)."""
    try:
        ensure_tables()
        rows = execute_query(
            """SELECT circuit_id, processor, inputs_hex, output_hex,
                      promote, score, promoted, created_at
               FROM tapeout_verifications
               WHERE day = %s AND xlayer_token_id = %s
               ORDER BY created_at DESC LIMIT 1""",
            (day, xlayer_token_id),
        )
        return rows[0] if rows else None
    except Exception:
        return None
