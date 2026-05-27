# MagicLens — Hackathon Strategy: OKX X Cup (X Layer)

> Status: **active strategy** for the OKX X Cup World Cup hackathon (submission deadline May 28, 23:59 UTC). This document is the single source of truth for hackathon positioning, scope, and post-hackathon longevity.

## 1. Positioning

**One-liner:**
> MagicLens is the AR remix layer for live sports. Every iconic moment becomes a mintable, remixable, ownable piece of fan culture. We launch with the **2026 FIFA World Cup**.

**Why this framing:**
- The hackathon requires a World Cup theme on X Layer, but the underlying primitives (pose-aware AR, overlay packs, remix-as-NFT, creator rewards) generalize to **any** live sports event.
- World Cup is the *launch event*, not the product. Post-hackathon we roll into Wimbledon, NBA Finals, F1, UFC, Champions League, Olympics 2028.
- Reframing from "AR video editor" → "AR remix layer for live sports" tells a much bigger market-potential story to judges and post-hackathon investors/grants.

**Pitch line for judges:**
> "Prediction markets monetize *opinions* about the World Cup. MagicLens monetizes the *content* — every fan edit becomes an onchain asset on X Layer. We turn 5 billion viewers into 5 billion potential creators."

## 2. Product Primitive: the "Event"

Internally structure the product around a first-class **Event** primitive. Each Event ships:

- a curated **AR Pack** (overlays, GIFs, sounds) — onchain (ERC-1155 on X Layer)
- an onchain **Remix Feed** — user-minted remix NFTs (ERC-721 on X Layer)
- a **Leaderboard + Rewards Treasury** — USDT/OKB distributed to top remixers
- an **"Iconic Moment"** curator tier — premium NFTs minted on Flow Cadence
- optional **sponsor slot** (broadcaster, federation, brand)

Launch Event: **FIFA World Cup 2026**.
Roadmapped Events: Wimbledon 2026, NBA Finals 2026, Champions League final, F1 season finale, Olympics LA 2028.

## 3. Dual-Chain Architecture: Flow + X Layer

Flow's Crescendo upgrade (Sept 2024) and Forte made it a dual-VM chain (native Cadence + full EVM equivalence) with atomic cross-VM transactions via Cadence-Owned Accounts (COAs) and the VM Bridge. We exploit this rather than choosing.

```diagram
╭──────────────────────────────────────────────────────────────────╮
│                       MagicLens App                              │
│           (React + AR editor + MediaPipe pose pipeline)          │
╰────────────────────┬─────────────────────────────────────────────╯
                     │  FCL + wagmi (cross-VM hooks)
                     │  Single connect button. No chain pickers.
        ╭────────────┴────────────╮
        ▼                         ▼
╭───────────────────╮   ╭───────────────────────╮
│  X Layer (EVM)    │   │  Flow (Cadence + EVM) │
│  Hackathon venue  │   │  Long-term consumer   │
│                   │   │  UX home              │
│ • WorldCupPack    │   │ • ARAssetNFT.cdc      │
│   (ERC-1155)      │   │   (existing, premium) │
│ • RemixNFT (721)  │   │ • CollaborationHub    │
│ • FanCastRewards  │   │ • ForteAutomation     │
│   (USDT / OKB)    │   │ • Gasless tx + AA     │
│                   │   │ • Native VRF for      │
│ Why: OKX traffic, │   │   "moment of the day" │
│ judges' criteria, │   │ • Iconic Moment NFTs  │
│ EVM dev tooling   │   │   (Top-Shot lineage)  │
╰───────────────────╯   ╰───────────────────────╯
        ▲                         ▲
        ╰──── LayerZero / ────────╯
              Celer cBridge / VM Bridge
              (assets + messages)
```

### Responsibility split

| Capability | Chain | Why |
|---|---|---|
| Consumer onboarding, gasless tx, social login, account abstraction | **Flow** | Protocol-level AA, gasless, $0.00004/tx, 14M+ Ticketmaster on-chain accounts precedent |
| Iconic-moment NFT minting (curated, rare) | **Flow Cadence** | NBA Top Shot / NFL All Day lineage. Sports IP belongs here. Cadence resource model is genuinely safer for collectibles. |
| Fan remix NFTs, leaderboard, USDT/OKB rewards | **X Layer** | Hackathon requirement, OKX/OKB liquidity, EVM-native tooling, low fees |
| Cross-chain settlement (burn-remix-on-X-Layer → unlock-bonus-on-Flow) | **LayerZero / VM Bridge + Celer** | Real interop story — flagship cross-VM consumer app |

### Seamless UX rules (non-negotiable)

1. **One login.** FCL + RainbowKit adapter. User connects an OKX Wallet (or any EVM wallet) and receives both an EVM address and a Flow COA derived from it.
2. **Chain choice is implicit, never a question.** "Mint Remix" → X Layer by default; "Iconic Moment" badge → Flow Cadence. No dropdowns.
3. **Single signature for cross-VM actions.** Use Flow's batched EVM transactions / Cadence scripted tx so "mint remix + claim reward + post to leaderboard" is one signature.
4. **Display one balance.** Aggregate USDT/OKB on X Layer + FLOW on Flow into a single Wallet widget.
5. **Gas abstraction.** Sponsor gas on Flow; paymaster pattern on X Layer so users never see "buy OKB to mint."

## 4. Hackathon Scope (7 days)

1. **Brand reframe** — update README + landing page to "AR Remix Layer for Live Sports. Launching with FIFA World Cup 2026."
2. **Solidity contracts on X Layer testnet** (Hardhat or Foundry):
   - `WorldCupPack` (ERC-1155) — curated AR overlay packs
   - `RemixNFT` (ERC-721) — user-minted remixes
   - `FanCastRewards` — USDT/OKB distribution to top remixers
3. **OKX Wallet via wagmi** alongside existing Flow auth in `app/src/auth`, using FCL's RainbowKit adapter for one connect button.
4. **Keep existing Cadence contracts** (`ARAssetNFT.cdc`, `CollaborationHub.cdc`, `ForteAutomation.cdc`) on Flow. Pitch them as the premium / curator tier. No rewrite.
5. **World Cup overlay pack** — 10–20 assets: 32 country flag halos, "GOAL!" lower-thirds, trophy confetti, ref-card overlays, commentator-style overlays.
6. **Demo flow:**
   - Match clip → drop flag + confetti overlay → one-click mint on X Layer → appears on leaderboard → top-3 of the day auto-minted as a Flow "Iconic Moment" NFT (cross-VM payoff shot).
7. **Social presence** — @magiclensx on X, tag @XLayerOfficial + @flow_blockchain, post daily progress (hackathon hard requirement).
8. **2-minute demo video** ending on: *"Today: World Cup. Next: Wimbledon, NBA Finals, F1. The AR remix layer for every sport."*

## 5. Judging Alignment

| Criterion | How we win it |
|---|---|
| **Innovation** | Nobody else ships working AR + MediaPipe pose detection + cross-VM mint in a 10-day hackathon. UGC AR remix is a fresh angle vs. yet another prediction market. |
| **Market potential** | Fan-edit virality is the native unit of every World Cup (TikTok edits, but ownable). Sports generalization story = platform, not one-off. |
| **Completion** | Existing editor, pose analysis, GIF integration, collab layer already work. Hackathon delivery is contracts + minting flow + World Cup pack — all demonstrable + on-chain verifiable. |
| **Demo video (bonus)** | 2-min cut with one clear cross-VM payoff shot. |

## 6. Post-Hackathon Funding / Grant Narratives

The dual-chain story unlocks **three credible funding doors instead of one**:

- **OKX / X Layer ecosystem grants** — "Consumer AR + UGC traffic to X Layer at the biggest sports event of the decade."
- **Flow Foundation (Forte / Builder grants)** — "Flagship cross-VM consumer app extending Flow's sports-NFT dominance (NBA Top Shot, NFL All Day) into user-generated AR."
- **Sponsors / federations / broadcasters** — Adidas, Nike, ESPN, broadcasters want fan-generated content rails they can plug into.

## 7. Risk-Honest Notes

- **Non-negotiable:** at least part of the project MUST be deployed on X Layer per the hackathon FAQ. If we skip the Solidity work, we don't qualify.
- **Substantial new development** during the hackathon period is required for existing projects. The X Layer contracts + cross-VM mint flow + World Cup pack satisfy this cleanly.
- **Daily public posting on X** is a hard requirement, not a nice-to-have.
- We deliberately do **not** rewrite Cadence → Solidity. Flow stays the home of premium / iconic-moment NFTs; X Layer is the high-volume UGC + rewards venue.

## 8. References

- Hackathon page: https://web3.okx.com/xlayer/build-x-hackathon/xcup
- Submission: Google Form linked from hackathon page, deadline May 28 23:59 UTC
- Flow Crescendo / EVM equivalence: https://flow.com/upgrade/crescendo/evm
- Flow cross-VM tutorials: https://developers.flow.com/blockchain-development-tutorials
- Flow bridges (LayerZero, Celer, Axelar, Bridge.Flow.com): https://developers.flow.com/ecosystem/bridges
- X Layer docs: https://web3.okx.com/xlayer
- X Layer Builder Hub (Telegram support): https://t.me/+JInfz0yF9ihjNGE1
