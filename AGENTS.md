# MagicLens — AR Remix Layer for Live Sports

## Project Goal
A platform for pose-aware AR sports remixes minted as NFTs on **X Layer (EVM)** + **Flow (Cadence)**. Submitted to OKX X Cup hackathon (deadline: **May 28, 23:59 UTC**).

## Dual-Chain Architecture
- **X Layer**: Free remixes (ERC-721 via wagmi + RainbowKit), chain ID 1952 (testnet)
- **Flow**: Premium Iconic Moments (Cadence 1.0 NFTs via Flow CLI), network: testnet
- **Cross-VM**: Scheduler auto-promotes top-3 daily leaderboard entries → Flow Iconic Moments
- One connect button (wagmi + FCL RainbowKit adapter) — no chain pickers

## Current State
- Contracts deployed: RemixNFT/WorldCupPack/FanCastRewards on X Layer testnet, ARAssetNFT/CollaborationHub/ForteAutomation on Flow testnet at `0x4520a5a7b69ee3ac`
- Cross-VM mint confirmed working — 8 real Flow NFTs minted (tx history: `194be9eb`, `0ad06068`, `30549047`, `e82eb00`, `e307e5a`, `2bbed12`, `ef323d05`, `28b6c6e6`)
- Backend live at `https://magiclens.thisyearnofear.com` (FastAPI, 4 workers, PM2)
- Frontend live at `https://magiclens.vercel.app` (Next.js 16.2.6, React 19, Tailwind 3.4)
- "Seed Demo Data" button at `/iconic-moments` creates leaderboard + triggers cross-VM mint
- Pre-commit hook fixed (removed broken `lint-staged@17.0.5`, uses direct eslint + hardhat)

## Commands
- **Dev**: `npm run dev` (frontend, Next.js dev server)
- **Build**: `npm run build` (frontend), `cd services && pip install -e .` (backend)
- **Lint**: `npm run lint` (eslint src/)
- **Typecheck**: `npm run typecheck` (tsc --noEmit --skipLibCheck)
- **Deploy backend**: `bash deploy/deploy.sh` (build-local → rsync → symlink → pm2 reload)

## Key Decisions
- Flow CLI (`flow transactions send`) for Cadence 1.0 signing — not Python ECDSA — binary at `/home/deploy/.local/bin/flow`
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

## Next Steps
1. ~~Fix metadata URIs — replace `ipfs://demo/...` with API metadata endpoint~~ ✅ Done
   - Added `token_metadata` DB table + `POST /api/metadata/RemixNFT/{token_id}` endpoint
   - `GET /api/metadata/RemixNFT/{token_id}` now returns stored per-token metadata with personalized name, description, image, attributes
   - `useMintRemix.ts` POSTs metadata to backend after each successful mint
2. ~~Add leaderboard close-day UI on frontend~~ ✅ Done
   - "Close Day" button in `Leaderboard.tsx` increased from `h-7 text-[10px]` to `h-9 text-xs font-semibold`
   - After closing, immediately triggers `triggerAutoPromote()` — no more 60s wait
   - Added "Close Day & Promote" button to `/iconic-moments` gallery
3. Aligned card backgrounds across all pages to `bg-white/5 border-white/10` glass morphism
   - Fixed: CollabPreview, CollabRequest, OverlaySelector, EnvironmentalFootageGallery, FlowDashboard, Dashboard notification button, UserProfile
