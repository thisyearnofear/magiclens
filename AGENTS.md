# MagicLens — AR Remix Layer for Live Sports

## Project Goal
A platform for pose-aware AR sports remixes minted as NFTs on **X Layer (EVM)** + **Flow (Cadence)**. Submitted to OKX X Cup hackathon (deadline: **May 28, 23:59 UTC**).

## Dual-Chain Architecture
- **X Layer**: Free remixes (ERC-721 via wagmi + RainbowKit), chain ID 1952 (testnet)
- **Flow**: Premium Iconic Moments (Cadence 1.0 NFTs via Flow CLI), network: testnet
- **Cross-VM**: Scheduler auto-promotes top-3 daily leaderboard entries → Flow Iconic Moments
- One connect button (wagmi + FCL RainbowKit adapter) — no chain pickers

## Current State
- Contracts deployed: RemixNFT/WorldCupPack/FanCastRewards/CreatorPass (`0x02b07d2043263d579C4E1Ac5Abe79C07Ad3b7D2D` — priced Pro pass, 0.01 OKB) on X Layer testnet, ARAssetNFT/CollaborationHub/ForteAutomation on Flow testnet at `0x4520a5a7b69ee3ac`
- Cross-VM mint confirmed working — 8 real Flow NFTs minted (tx history: `194be9eb`, `0ad06068`, `30549047`, `e82eb00`, `e307e5a`, `2bbed12`, `ef323d05`, `28b6c6e6`)
- Backend live at `https://magiclens.thisyearnofear.com` (FastAPI, 4 workers, PM2) — deployed on **nuncio-vultr** (migrated from snel-bot July 2026)
- Frontend live at `https://magiclens.vercel.app` (Next.js 16.2.6, React 19, Tailwind 3.4)
- "Seed Demo Data" button at `/iconic-moments` creates leaderboard + triggers cross-VM mint
- UX delight overhaul shipped (`docs/UX_DELIGHT_PLAN.md`): two-step clip consent, ghost-while-tracking + lock-on reticle, "Place manually"/"Follow player" modes, `ExportSuccess` payoff panel, editor smart guides (frame + pose-landmark snap), mobile snap carousel, anonymous funnel events via `src/lib/funnel.ts` (`window.__mlFunnel`, beacon gated on `NEXT_PUBLIC_FUNNEL_ENDPOINT`)
- Pre-commit hook fixed (removed broken `lint-staged@17.0.5`, uses direct eslint + hardhat)

## Server Infrastructure (nuncio-vultr)
- **Server**: nuncio-vultr (`144.202.117.160`), user `linuxuser`, 109GB disk
- **Backend port**: 8200 (changed from 8100 after genblaze-worker took 8100)
- **Project dir**: `/opt/magiclens/` with `current` symlink → `releases/<timestamp>/`
- **Python venv**: `/opt/magiclens/venv/` (Python 3.12, shared across releases)
- **PM2 process**: `magiclens-api` (uvicorn, 4 workers, port 8100)
- **Flow CLI**: `/home/linuxuser/.local/bin/flow` (installed via install script)
- **Redis**: `redis://localhost:6379/0` via dedicated `magiclens-redis` container (`-p 127.0.0.1:6379:6379`, unless-stopped). Do NOT rely on `coolify-redis` — it publishes no host port. If render-dequeue 111s appear, check the container is up.
- **Deploy gotcha (Nov 2026):** the wheel only installs declared deps — `core/computer_vision.py` imports `mediapipe`, now pinned in `services/pyproject.toml`. Any new third-party import must be added there or prod crash-loops.
- **DB**: Neon Postgres (external, connection string in `.env`)
- **TLS/proxy**: Coolify Traefik routes `magiclens.thisyearnofear.com` → `host.docker.internal:8200` (dynamic config at `/data/coolify/proxy/dynamic/magiclens.yaml`)
- **UFW**: Docker subnet `10.0.0.0/8` allowed to port 8200

## Commands
- **Dev**: `npm run dev` (frontend, Next.js dev server)
- **Build**: `npm run build` (frontend), `cd services && pip install -e .` (backend)
- **Lint**: `npm run lint` (eslint src/)
- **Typecheck**: `npm run typecheck` (tsc --noEmit --skipLibCheck)
- **Deploy backend**: `bash deploy/deploy.sh` (build-local → rsync → symlink → pm2 reload, targets nuncio-vultr)

## Key Decisions
- Flow CLI (`flow transactions send`) for Cadence 1.0 signing — not Python ECDSA — binary at `/home/linuxuser/.local/bin/flow`
- Contracts-cadence not synced to server; `flow.json` at `/opt/magiclens/flow.json` with `magiclens-testnet` account key
- `--signer magiclens-testnet` + `--output json` + inline `--args-json` for CLI invocations
- All 3 Flow contracts deployed to same account for simplicity
- `.husky/pre-commit` runs `scripts/check-secrets.sh`, then eslint + hardhat compile conditionally

## Important Files
- `services/core/crossvm_service.py`: Cross-VM mint orchestrator, Flow CLI subprocess, event parsing for NFT ID extraction
- `services/core/leaderboard_service.py`: Leaderboard state machine + auto-promote scheduler (60s polling)
- `services/api/routes.py`: All API endpoints including `POST /api/demo/seed`
- `contracts-cadence/ARAssetNFT.cdc`: Cadence 1.0 NFT contract, events: `Minted(id, creator)`, `Deposit(id)`
- `src/components/IconicMomentsGallery.tsx`: Gallery of Flow-minted NFTs with FlowScan links
- `src/lib/crossvm-client.ts`: TypeScript client for all cross-VM and leaderboard API calls
- `deploy/deploy.sh`: Backend deployment script (rsync from local `services/`)
- `deploy/ecosystem.config.js`: PM2 config with PATH env for flow binary

## Frontend Motion + Engagement Loops (Nov 2026)
- **Motion system** (Codrops-inspired, zero new deps — framer-motion + rAF + SVG/canvas only): `MagneticButton`, `CursorGlow` (desktop pointer only), `GoldCausticOverlay` (rank-1), `LeaderboardHoverReveal` (cursor-follow media preview, velocity lean, edge flip), `KineticHeroTitle`, `IconicFilmstrip` (drag reel + FLIP editorial detail in `IconicMomentFocus`), `MeltDivider`, `FilmGrain`, `VinylLoader`, `FerroSoundToggle`, `HollowStage`, gooey sliding tab pill (`BottomTabBar` layoutId), `SeamTransition` (pathname melt wipe)
- **Codrops refresh (Nov 2026, `src/components/motion/` — see `docs/CODROPS_DESIGN_PLAN.md`):** `MotionTrail` + `WavingFlag` + `GiantTypeDivider` (REMIX/COMPETE/PREMIERE) + `ScrollHighlight` + `KineticHeader` on landing; `ScrollRotateCard` + `PixelImage` in `ClipPicker`; `ElasticColumns` + `ScrambleText` (hashes/creators) in `IconicMomentsGallery`; `ParticleBurst` + `useFlightToLeaderboard` (CSS offset-path to `[data-flight-target="leaderboard"]`) on vote/mint; `GooeyStrand` on `MobileNav`; `SeatMap`/`SeatedStage` in Screening Room premiere mode
- **Dark-only app:** ThemeProvider's `getEffectiveMode` is pinned to `"dark"` — the whole library assumes dark surfaces (`bg-white/5`, `text-white`); system light mode rendered washed-out. `<html className="dark">` is set in `layout.tsx`. Stadium photo is landing-only; app pages use `PageBackdrop` (flat `#08070d` + accent glow). Fonts: Space Grotesk → `--font-display`/`font-display`, JetBrains Mono → `--font-mono`
- **Engagement loops**: referral `?ref=` → landing banner ("Invited by 0x… — mint to give +200 votes") → `useReferrer` persist → claim on mint; duet deep link `/remix?duet={tokenId}&title=&votes=&creator=` from Beat This cards + duel banner in `RemixFlow`; streak badge (`computeStreak`) in Your Remixes; 9:16 share-card export (canvas PNG) + Post to X + Copy in `IconicMomentFocus`
- **Backend cost fix**: auto-promote 60s scheduler disabled (was keeping Neon awake 24/7); promotion via "Close Day & Promote" button; `/health` lightweight (no DB probe); DB pool `min_size=0, max_idle=300s`; pose-cache hourly cleanup disabled
- **Infra**: backend port 8100 → 8200 (genblaze-worker took 8100); `SERVER_PORT=8200` in `.env.example` + ecosystem config

## Next Steps
1. ~~Fix metadata URIs — replace `ipfs://demo/...` with API metadata endpoint~~ ✅ Done
   - Added `token_metadata` DB table + `POST /api/metadata/RemixNFT/{token_id}` endpoint
   - `GET /api/metadata/RemixNFT/{token_id}` now returns stored per-token metadata with personalized name, description, image, attributes
   - `useMintRemix.ts` POSTs metadata to backend after each successful mint
2. ~~Add leaderboard close-day UI on frontend~~ ✅ Done
   - "Close Day" button in `Leaderboard.tsx` increased from `h-7 text-[10px]` to `h-9 text-xs font-semibold`
   - After closing, immediately triggers `triggerAutoPromote()` — no more 60s wait
   - Added "Close Day & Promote" button to `/iconic-moments` gallery
3. ~~Aligned card backgrounds across all pages to `bg-white/5 border-white/10` glass morphism~~ ✅ Done
   - Fixed: CollabPreview, CollabRequest, OverlaySelector, EnvironmentalFootageGallery, FlowDashboard, Dashboard notification button, UserProfile
4. ~~Flow NFT mediaURI (resolveView dynamic URL)~~ ✅ Done
   - Cadence 1.0 blocks adding fields during contract updates
   - `resolveView` now returns `https://magiclens.thisyearnofear.com/api/metadata/IconicMoment/{self.id}` dynamically
   - `ARAssetNFT.cdc` deployed (unchanged field layout, only `resolveView` body changed)
   - `MintIconicMoment.cdc` uses 3 params (no mediaURI)
   - `crossvm_service.py` sends 3 args (no media_uri)
   - New `GET /api/metadata/IconicMoment/{token_id}` endpoint on backend

## Positioning & Landscape (Nov 2026 research)

- **Rating:** Skins Challenge entry 8/10 (live URL, integrated premieres); product overall 7.5/10 (needs real users, mainnet).
- **Landscape:** speculation died, free-to-play won (Sorare Arcade: 1M+ users/18mo, +85% revenue H1 2026; Top Shot -95%, Chiliz -96%). Mint infra commoditized (Zora/Manifold/Highlight) — we are the experience layer, not infra.
- **Wedge vs Top Shot (also on Flow):** they sell top-down licensed packs; we crown bottom-up fan remixes daily. Line: "Top Shot sells you the moment. MagicLens lets you make it."
- **Rights rule:** UGC remixes of your own clips only — never imply licensed league footage (Top Shot buyers get a personal licence, not footage).
- **Positioning statement:** "MagicLens — the free-to-play AR remix battle for live sports. Fans create, the crowd crowns one Iconic Moment a day, premiered in the Screening Room, minted free on X Layer and elevated to Flow."
- **Next window:** X Cup + Hook x World Cup are over; TapeOut Accelerate live until Dec 7, 2026 (+ continuous Super Nova track).

## Growth Intel (Nov 2026)

- **TikTok data validates the wedge:** top "football edit" videos hit 16–31.5M plays in the last 30 days, all fan-made remixes built with generic CapCut tooling — no dedicated sports-remix product exists. Fans reward star players, nostalgia, celebrations; sound drives edits. Full findings + Monid endpoint map + playbooks (weekly trend check, creator seed list, launch listening, competitor watch): `docs/GROWTH_INTEL.md`.
- **Growth loop:** recruit mid-tier TikTok edit creators → they remix with MagicLens → 9:16 share-cards back to TikTok → signups. Share-card export already exists in `IconicMomentFocus`.

## TapeOut Accelerate Readiness (Nov 2026)

- **Event:** Oct 16 – Dec 7 2026, 23:59 UTC, 100K USDT (1st 20K, 2nd x5 10K, 3rd x5 6K). Shortlisted teams attend offline Demo Day. Only work done Oct 16–Dec 7 is judged. Target submission: Dec 4.
- **Entry rule:** use TapeOut circuits/contracts/on-chain data on X Layer (interfaces may run off-chain) OR run on X Layer DeWEB. Existing projects eligible with substantial new work. Submit via Google Form + ≤3 min demo video (problem, demo, users, revenue, TapeOut usage).
- **Criteria:** user value & commercial potential, innovation, ecosystem integration (DeWEB/FabX/TapeCode/TapeKit/TapeSend), product readiness & UX.
- **Verified X Layer (chainId 196) contracts:** factory `0x1f09daefA827f02CBB40967cc91b259763760761` (cpuAt(0)=Genesis `0x839bdd…`), opener `0x536add…50106`, SiteRegistry `0xd6efb7…9adb6`, binding `0x68809f…66f9`. RPCs: rpc.xlayer.tech, xlayerrpc.okx.com.
- **LIVE integration — ICONIC-GATE, circuit #20** on OrderGuard `0x57F319CF056F72F48cF1dbb670F2A3DB007Aa355` (X Layer mainnet 196). 46-gate NAND, 14 in / 5 out, depth 9, exhaustively verified (16,384 combos). `process_day()` fails closed if `eval()` rejects — the circuit is load-bearing, not decorative. Verdicts journaled + surfaced in UI ("Cleared by TapeOut #20"); Screening Room "Live Verify" reruns `eval` via `eth_call`. Status: `/api/tapeout/status` → `enabled:true`. Circuit does NOT verify raw vote counts — packed policy bits only.
- **Entry assets built:** `scripts/export_deweb_archive.py` (upload-ready static archive, verified 14 moments/5 files) · `tapeout/container/index.html` (circuit spec page for ERC-6551 container) · `contracts-solidity/scripts/deploy-mainnet.ts` (Pack+RemixNFT+CreatorPass → 196, balance-gated) · `docs/DEMO_VIDEO_SCRIPT.md` (2:35 shot list) · plan: `docs/TAPEOUT_PLAN.md` · entry copy: `docs/TAPEOUT_SUBMISSION.md`.
- **BLOCKER:** mainnet deployer `0xc8d8EbCBA4149190B93Ab95fbC4e2F17CcdaF7A5` has 0 OKB on 196 — fund it, then run deploy-mainnet.ts.
- **Wallet-required playbook (user does these):** 1) fund mainnet deployer; 2) id.tapeout.link → one-click container; 3) upload `deweb/` + container page via HashPort (2 sigs), bind `tape://` name; 4) register project on voting page + rally votes; 5) record demo video per script; 6) first mainnet CreatorPass purchase; 7) seed 10–20 creators via `?ref=`; 8) submit form by Dec 4.
