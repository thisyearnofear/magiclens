# TapeOut Accelerate — Win Plan

> Written Nov 17, 2026. Submission deadline **Dec 7, 23:59 UTC** (20 days).
> Target submission date: **Dec 4** — never submit on deadline day.
> Entry copy lives in `TAPEOUT_SUBMISSION.md`; this doc is the execution plan.

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

- [ ] Generate the DeWEB archive via `scripts/export_deweb_archive.py`;
      produce the upload-ready folder with a day-by-day verdict index
- [ ] Write the circuit's container spec page (v1 per submission doc):
      "I am ICONIC-GATE" — netlist, truth table, tapeout tx, processor
      address. Static HTML, DeWEB-uploadable
- [ ] Deploy RemixNFT + CreatorPass to X Layer **mainnet 196**; add env
      wiring so prod can point at mainnet while dev/test stays on 1952
- [ ] Finalize submission doc — fill ⟦ ⟧ placeholders, refresh "new work
      in window" list (AR rebuild, export, public replay, CreatorPass,
      mobile tracking are all Oct 16+)
- [ ] Produce the demo video shotlist + script from the existing outline;
      add 20s of the new mobile Track Player flow (the jaw-drop shot)
- [ ] Write the creator-seeding kit: `?ref=` links, the tester script
      (already drafted), target list from `GROWTH_INTEL.md`

## Phase B — User executes (Nov 20–27, wallet + content)

These require your keys/identity — Devin can't do them:

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

## Risks

- **Traction is unfixable in 20 days at scale** — the honest mitigation is
  10–20 real creators with real mints, not manufactured numbers. Judges
  can tell; a small real base beats a fake large one.
- **Backend dependency** — `eval()` runs through our backend; if it dies
  during judging, promotion breaks visibly. Monitor `/api/tapeout/status`.
- **Container hosting API is an open research item** — v1 spec page may
  hit API friction; fallback is hosting it inside the DeWEB archive site.
- **Prize realism** — 1st ($20k) likely needs real users we won't have.
  A 3rd-tier prize ($6k, five slots) is the honest target: complete
  submission + load-bearing circuit + visible ecosystem usage beats most
  entries on completeness and originality.
