# MagicLens Development Roadmap

> **Positioning (May 2026):** MagicLens is the **AR remix layer for live sports**. The 2026 FIFA World Cup is our launch event, not our product. See [HACKATHON_STRATEGY.md](./HACKATHON_STRATEGY.md) for the full strategic plan.

## 🎯 Current Focus — OKX X Cup Hackathon (now → May 28)

**Goal:** Ship the X Layer slice of MagicLens — turn the existing AR + pose pipeline into a sports-remix protocol with the World Cup as the launch Event.

### ✅ Already Built (carries into hackathon submission)
- Flow blockchain authentication with cryptographic signature verification
- Video upload, storage, and asset management (PostgreSQL)
- AR Editor for overlay positioning and timing
- Real MediaPipe pose detection (85–90% accuracy) with caching
- Tenor / GIPHY / Pexels overlay integration
- Real-time collaboration server (Socket.IO)
- Cadence contracts: `ARAssetNFT.cdc`, `CollaborationHub.cdc`, `ForteAutomation.cdc`

### 🚧 Hackathon Build (7-day sprint)
- [ ] **Brand reframe** — "AR Remix Layer for Live Sports" across README + landing page
- [ ] **Solidity contracts on X Layer testnet** (Hardhat/Foundry):
  - `WorldCupPack` (ERC-1155) — curated AR overlay packs
  - `RemixNFT` (ERC-721) — user-minted remixes
  - `FanCastRewards` — USDT/OKB rewards to top remixers
- [ ] **OKX Wallet via wagmi + FCL RainbowKit adapter** — one connect button, two chains under the hood
- [ ] **Cross-VM mint flow** — daily top-3 remixes from X Layer auto-minted as Flow "Iconic Moment" NFTs
- [ ] **World Cup overlay pack** — 10–20 curated AR assets (32 country flag halos, "GOAL!" lower-thirds, trophy confetti, ref-card overlays)
- [ ] **@MagicLensAR on X** — daily progress posts, tagging @XLayerOfficial + @flow_blockchain
- [ ] **2-min demo video** ending on the multi-sport roadmap teaser
- [ ] **Submission** via Google Form before May 28, 23:59 UTC

---

## 🏆 Phase 1: Multi-Event Platform (June – August 2026)

**Theme:** Prove the Event primitive generalizes beyond the World Cup.

### Event Engine
- [ ] First-class `Event` primitive (curated AR pack + remix feed + leaderboard + treasury + sponsor slot)
- [ ] Self-serve Event creation flow for partners/federations
- [ ] Event-scoped analytics and engagement dashboards

### Sports Event Launches
- [ ] **Wimbledon 2026** Event drop (tennis-specific overlays: ace celebrations, court overlays)
- [ ] **NBA Finals 2026** Event drop (dunk FX, team color halos, score overlays)
- [ ] **Champions League final** Event drop
- [ ] Pilot partnership with at least one federation / broadcaster / brand

### Cross-VM UX Polish
- [ ] Single aggregated wallet widget (USDT/OKB on X Layer + FLOW on Flow)
- [ ] Gas sponsorship / paymaster pattern on X Layer
- [ ] Batched cross-VM signatures via Flow scripted transactions
- [ ] Cross-chain reward bridging (LayerZero or Celer)

### Marketplace
- [ ] Secondary market for AR Pack ERC-1155s on X Layer
- [ ] Royalty splits between pack creators, remixers, and platform
- [ ] Curator program for "Iconic Moment" Flow NFTs

---

## 🌍 Phase 2: Creator Economy & Live Capture (Q4 2026)

### Live Sports Capture
- [ ] **Live broadcast clip ingest** — pull short clips from live feeds (rights-permitting) for instant remixing during the event
- [ ] Real-time leaderboard updates during live matches
- [ ] Push notifications for "moment of the match" mint windows

### AR Authoring for Creators
- [ ] **Creator SDK** — designers upload custom packs that conform to pose-aware overlay spec
- [ ] In-app preview studio
- [ ] Pack revenue dashboard with onchain settlement

### Mobile-First Experience
- [ ] Mobile web optimization for capture + remix
- [ ] PWA install flow with camera access
- [ ] Native share to TikTok / X / Instagram (with onchain provenance link back)

---

## 🚀 Phase 3: Scale & Native AR (2027+)

### Olympics LA 2028 (the big moment)
- [ ] Multi-sport Event series across the entire Olympic calendar
- [ ] Country-level leaderboards
- [ ] Athlete and federation partnership program

### Native AR
- [ ] WebAR live preview (AR.js + A-Frame) for capture-side overlays
- [ ] Markerless pose-tracked AR for on-device authoring
- [ ] iOS / Android native app with ARKit / ARCore

### Platform Expansion
- [ ] Public API for third-party clients (highlight shows, fantasy apps, sportsbooks for non-gambling content)
- [ ] White-label "remix layer" for broadcasters
- [ ] Esports vertical (Worlds, The International, Majors)

---

## 📊 Success Metrics

### Hackathon
- Submitted on X Layer by May 28
- Demo video published
- 7+ days of @MagicLensAR posts tagging @XLayerOfficial
- One full cross-VM mint flow demoable (X Layer remix → Flow Iconic Moment)

### Phase 1 (3 months)
- 3 sports Events launched beyond the World Cup
- 5,000+ remix NFTs minted on X Layer
- 1 federation / broadcaster / brand partnership signed
- $25K+ in onchain rewards distributed

### Phase 2 (6 months)
- 25,000+ active monthly remixers
- 100+ third-party AR packs in the marketplace
- Mobile PWA shipped with >40% of sessions on mobile

### Phase 3 (Olympics target)
- 1M+ remixes minted across the Olympic calendar
- Native iOS/Android apps shipped
- Multiple federation-level partnerships

---

## 🛠 Technical Considerations

### Why Flow + X Layer (not either alone)
- **X Layer**: hackathon requirement, OKX traffic, EVM tooling, USDT/OKB liquidity, low fees
- **Flow**: protocol-level account abstraction, gasless tx, native VRF, sports-NFT lineage (NBA Top Shot, NFL All Day, Ticketmaster), Cadence safety for premium collectibles
- Crescendo (Sept 2024) gives Flow full EVM equivalence + cross-VM atomic transactions via COAs, so the dual-chain UX is achievable, not theoretical

### Seamless cross-chain rules
1. One login (FCL + RainbowKit adapter)
2. Chain choice implicit (Remix → X Layer; Iconic Moment → Flow)
3. Single signature for cross-VM batches
4. One aggregated balance view
5. Gas abstraction on both chains

### Risks & Mitigations
- **Live sports rights** — start with user-uploaded clips and public-domain footage; pursue federation deals in Phase 1+
- **Cross-chain bridge failures** — use audited bridges (LayerZero, Celer); fall back to single-chain mint with deferred cross-VM payoff
- **Pose detection cost at scale** — keep aggressive caching layer; consider on-device MediaPipe for capture-side work

---

## 💡 Why This Wins (Hackathon and Beyond)

1. **Differentiation:** AR + UGC + NFT is a fresh angle vs. yet another prediction market or fan token.
2. **Market potential:** Fan video remixes are the native viral unit of every World Cup, every Olympics, every Final.
3. **Completion:** Most of the hard tech (pose detection, AR editor, collaboration) already works. Hackathon work is contracts + integration + curated pack.
4. **Longevity:** "AR remix layer for live sports" has a 4-year compounding flywheel: every major sports event becomes a new traffic spike and content drop.

---

*This roadmap supersedes prior plans. Living document — updated as Events ship and partnerships are signed.*
