# MagicLens - Augmented Reality Video Platform

MagicLens is a web-based platform that allows users to add augmented reality overlays to their videos. It features a React-based frontend with Flow blockchain authentication and a distributed backend with three specialized services:

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
cd app/server && node index.js

# 4. Frontend
cd app && pnpm install && cp .env.example .env && pnpm dev
```

### 🎉 Services Running
- **Frontend**: http://localhost:5173
- **Main API Service**: http://localhost:8000
- **Logging Server**: http://localhost:9000
- **Collaboration Server**: http://localhost:3001
- **Flow Emulator**: http://localhost:8889 (REST)

## 📚 Documentation

All documentation is available in the [`docs/`](./docs) directory:

- [Getting Started Guide](./docs/GETTING_STARTED.md) - Quick setup and basic usage
- [Deployment Guide](./docs/DEPLOYMENT.md) - Development and production deployment instructions
- [Technical Reference](./docs/TECHNICAL_REFERENCE.md) - API documentation and architecture details
- [Platform Overview](./docs/PLATFORM_OVERVIEW.md) - Features, benefits, and roadmap

## 🎯 Key Features

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

MagicLens uses a hybrid authentication system combining Flow blockchain with JWT tokens:

1. **Flow Wallet Connection** → **Signature Request** → **Backend Verification** 
2. **JWT Token Generation** → **Token Storage** → **API Authentication**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.