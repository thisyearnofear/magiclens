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

- **CreatorPass** — priced ERC-1155 Pro pass (0.01 OKB, X Layer) live in
  product today: watermark-free exports + 60s clip cap. Testnet now;
  `deploy-mainnet.ts` ready for chain 196. See `docs/MONETIZATION.md`.
- **Premium overlay packs** — priced-mint pattern identical to
  CreatorPass; ships when pack envy exists.
- **Flow Iconic Moments** — currently free auto-promotion by design;
  monetization options documented in `docs/MONETIZATION.md` (no
  pay-to-win).
- **TapeOut flywheel** — MagicLens is a reference consumer of `eval()`;
  other builders adopting the same pattern grow the TapeOut ecosystem.

## Why users pay and keep using it

Creators pay for **CreatorPass** to ship cleaner, longer work — the video
file is the prize, and Pro removes the watermark and doubles the clip cap.
The retention loop is free: each daily cycle is a fresh shot at a
silicon-cleared premiere, and the circuit's verdict is permanent, public,
and re-checkable — provenance no server-side leaderboard can offer. The
archive compounds as a permanent record of who the circuit crowned.

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
- Rebuilt the AR layer end-to-end: clip pose tracking (MediaPipe + One
  Euro smoothing), multi-subject tracks with tap-to-switch, body-relative
  anchors, velocity-reactive particles — on desktop AND mobile.
- Canvas-composited video export (`captureStream` + `MediaRecorder`) with
  a free-tier watermark; public replay (`/remix/[txHash]`) renders the
  actual tracked AR state, not placeholders.
- CreatorPass: priced ERC-1155 Pro pass (0.01 OKB) with on-chain
  entitlement gating export perks.
- `scripts/export_deweb_archive.py` — DeWEB archive generator (14 days,
  SHA-256 manifest) + `tapeout/container/index.html` circuit spec page.

## Demo video outline (≤3 min)

Full shot list: **`docs/DEMO_VIDEO_SCRIPT.md`** (2:35, mobile-first).
Product-led cold open on the exported .webm → live create loop →
Screening Room "Cleared by TapeOut #20" → live `eth_call` re-verify on
camera → DeWEB archive + container spec page → CreatorPass revenue beat.

## Container receipts (ERC-6551 + tape://)

**v1 spec page built:** `tapeout/container/index.html` — a self-contained
"I am ICONIC-GATE" page (deployment table, gating scope, live-verify
links) ready for upload to circuit #20's container via HashPort, or
bundled into the DeWEB archive site as fallback.

TapeOut containers are token-bound accounts (ERC-6551) attached to each
circuit NFT. They can hold assets, receive TapeSend messages, and host
permanent `tape://` websites — content stored inside the account contract on
X Layer, independent of our hosting.

**v2 (post-submission, designed now):** every Iconic Moment gets its own
container-bound receipt — "Moment X cleared by circuit #20, inputs `0x4b02`,
output `0x13`, at block N" — published to tape:// at promotion time. This
moves `tapeout_verifications` from a private Postgres journal to a public
on-chain record: provenance that lives on X Layer, not on our server. The
Screening Room badge would link to the moment's tape:// receipt instead of
(only) OKLink.

Implementation notes:
- Deployer wallet `0x8b0b…594e` funds container deployment/update txs
  (small OKB cost per receipt).
- Flow: `process_day()` verdict → publish receipt to the moment's container
  → store container address + tape:// URL in `tapeout_verifications` →
  surface in API/UI.
- Open research item: exact TapeOut container hosting API (canvas vs.
  contract calls) — needs a docs/repo pass before building.

## Open items before submitting

Tracked in `docs/TAPEOUT_PLAN.md` (Phase B = wallet steps):

- ⟦ Fund mainnet deployer `0xc8d8EbCB…F7A5` on chain 196 → run
      `deploy-mainnet.ts` → wire prod env to mainnet ⟧
- ⟦ `id.tapeout.link` container; upload DeWEB archive via HashPort;
      bind `tape://` name ⟧
- ⟦ Deploy circuit #20's container spec page (built) ⟧
- ⟦ Register on the hackathon voting page ⟧
- ⟦ Record the ≤3-min demo video per `docs/DEMO_VIDEO_SCRIPT.md` ⟧
- ⟦ First mainnet CreatorPass purchase (dogfood + vote eligibility) ⟧
- ⟦ Seed 10–20 creators via `?ref=` links; collect real mint/vote
      metrics for the form ⟧
- ⟦ Submit via the TapeOut portal — target Dec 4, deadline Dec 7 23:59 UTC ⟧
