# TapeOut Accelerate — Win Plan

> Written Nov 17, 2026. Submission deadline **Dec 7, 23:59 UTC** (20 days).
> Target submission date: **Dec 4** — never submit on deadline day.
> Entry copy lives in `TAPEOUT_SUBMISSION.md`; this doc is the execution plan.
> **Posture: target 1st prize.** Every item below is scoped to what a
> winning entry actually requires, not a participation trophy.

## Status correction (Nov 17)

An earlier gap assessment called our TapeOut usage "decorative." Wrong —
the record: **ICONIC-GATE already gates Flow promotion.** The circuit
(46-gate NAND, ID 20, OrderGuard `0x57F319CF…Aa355`, mainnet 196) is
load-bearing: `process_day()` fails closed if `eval()` rejects. That's the
"verifiable competition results" integration the judges' criteria reward.
What remains is shipping the ecosystem surfaces, the traction, and the
submission itself.

## The real gap list, ranked by judging impact

1. **Submission mechanics (blocking)** — no video, no form, not registered
   on the voting page. Cannot win what isn't submitted.
2. **Traction (biggest judging risk)** — zero real users. "User value &
   commercial potential" with a demo-seeded leaderboard reads as potential,
   not proof.
3. **Ecosystem depth (named criterion)** — DeWEB archive built but not
   published; circuit container spec page planned but not deployed. These
   are cheap, high-signal ecosystem flexes.
4. **Community votes** — voting converts eligible X Layer holdings; we
   have no holder base to rally yet.
5. **Mainnet product contracts (optional)** — TapeOut usage is already
   mainnet, but RemixNFT/CreatorPass on 196 makes "minted on X Layer"
   literally true for judges checking contracts.

## Phase A — Devin builds (Nov 17–20)

- [x] Generate the DeWEB archive via `scripts/export_deweb_archive.py`;
      verified — 14 moments, 5 files, upload-ready folder. Regenerate at
      upload time so it includes the newest days
- [x] Circuit container spec page — `tapeout/container/index.html`:
      "I am ICONIC-GATE" — deployment table, gating explanation, honest
      scope note, live-verify links. Upload via HashPort alongside the
      archive (or as its own container)
- [~] Mainnet deploys — `contracts-solidity/scripts/deploy-mainnet.ts`
      written and gated on balance. **Blocked: deployer
      `0xc8d8EbCBA4149190B93Ab95fbC4e2F17CcdaF7A5` has 0 OKB on 196 —
      fund it (~a few dollars covers all three deploys), then
      `npx hardhat run scripts/deploy-mainnet.ts --network xlayerMainnet`**
- [x] Demo video script — `docs/DEMO_VIDEO_SCRIPT.md`: 2:35 shot list,
      mobile-first, TapeOut beat is live `eth_call` on camera
- [ ] After funding: run deploy script, add env wiring so prod points at
      mainnet 196 while dev/test stays on 1952
- [ ] Finalize submission doc — fill ⟦ ⟧ placeholders, refresh "new work
      in window" list (AR rebuild, export, public replay, CreatorPass,
      mobile tracking are all Oct 16+)
- [ ] Write the creator-seeding kit: `?ref=` links, the tester script
      (already drafted), target list from `GROWTH_INTEL.md`

## Phase B — User executes (Nov 20–27, wallet + content)

These require your keys/identity — Devin can't do them:

- [ ] **Fund mainnet deployer `0xc8d8EbCBA4149190B93Ab95fbC4e2F17CcdaF7A5`
      with OKB on chain 196** — unblocks the three contract deploys
      (script ready). Do this first; it gates mainnet minting
- [ ] `id.tapeout.link` → one-click container; fund OKB for gas
- [ ] Upload DeWEB archive folder via HashPort console (2 signatures);
      bind `tape://` name
- [ ] Deploy circuit #20's container spec page to its ERC-6551 container
- [ ] Register MagicLens on the hackathon voting page
- [ ] Record the ≤3-min demo video (script ready; phone recording of the
      mobile flow + screen capture of the circuit surfaces)
- [ ] First CreatorPass purchase on mainnet — dogfood the revenue model,
      also makes the buyer a vote-eligible holder
- [ ] Send `?ref=` seeding kit to 10–20 creators from the growth list

## Phase C — Submit (Nov 27 – Dec 4)

- [ ] Collect metrics for the form: real mints, exports, gate verdicts,
      votes, unique creators
- [ ] Final form answers from `TAPEOUT_SUBMISSION.md` (product, users,
      reach, revenue, TapeOut features: circuits + processors +
      transistors + DeWEB + containers)
- [ ] Submit Google Form by **Dec 4**
- [ ] Begin vote rally — seeded creators + community holding eligible
      X Layer assets (10 votes/wallet max)

## Phase D — Post-submit → judging (Dec 4–7+)

- [ ] Keep backend healthy — the gate fails closed; a dead API or stale
      RPC blocks promotion and kills the story
- [ ] Vote rally continues; monitor for sybil flags (organic only)
- [ ] Demo Day prep if shortlisted — offline pitch; confirm travel early,
      the event is in-person

## What 1st prize requires (the stretch list)

Third-tier execution is the floor. First prize adds:

- **Real traction, not vibes** — 20+ real creators, 50+ real mints, a
  week of daily battles with organic votes. Numbers we can cite on camera.
- **Every named ecosystem surface shipped** — DeWEB archive AND the
  circuit container AND mainnet product contracts, so "ecosystem
  integration" is maximal, not adequate.
- **The best demo video in the cohort** — the 2:35 script leads with a
  jaw-drop most entries can't produce: consumer AR that demos in 45s.
- **A visible vote count** — rally 50–200 holders. Judges see the number;
  a real community voting is itself evidence of traction.
- **Narrative** — "the only consumer product in the cohort with a
  load-bearing circuit" is a 1st-prize story if the traction is real.

## Risks

- **Traction decides it** — unfixable by code alone. 10–20 real creators
  with real mints is the honest floor; judges detect manufactured numbers.
  Small-and-real beats large-and-fake, but 1st needs real AND visible.
- **Backend dependency** — `eval()` runs through our backend; if it dies
  during judging, promotion breaks visibly. Monitor `/api/tapeout/status`.
- **Container hosting API is an open research item** — v1 spec page may
  hit API friction; fallback is hosting it inside the DeWEB archive site.
- **Vote rally depends on holdings** — eligible-vote mechanics tie votes
  to X Layer positions; our rally list must actually hold something.
