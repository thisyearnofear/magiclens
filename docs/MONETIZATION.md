# MagicLens Monetization Strategy

> **Status (Nov 2026): strategy doc, not shipped product.** Today the product
> is free end-to-end (testnet, free mints, free exports) — correct for the
> growth stage. This doc ranks the models, fixes the sequencing, and records
> the decisions that change product behavior.

## The frame

The landscape research already answered the hard question: speculation is
dead (Top Shot −95%), free-to-play won (Sorare Arcade: 1M+ users in 18
months). Mint infrastructure is commoditized — **we are the experience
layer, and the experience is the thing worth paying for.** The real
customer is the TikTok/Shorts edit maker, and CapCut proved that segment
pays for output quality. So: **CapCut's monetization shape applied to
sports fandom, with a daily on-chain ritual no editor app has.**

## Ranked models

### 1. Creator Pro tier — primary line

Gate the things creators actually pay for:

- Watermark-free export
- Longer clips (>30s) and higher-resolution export
- Audio tracks in remixes (the #1 product gap vs. TikTok edits anyway)
- More tracked subjects, finer tracking controls
- Custom/private overlay packs, batch renders

Free tier keeps everything needed to *compete* — mints, daily battles,
leaderboard, standard export. Never tax the battle loop itself.

### 2. Premium overlay packs — cosmetic sales

`match-day` stays free forever. Sell themed drops: Retro Broadcast, Anime
FX, Neon Trails, per-sport packs, seasonal events. This is the one Web3
sales mechanic that works at scale — it's Fortnite cosmetics, not Top
Shot moments. `WorldCupPack` (ERC-1155) already models purchasable packs;
the frontend purchase flow doesn't exist yet.

### 3. Sponsor / brand activations — B2B

A brand pays for a featured leaderboard day plus a branded overlay pack
("Brand X Goal Week — winner premiered in the Screening Room"). Largest
long-term line and the one partners understand instantly — but it needs a
measurable daily audience first. The Event primitive in PLATFORM_OVERVIEW
already reserves a sponsor slot.

### 4. Secondary royalties — passive

`seller_fee_basis_points: 500` is already in the RemixNFT contract
metadata. Treat as upside, not a plan — needs volume to matter.

### Explicitly avoided

- **Mint fees on fans** — contradicts free-to-play, taxes growth
- **Pay-to-win leaderboard mechanics** — poisons the contest
- **Token-price speculation mechanics** — the landscape already ran that
  experiment; it lost

## Sequencing

1. **Now:** free loop + creator seeding (TikTok playbook in
   `docs/GROWTH_INTEL.md`). Watermark = free distribution (see below).
2. **When export demand is proven:** Creator Pro tier.
3. **When there's pack envy:** premium pack drops + purchase flow.
4. **When there's a measurable daily audience:** sponsor activations.
5. **Rights unlock (B2B2C):** license the AR engine to clubs/leagues who
   own footage rights — they get a fan-engagement layer, we get official
   clips and distribution.

## Decision: export watermark

Exported videos carry a small "MagicLens" mark (bottom-right, ~45%
opacity) by default. Exports are **clean when the creator arrived via a
referral link** (`?ref=`) — the seeded-creator channel heuristic: seeded
creators produce portfolio-grade clips for TikTok where a watermark hurts,
organic users provide free distribution. Implemented in
`remix-exporter.ts` (`watermark` option) + `ARWorkspace` (referrer check).
Revisit when Creator Pro ships — Pro becomes the clean-export gate.

## Cross-sport expansion

The engine is sport-agnostic; only the grammar changes. Pose tracking,
body anchors, ghost trails and stat cards work on any athlete — a dunk, a
wicket celebration, a serve, a podium. Per-sport expansion is manifest
files + creator communities, not new engineering:

| Pack | Sport | Anchor grammar |
|------|-------|----------------|
| `match-day` (live) | Football | GOAL! banner, flag halos, ref cards |
| `game-night` | Basketball | DUNK! banner, jersey-color halos |
| `fight-night` | MMA/boxing | KO banner, corner stat cards |
| `grand-slam` | Tennis | Match Point banner, serve-speed card |

Each pack = one manifest + a leaderboard day + a creator seed list. The
daily-battle ritual ("Football Friday, Dunk Sunday") is the retention
mechanic — that's the moat, not the tracking tech anyone can license.

## What "premium Iconic Moments" actually means

Docs have long described Flow Iconic Moments as "premium minted NFTs
(primary sale)". Reality: they're auto-promoted for free by the scheduler.
Honest options when monetized:

- **Small promotion fee** — creators pay a few OKB to elevate their
  winning remix into the permanent Iconic archive (status purchase, not
  speculation)
- **Sponsored premieres** — the Screening Room slot is the sellable asset,
  not the mint
- Secondary royalties only (status quo) — fine until volume exists

Do NOT convert them into paid packs — that's the Top Shot model that died.
