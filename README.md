# MagicLens — The AR Remix Layer for Live Sports

> **Launching with the 2026 FIFA World Cup.** Built for the [OKX X Cup](https://web3.okx.com/xlayer/build-x-hackathon/xcup) hackathon on X Layer, with a dual-chain (X Layer + Flow) onchain economy.

MagicLens turns every iconic sports moment into a mintable, remixable, ownable piece of fan culture. Fans drop pose-aware AR overlays on match clips, mint the remix as an NFT on **X Layer**, climb the daily leaderboard, and earn USDT/OKB. Top remixes are auto-minted as premium **Flow Cadence** "Iconic Moment" NFTs (NBA Top Shot / NFL All Day lineage).

- **One-liner:** Prediction markets monetize *opinions* about sports. MagicLens monetizes the *content*.
- **Launch event:** FIFA World Cup 2026. **Next:** Wimbledon, NBA Finals, Champions League, F1, Olympics LA 2028.

📖 Strategy: [docs/HACKATHON_STRATEGY.md](./docs/HACKATHON_STRATEGY.md) · Roadmap: [docs/ROADMAP.md](./docs/ROADMAP.md) · Overview: [docs/PLATFORM_OVERVIEW.md](./docs/PLATFORM_OVERVIEW.md)

## 🧱 Architecture

**Frontend:** Next.js 15 (App Router) + MediaPipe pose detection + AR editor
**Onchain:** X Layer (EVM, hackathon venue) **+** Flow (Cadence + EVM, consumer UX home), unified via FCL + wagmi RainbowKit adapter (one connect button, no chain pickers)
**Backend:**
- **Main API Service** (Python/FastAPI) - Core business logic and REST API
- **Logging Server** (Python/FastAPI) - Log aggregation and error reporting
- **Collaboration Server** (Node.js/Socket.IO) - Real-time WebSocket collaboration

## 🚀 Quick Start

**Prerequisites:** Flow CLI v2.2.16+, Node.js 18+, Python 3.8+, PostgreSQL

```bash
# 1. Start Flow Emulator (in background)
flow emulator start --rest-port 8889 &

# 2. Deploy Smart Contracts
flow project deploy --network emulator

# 3. Start Backend Services
# Terminal 1: Main API Service
cd services && pip install -r requirements.txt && python main.py

# Terminal 2: Logging Server  
cd logging-server && pip install -e . && python logging-server.py

# Terminal 3: Collaboration Server
cd server && node index.js

# 4. Frontend (from repo root)
npm install --legacy-peer-deps && cp .env.example .env && npm run dev
```

### 🎉 Services Running
- **Frontend**: http://localhost:3000
- **Main API Service**: http://localhost:8000
- **Logging Server**: http://localhost:9000
- **Collaboration Server**: http://localhost:3001
- **Flow Emulator**: http://localhost:8889 (REST)

## 📚 Documentation

All documentation is available in the [`docs/`](./docs) directory:

- [Hackathon Strategy](./docs/HACKATHON_STRATEGY.md) - OKX X Cup positioning, dual-chain plan, scope
- [Roadmap](./docs/ROADMAP.md) - Hackathon → multi-event → Olympics 2028
- [Platform Overview](./docs/PLATFORM_OVERVIEW.md) - Features, benefits, Event primitive
- [Getting Started Guide](./docs/GETTING_STARTED.md) - Quick setup and basic usage
- [Deployment Guide](./docs/DEPLOYMENT.md) - Development and production deployment instructions
- [Technical Reference](./docs/TECHNICAL_REFERENCE.md) - API documentation and architecture details

## 🎯 Key Features

- **🏆 Event-Based Onchain Economy** - Each sports event ships an AR Pack (ERC-1155), Remix Feed (ERC-721), Leaderboard, and USDT/OKB Treasury
- **🔗 Dual-Chain (X Layer + Flow)** - Volume remixes on X Layer; premium "Iconic Moment" NFTs on Flow Cadence
- **👛 One Connect Button** - FCL + wagmi RainbowKit adapter unifies OKX Wallet and Flow auth
- **Flow Blockchain Authentication** with cryptographic signature verification
- **Video and Asset Management** with PostgreSQL backend
- **Augmented Reality Editor** for overlay positioning
- **Collaboration Workspace** for artists and videographers
- **AI-Powered Overlay Selection** - Smart GIF recommendations + asset suggestions
- **Tenor/GIPHY Integration** - Millions of GIFs for magical overlays
- **Pexels Environmental Gallery** - Professional footage inspiration for videographers
- **🧠 Real MediaPipe Pose Analysis** - 85-90% accurate human pose detection
- **⚡ Database Caching System** - 200-2000x speedup for operations
- **🔄 Background Processing** - Non-blocking video analysis
- **🎯 Motion-Aware AR** - Overlays that avoid blocking human movement

## 🔐 Authentication Flow

MagicLens uses a hybrid authentication system combining blockchain wallets with JWT tokens:

1. **EVM/OKX Wallet via RainbowKit** (primary for hackathon) → **Signature Request** → **Backend Verification**
2. **Flow Wallet Connection** (secondary, for Cadence NFT minting) → **FCL Auth** → **Backend Verification**
3. **JWT Token Generation** → **Token Storage** → **API Authentication**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.