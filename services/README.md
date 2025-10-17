# MagicLens Backend

This is the backend for the MagicLens application, a Python-based microservices architecture built with FastAPI.

## Architecture

The backend is composed of several microservices, each responsible for a specific domain:

- **`user_service`:** Manages user profiles (Web3 wallet-based)
- **`video_service`:** Handles video uploading, processing, and management
- **`asset_service`:** Manages AR assets
- **`collaboration_service`:** Powers the collaborative workspace
- **`render_service`:** Manages video rendering jobs
- **`recommendation_engine`:** Provides AI-powered recommendations
- **`ai_analysis_service`:** Analyzes videos for AR overlay suggestions

## Authentication

The backend is designed to work with Web3 on-chain authentication. Traditional JWT-based authentication has been removed in favor of a decentralized approach where users authenticate using their blockchain wallet signatures.

## Getting Started

1.  Install the Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```

## API Documentation

Once the server is running, visit `/docs` for interactive API documentation powered by Swagger UI.