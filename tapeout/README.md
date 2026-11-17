# ICONIC-GATE — MagicLens × TapeOut Accelerate

The "credits-roll judge": a tiny combinational circuit taped out on TapeOut
(X Layer, chain 196) that decides whether a leaderboard entry is promoted to a
Flow Iconic Moment. The backend calls `processor.eval(circuitId, inputs)` —
permissionless, free, re-runnable by anyone — and records the verdict as
on-chain provenance for every premiere in the Screening Room.

## I/O map

`eval(uint256 circuitId, bytes inputs)` packs I/O bits little-endian into bytes.

### Inputs (14 bits → 2 bytes)

| Bit(s) | Name      | Encoding                                             |
|--------|-----------|------------------------------------------------------|
| 0      | MINTED    | 1 = real X Layer ERC-721 token (not guest placeholder) |
| 1      | MEDIA     | 1 = entry has a playable `media_url`                 |
| 2..5   | RANK      | leaderboard rank, 4-bit value 1–10                   |
| 6..13  | VOTES_Q   | `min(votes // 16, 255)` — quantized vote bucket, 8-bit |

Bit ordering: input bit `i` = bit `i` of the packed little-endian input word.
Byte 0 = bits 0–7 (MINTED, MEDIA, RANK[3:0]), byte 1 = bits 8–13 in its low 6 bits
(VOTES_Q occupies input bits 6..13 → spans byte0 bit6-7 and byte1 bits0-5).

### Outputs (5 bits)

| Bit(s) | Name    | Meaning                                             |
|--------|---------|-----------------------------------------------------|
| 0      | PROMOTE | 1 = mint this entry as an Iconic Moment              |
| 1..4   | SCORE   | iconic score 0–15 = `min(VOTES_Q, 15)`              |

## Logic

```
promote = MINTED & MEDIA & (1 <= RANK <= 3) & (VOTES_Q != 0)
score   = (VOTES_Q >= 16) ? 15 : VOTES_Q[3:0]
```

Rationale:
- `RANK <= 3` mirrors today's top-3 promotion rule.
- `MINTED` replaces the backend's guest-placeholder check (`guest:` creator /
  negative token id) — guests can never premiere.
- `MEDIA` is new: Screening Room premieres require a playable clip, so the
  circuit enforces it instead of the UI silently falling back.
- `VOTES_Q != 0` requires at least ~16 raw votes — a minimal popularity gate
  so empty days can't mint.
- `SCORE` gives judges/creators a 0–15 "iconic score" for display and future
  tie-breaks; it saturates at 15.

## Verification

- Exhaustive: all 2^14 inputs checked against the Python reference
  (`verify.py`) — 16,384 cases, 0 mismatches.
- On-chain: `cast call <processor> "eval(uint256,bytes)(bytes)" <id> <inputs>`
  returns the same 5-bit output for free.

## Submission values

- **Processor contract:** `0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355` (OrderGuard, X Layer chain 196)
- **Circuit ID:** `20` — "ICONIC-GATE", 46 NAND gates, 14 in / 5 out, depth 9
- **Tapeout tx:** `0xdc6dd373dbc9489fd10667f50abf50c3b8f57ae813d6254bc90f845f145bc35c`
- **Mint tx (46 transistors):** `0xd94a31b0f1bacc31b9f864e1273094c4d34dfc2a0863cc359e314373d5f1ee00`
- **Deployer:** `0x8b0b474f86bE342E5A5329Cc2E25016Aa274594e`
- **TapeOut features used:** processor (OrderGuard), transistors (ERC-1155), `tapeout()`, `eval()` read-only verification

### On-chain verification (2026-11-17, block ~76.4M)

```
eval(20, 0x4b02) = 0x13   # minted=1 media=1 rank=2 votes_q=9 -> promote=1 score=9
eval(20, 0x0000) = 0x00   # all zero -> promote=0 score=0
eval(20, 0xffff) = 0x1e   # rank=15 -> promote=0 score=15
```
