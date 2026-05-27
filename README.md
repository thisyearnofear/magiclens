# MagicLens — The AR Remix Layer for Live Sports

[![Frontend](https://img.shields.io/badge/Frontend-magiclens.vercel.app-blueviolet)](https://magiclens.vercel.app)
[![Backend](https://img.shields.io/badge/API-magiclens.thisyearnofear.com-blue)](https://magiclens.thisyearnofear.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![X Layer](https://img.shields.io/badge/Chain-X%20Layer%20Testnet-orange)](https://www.oklink.com/xlayer-testnet)
[![Flow](https://img.shields.io/badge/Chain-Flow%20Testnet-00ef8b)](https://testnet.flowscan.org)

> **OKX X Cup Hackathon submission.** Dual-chain (X Layer + Flow) platform turning every iconic sports moment into a mintable, remixable, ownable NFT. Cross-VM auto-promote scheduler mints real Flow Cadence NFTs from X Layer ERC-721 remixes — proven on testnet with 8 onchain transactions.

---

## ✨ One-Minute Demo

1. **Connect wallet** at [magiclens.vercel.app](https://magiclens.vercel.app) — RainbowKit supports OKX Wallet, MetaMask, WalletConnect
2. **Create a Remix** — pick a match clip, drop AR overlays, mint as ERC-721 on X Layer
3. **[Seed Demo Data](https://magiclens.vercel.app/iconic-moments)** — creates 5 leaderboard entries, closes the day, auto-promotes top-3 to Flow Iconic Moments
4. **See the cross-VM result** — galleries at `/iconic-moments` show minted Flow NFTs with FlowScan links

**No chain picker needed.** One connect button handles both X Layer (wagmi) and Flow (FCL).

---

## 🧱 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 16)                       │
│  RainbowKit + wagmi (X Layer)  │  FCL (Flow)  │  Pose Detection │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────────┐
│              Backend (FastAPI · Neon PostgreSQL · Redis)          │
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ RemixNFT API    │  │ Leaderboard      │  │ Referral System │  │
│  │ (metadata)      │  │ (state machine)  │  │ (?ref= tracking)│  │
│  └────────┬────────┘  └────────┬─────────┘  └─────────────────┘  │
│           │                    │                                   │
│           │     ┌──────────────▼──────────────┐                   │
│           │     │ Cross-VM Scheduler (60s)    │                   │
│           │     │ Auto-promotes top-3 daily   │                   │
│           └─────► to Flow Cadence NFTs        │                   │
│                 └──────────────┬──────────────┘                   │
└────────────────────────────────┼──────────────────────────────────┘
                                 │ Flow CLI subprocess
┌────────────────────────────────▼──────────────────────────────────┐
│  X Layer Testnet (Chain ID 1952)     │  Flow Testnet               │
│  ┌──────────────────────────┐        │  ┌───────────────────────┐  │
│  │ RemixNFT (ERC-721)      │        │  │ ARAssetNFT (Cadence) │  │
│  │ WorldCupPack (ERC-1155) │        │  │ CollaborationHub      │  │
│  │ FanCastRewards          │        │  │ ForteAutomation       │  │
│  └──────────────────────────┘        │  └───────────────────────┘  │
└──────────────────────────────────────┴──────────────────────────────┘
```

---

## 🔗 Smart Contracts

### X Layer Testnet (0x910d4383313814CC47db6ffeD56aC2F2CBE764Cf)

| Contract | Address | Description |
|---|---|---|
| RemixNFT | [`0x910d...4Cf`](https://www.oklink.com/xlayer-testnet/address/0x910d4383313814CC47db6ffeD56aC2F2CBE764Cf) | ERC-721 for AR remixes. `mint(uri, overlays, packIds, referrer)` |
| WorldCupPack | [`0xff52...dfB`](https://www.oklink.com/xlayer-testnet/address/0xff52Adf73e19fCd2B79784154CFf23b218CCEdfB) | ERC-1155 AR overlay packs |
| FanCastRewards | See RemixNFT | USDT/OKB reward distribution for leaderboard winners |

### Flow Testnet (`0x4520a5a7b69ee3ac`)

| Contract | Description |
|---|---|
| ARAssetNFT | Cadence 1.0 NFT contract. Events: `Minted(id, creator)`, `Deposit(id)` |
| CollaborationHub | Collab management for videographers + AR artists |
| ForteAutomation | Cross-chain automation receiver |

---

## 🔁 Cross-VM Flow

The key innovation: **X Layer serves as the volume layer** (free/cheap mints), **Flow serves as the premium layer** (curated Iconic Moments with NBA Top Shot lineage).

```
Mint on X Layer → Leaderboard (daily) → Top 3 → Flow CLI → Flow Cadence NFT
                                                      ↓
                                              FlowScan link in gallery
```

The auto-promote scheduler runs every 60s in the backend. Status flow: `open → closed → promoting → completed`. Each promoted moment shows its Flow testnet transaction on FlowScan.

**8 real Flow testnet mints confirmed:** `194be9eb`, `0ad06068`, `30549047`, `e82eb00`, `e307e5a`, `2bbed12`, `ef323d05`, `28b6c6e6`

---

## 🏁 Demo Instructions for Judges

### 1. Basic Remix + Mint
- Open [magiclens.vercel.app](https://magiclens.vercel.app)
- Connect wallet (MetaMask / OKX Wallet)
- Click "Create AR Remix" → pick clip → add overlays → "Mint Remix"
- Confirm the X Layer testnet transaction in your wallet
- See the mint confirmation with streak countdown and share buttons

### 2. Leaderboard + Cross-VM Promotion
- Visit [MagicLens Leaderboard](https://magiclens.vercel.app/dashboard)
- Click "Seed Demo" — this creates 5 leaderboard entries and triggers cross-VM promotion
- Click "Close Day" — locks the leaderboard, auto-promote begins
- Wait ~10 seconds for the Flow CLI to mint → status changes to "completed"
- Visit [Iconic Moments](https://magiclens.vercel.app/iconic-moments) → see Flow NFTs with FlowScan links

### 3. Referral Loop
- Copy your referral link from the Profile page
- Open a new tab with `?ref=0xYourAddress`
- Mint a remix — the referrer gets +200 leaderboard votes
- Check profile to see referral stats

### 4. Social Sharing
- Mint a remix → Confirmation page shows share buttons
- "Share on X" posts a tweet with the remix URL + OG card
- "Copy Link" copies the deep link with OpenGraph metadata

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.6, React 19, Tailwind 3.4, framer-motion |
| EVM SDK | wagmi v2 + RainbowKit |
| Flow SDK | FCL v1 |
| Backend | Python 3.11 FastAPI, uvicorn (4 workers, uvloop) |
| Database | Neon PostgreSQL (serverless) |
| Cache | Redis |
| Blockchain - X Layer | Solidity (ERC-721, ERC-1155) |
| Blockchain - Flow | Cadence 1.0 |
| Deployment | Vercel (frontend), PM2 on Hetzner (backend) |

---

## 📊 Viral Features

- **Referral link** `?ref=0x...` — tracked on-chain and via API, +200 leaderboard votes
- **Streak system** — consecutive mint days tracked in localStorage, badges at 3/7/14/30 days
- **"Beat This" feed** — challenge other creators with "Beat {score} pts" CTA
- **Achievement badges** — First Mint, Streaker, Referral badges on profile
- **OG cards** — rich preview on X, Discord, iMessage for shared remixes
- **Countdown timer** — urgency with "Day closes in Xh Xm"

---

## 📁 Project Structure

```
magiclens/
├── contracts/               # X Layer Solidity contracts
│   └── RemixNFT.sol        # ERC-721 with referral support
├── contracts-cadence/       # Flow Cadence 1.0 contracts
│   └── ARAssetNFT.cdc      # Premium Iconic Moment NFT
├── services/
│   ├── api/routes.py        # All API endpoints
│   ├── core/
│   │   ├── crossvm_service.py   # Flow CLI subprocess orchestrator
│   │   ├── leaderboard_service.py # Day state machine + auto-promote
│   │   └── database.py          # PostgreSQL schema
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── hooks/                  # useMintRemix, useReferrer, etc.
│   └── lib/                    # API client, remix-store, streak
├── deploy/
│   ├── deploy.sh               # Local wheel build + PM2 deploy
│   └── ecosystem.config.js     # PM2 config with PATH for flow binary
└── AGENTS.md                   # AI contributor guide
```

---

## 🔧 Local Development

```bash
npm install
cp .env.example .env.local  # fill in API base URL
npm run dev                 # http://localhost:3000
```

Backend requires Python 3.11 + PostgreSQL. See [AGENTS.md](./AGENTS.md) for full setup.

---

## 📜 License

MIT
