# MagicLens Technical Reference

This document provides technical details about the MagicLens architecture, APIs, and core components.

## 🏗️ System Architecture

MagicLens follows a distributed microservices architecture with specialized services:

### Core Services

1. **Main API Service** (Python/FastAPI)
   - Core business logic and REST API
   - Computer vision processing with MediaPipe
   - Database interactions with PostgreSQL
   - Flow blockchain integration

2. **Logging Server** (Python/FastAPI)
   - Log aggregation and error reporting
   - Structured logging with Loguru
   - Prometheus metrics collection

3. **Collaboration Server** (Node.js/Socket.IO)
   - Real-time WebSocket collaboration
   - Presence tracking and chat
   - Overlay synchronization

### Data Flow

```
Frontend ↔ Main API Service ↔ Database
              ↓
         Logging Server
              ↓
    Collaboration Server
```

### Database Schema

The PostgreSQL database contains 6 tables with proper indexes and constraints:

1. **users** - User profiles and authentication
2. **assets** - AR assets and metadata
3. **projects** - Collaboration projects
4. **overlays** - AR overlay positioning data
5. **render_jobs** - Background processing queue
6. **pose_cache** - Cached pose analysis results

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/flow_challenge
Request Flow wallet signature challenge for authentication

#### POST /api/auth/flow_verify
Verify Flow wallet signature and generate JWT token

#### GET /api/auth/profile
Get authenticated user profile (requires JWT)

### Computer Vision Endpoints

#### POST /api/computer_vision/analyze_pose_sequence
Analyze human pose in video frames using MediaPipe

Parameters:
- frames: Array of normalized coordinates [x, y, confidence, visibility]

Returns:
- poses: Array of detected poses with joint coordinates

#### POST /api/computer_vision/suggest_overlays
Get AI-powered overlay suggestions based on pose analysis

Parameters:
- poses: Pose analysis results
- content_type: Type of content (fitness, dance, etc.)

Returns:
- suggestions: Array of overlay placement recommendations

### Asset Management Endpoints

#### GET /api/assets
List all AR assets

#### POST /api/assets
Upload new AR asset

#### GET /api/assets/{id}
Get specific AR asset

#### PUT /api/assets/{id}
Update AR asset metadata

#### DELETE /api/assets/{id}
Delete AR asset

### Project Management Endpoints

#### GET /api/projects
List collaboration projects

#### POST /api/projects
Create new collaboration project

#### GET /api/projects/{id}
Get specific project

#### PUT /api/projects/{id}
Update project

#### DELETE /api/projects/{id}
Delete project

## 🔐 Security Implementation

### JWT Authentication
- HS256 algorithm with secure secret keys
- Token expiration and refresh mechanisms
- Role-based access control

### Rate Limiting
- SlowAPI integration for request throttling
- Configurable limits per endpoint
- IP-based and user-based limiting

### Input Validation
- Pydantic models for request validation
- Sanitization of user inputs
- Protection against common web vulnerabilities

## ⚡ Performance Optimizations

### Database Caching
- Redis integration for session storage
- Pose analysis caching with automatic expiration
- 200-2000x speedup for repeated operations

### Background Processing
- Priority job queue for video analysis
- Non-blocking operations
- Progress tracking via WebSocket

### MediaPipe Optimization
- Cached pose analysis results
- Batch processing of video frames
- Memory-efficient processing pipeline

## 🧠 Computer Vision Integration

### MediaPipe Pose Detection
- Real-time human pose estimation
- 85-90% accuracy for diverse movement types
- Joint tracking for 33 body landmarks

### Pose Analysis Pipeline
1. Frame preprocessing and normalization
2. MediaPipe pose detection
3. Confidence scoring and filtering
4. Motion pattern analysis
5. Overlay suggestion generation

### Content Categorization
- Automatic classification of video content
- Fitness, dance, presentation, and other categories
- Style-aware overlay recommendations

## 🔗 Flow Blockchain Integration

### Smart Contracts

1. **ARAssetNFT.cdc**
   - NFT minting for AR assets
   - Metadata storage and retrieval
   - Ownership tracking

2. **CollaborationHub.cdc**
   - Multi-party project management
   - Revenue sharing agreements
   - Contributor tracking

3. **ForteAutomation.cdc**
   - Automated publishing workflows
   - Royalty distribution
   - Collaboration triggers

### FCL Integration
- Wallet connection and authentication
- Transaction signing and submission
- Event listening and handling

## 📊 Monitoring and Health Checks

### Health Endpoints
- `/health` - Comprehensive system status
- `/health/live` - Kubernetes liveness probe
- `/health/ready` - Kubernetes readiness probe
- `/metrics` - Prometheus metrics

### Logging System
- Structured logging with Loguru
- Error aggregation and reporting
- Performance monitoring

## 🧪 Testing Framework

### Test Structure
- Pytest for backend testing
- Integration tests for API endpoints
- Mock services for external dependencies

### Coverage Areas
- Authentication flows
- FFmpeg media processing
- Media analysis pipelines
- Render queue processing
- Database operations

### Test Commands
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=api
```