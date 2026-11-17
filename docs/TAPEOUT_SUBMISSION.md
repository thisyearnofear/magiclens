# TapeOut Accelerate — Submission Draft

> Draft for the TapeOut × X Layer Accelerate submission (deadline Dec 7, 2026).
> Fill placeholders marked ⟦ ⟧ before submitting.

## Access link

- **Product:** https://magiclens.vercel.app
- **Screening Room (the TapeOut surface):** https://magiclens.vercel.app/screening-room
- **Archive (audit trail):** https://magiclens.vercel.app/screening-room?view=archive
- **Marathon:** https://magiclens.vercel.app/screening-room?view=marathon
- **API status:** https://magiclens.thisyearnofear.com/api/tapeout/status

## On-chain assets

| Item | Value |
|---|---|
| Processor (OrderGuard) | `0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355` |
| Circuit | **ICONIC-GATE**, circuit ID **20** |
| Chain | X Layer mainnet (chain ID 196), RPC `https://rpc.xlayer.tech` |
| Tapeout tx | `0xdc6dd373dbc9489fd10667f50abf50c3b8f57ae813d6254bc90f845f145bc35c` |
| Transistor mint tx | `0xd94a31b0f1bacc31b9f864e1273094c4d34dfc2a0863cc359e314373d5f1ee00` |
| Deployer | `0x8b0b474f86bE342E5A5329Cc2E25016Aa274594e` |
| Circuit size | 46 NAND gates, 14 inputs, 5 outputs, depth 9 |

TapeOut features used: **circuits** (`eval` gate), **processors** (OrderGuard
factory), **transistors** (ERC-1155 purchase + `tapeout()`). Eval is a
permissionless read-only `eth_call` — every verdict is re-runnable by anyone.

## Product / service description

MagicLens turns live sports footage into pose-aware AR remixes and crowns the
day's best as **Iconic Moments** — premium NFTs on Flow. The missing piece in
any creator-economy leaderboard is *trust in the gate*: who decided this entry
was iconic, and can anyone check?

**ICONIC-GATE is the answer — a physical NAND circuit taped out on TapeOut
that serves as the promotion judge.** Before any Iconic Moment mints on Flow,
the backend packs the entry's features (minted status, playable media, rank,
quantized votes) into the circuit's 14 input bits and calls `eval()` on X
Layer mainnet. Only entries the silicon approves are promoted. Every verdict —
inputs, outputs, score — is journaled and surfaced in the product:

- **Screening Room Premiere** — each moment's marquee shows its silicon
  verdict ("Cleared by TapeOut #20 · score 9/15").
- **Archive** — every moment grouped by day carries its circuit provenance.
- **Live Verify button** — re-runs `eval()` in the browser via a public
  `eth_call`; judges and users can re-decide any promotion themselves.
- **Honest auditing** — moments promoted before the gate shipped were
  backfilled and correctly show `promote=0` (no playable clip). The circuit
  doesn't lie, even about legacy data.

The gate is deliberately narrow: it cannot verify vote counts (NAND gates
can't hash), and we say so. What it *does* provide is a deterministic,
publicly re-runnable promotion rule settled by silicon rather than a server —
the same trust model as a smart contract, but for off-chain media judgment.

## Target users

- **Creators** uploading sports remixes who want leaderboard wins to mean
  something verifiable.
- **Collectors** buying Flow Iconic Moments who want provenance on why a
  moment was iconic — "circuit #20 on OrderGuard cleared it, score 9/15."
- **Judges, auditors, and other TapeOut builders** who need a real consumer
  of `eval()` — MagicLens is a production use case, not a demo contract.

## Reach strategy

- Existing MagicLens audience: OKX X Cup hackathon community, Flow/Flowty
  ecosystem, sports-fan creator communities.
- The Screening Room is publicly accessible, no wallet required — every
  shared premiere link exposes the silicon verdict to non-crypto viewers.
- Iconic Moments are shareable Flow NFTs; each FlowScan page can link back to
  its TapeOut verdict, carrying the story to Flow collectors.
- Demo video + X/LI posts at submission; TapeOut community channels.

## Revenue model

- **Flow Iconic Moments** — premium minted NFTs (primary sale + royalties).
- **Creator tools** — pose-aware AR remix overlays, premium templates.
- **TapeOut flywheel** — MagicLens is a reference consumer of `eval()`;
  other builders adopting the same pattern grow the TapeOut ecosystem.

## Why users pay and keep using it

Paying for an Iconic Moment buys *verified iconic status*: the circuit's
score is permanent, public, and re-checkable — a provenance layer no
server-side leaderboard can offer. Creators keep remixing because each daily
cycle is a fresh shot at a silicon-cleared premiere; the archive compounds
as a permanent record of who the circuit crowned.

## Substantial new development during the event

- Designed, verified (all 16,384 input combinations), and taped out
  ICONIC-GATE: 46-gate NAND netlist, Verilog source + exhaustive simulator
  in `tapeout/`.
- Built `services/core/tapeout.py`: input packing, JSON-RPC `eval`,
  `tapeout_verifications` journal table.
- Wired the gate into `leaderboard_service.process_day()` — promotion now
  fails closed if the circuit rejects or is unreachable.
- Exposed provenance through the API (`tapeout` object on every moment,
  `/api/tapeout/status`) and three new UI surfaces: badges, live browser
  `eval` verification, Screening Room Marathon/Archive modes.
- Backfilled verdicts for all pre-gate moments.

## Demo video outline (≤3 min)

1. **Hook (0:00–0:20)** — "Who decides what's iconic? A NAND circuit."
   Show ICONIC-GATE netlist + tapeout tx on the explorer.
2. **The gate (0:20–1:00)** — leaderboard day closes → backend calls
   `eval(20, inputs)` on X Layer → journal entry written.
3. **The premiere (1:00–1:40)** — cleared moments mint on Flow, appear in
   the Screening Room with "Cleared by TapeOut #20 · score 9/15."
4. **The audit (1:40–2:20)** — click **Verify**: live `eth_call` re-runs the
   circuit in-browser, output matches. Open Archive: legacy moments show
   `promote=0` — the circuit audits history too.
5. **The loop (2:20–3:00)** — Marathon mode plays the channel; CTA to
   create a remix. End card: processor + circuit addresses.

## Open items before submitting

- ⟦ Record the ≤3-min demo video ⟧
- ⟦ Confirm whether judges want the tape:// container receipt page for
      circuit #20 (ERC-6551) — optional ecosystem flex ⟧
- ⟦ Submit via the TapeOut portal with this doc ⟧
