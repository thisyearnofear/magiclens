# MagicLens Backend Services

This directory contains the Python-based backend microservices for MagicLens, built with FastAPI.

## 📚 Documentation

See the main project documentation in the root [README.md](../README.md) and detailed docs in the [docs/](../docs) directory:

- [Deployment & API](../docs/DEPLOYMENT_AND_API.md) - API endpoints and deployment
- [Flow Integration](../docs/FLOW_INTEGRATION.md) - Blockchain integration details

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt
pip install pyjwt

# Run the server
python main.py
```

## 🏗️ Services

- **user_service** - User profiles with Flow authentication
- **video_service** - Video management and processing
- **asset_service** - AR asset management
- **collaboration_service** - Collaborative workspace
- **render_service** - Video rendering jobs
- **recommendation_engine** - AI-powered suggestions
- **ai_analysis_service** - Video content analysis
- **flow_service** - Flow blockchain integration

## 🗄️ Database

- **PostgreSQL** with user_profiles, videos, and artist_assets tables
- Automatic table creation on startup

## 🔐 Authentication

JWT-based authentication with Flow wallet signature verification.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.