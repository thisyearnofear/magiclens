# MagicLens - Augmented Reality Video Platform

MagicLens is a web-based platform that allows users to add augmented reality overlays to their videos. It features a React-based frontend with Flow blockchain authentication, a Python backend with a microservices architecture, and a dedicated logging server.

## 🏆 Hackathon Submission

This project is submitted for the **Forte Hacks** hackathon. See our [concise submission document](./docs/HACKATHON_SUBMISSION_CONCISE.md) for key details.

## 🚀 Quick Start

```bash
# Database setup
psql -c "CREATE DATABASE magiclens;" -U postgres
psql -c "CREATE USER magiclens_user WITH PASSWORD 'magiclens_pass';" -U postgres
psql -c "GRANT ALL PRIVILEGES ON DATABASE magiclens TO magiclens_user;" -U postgres

# Frontend
cd app && pnpm install && pnpm run dev

# Backend
cd services && pip install -r requirements.txt && pip install pyjwt && python main.py
```

## 📚 Documentation

All detailed documentation is available in the [`docs/`](./docs) directory:

- [Quick Start Guide](./docs/QUICKSTART.md) - Step-by-step setup instructions
- [Flow Integration](./docs/FLOW_INTEGRATION_README.md) - Flow blockchain integration details
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [API Documentation](./docs/API_DOCS.md) - API endpoints and usage
- [Implementation Status](./docs/IMPLEMENTATION_STATUS.md) - Current feature status
- [Hackathon Submission](./docs/HACKATHON_SUBMISSION_CONCISE.md) - Forte Hacks entry details

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