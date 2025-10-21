# MagicLens - Augmented Reality Video Platform

MagicLens is a web-based platform that allows users to add augmented reality overlays to their videos. It features a React-based frontend with Flow blockchain authentication, a Python backend with a microservices architecture, and a dedicated logging server.

## 🏆 Hackathon Submission

This project is submitted for the **Forte Hacks** hackathon. See [Hackathon & Status](./docs/HACKATHON_AND_STATUS.md) for submission details and current progress.

## 🚀 Quick Start (Updated October 2024)

**Prerequisites:** Flow CLI v2.2.16+, Node.js 18+, Python 3.8+, PostgreSQL

```bash
# 1. Start Flow Emulator (in background)
flow emulator start --rest-port 8889 &

# 2. Deploy Smart Contracts
flow project deploy --network emulator
# ✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY!
# ✅ ARAssetNFT → 0xf8d6e0586b0a20c7 
# ✅ CollaborationHub → 0xf8d6e0586b0a20c7
# ✅ ForteAutomation → 0xf8d6e0586b0a20c7

# 3. Frontend Setup
cd app
pnpm install
cp .env.example .env  # Configure VITE_FLOW_NETWORK=emulator
pnpm dev  # Starts on http://localhost:5173

# 4. Backend Setup
cd services
pip install -r requirements.txt
python main.py  # Starts on http://localhost:8000

# 5. Database (if needed)
psql -c "CREATE DATABASE magiclens;" -U postgres
psql -c "CREATE USER magiclens_user WITH PASSWORD 'magiclens_pass';" -U postgres
psql -c "GRANT ALL PRIVILEGES ON DATABASE magiclens TO magiclens_user;" -U postgres
```

### 🎉 **FULLY OPERATIONAL (Updated Oct 21, 2024)**
- **Frontend**: React app running on `http://localhost:5173`
- **Backend**: FastAPI services running on `http://localhost:8000`
- **Blockchain**: ALL 3 contracts deployed to Flow emulator
  - ARAssetNFT (NFT minting & management)
  - CollaborationHub (Multi-party projects)
  - ForteAutomation (Automated workflows)
- **Flow Emulator**: Running on ports 3569 (gRPC) & 8889 (REST)
- **Authentication**: Flow wallet integration ready

## 📚 Documentation

All documentation is available in the [`docs/`](./docs) directory:

- [Quick Start Guide](./docs/QUICKSTART.md) - 5-minute setup and demo (195 lines)
- [Flow Integration](./docs/FLOW_INTEGRATION.md) - Blockchain features and usage (286 lines)
- [Deployment & API](./docs/DEPLOYMENT_AND_API.md) - Deployment guide and API docs (466 lines)
- [Hackathon & Status](./docs/HACKATHON_AND_STATUS.md) - Submission details and progress (246 lines)

## 🔐 Authentication Flow

MagicLens uses a hybrid authentication system combining Flow blockchain with JWT tokens:

1. **Flow Wallet Connection** → **Signature Request** → **Backend Verification** 
2. **JWT Token Generation** → **Token Storage** → **API Authentication**

## 🎯 Key Features

- **Flow Blockchain Authentication** with cryptographic signature verification
- **Video and Asset Management** with PostgreSQL backend
- **Augmented Reality Editor** for overlay positioning
- **Collaboration Workspace** for artists and videographers
- **AI-Powered Recommendations** for smart overlay suggestions

## 🏗️ Architecture

- **Frontend:** React + TypeScript + FCL
- **Backend:** Python FastAPI microservices
- **Database:** PostgreSQL
- **Blockchain:** Flow with Forte Actions & Workflows
- **Authentication:** JWT tokens with Flow signature verification

## 📖 Core Principles

- **ENHANCEMENT FIRST** - Enhance existing components over creating new ones
- **AGGRESSIVE CONSOLIDATION** - Delete unnecessary code rather than deprecating
- **PREVENT BLOAT** - Audit and consolidate before adding features
- **DRY** - Single source of truth for shared logic
- **CLEAN** - Clear separation of concerns
- **MODULAR** - Composable, testable modules
- **PERFORMANT** - Adaptive loading and caching
- **ORGANIZED** - Predictable file structure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.