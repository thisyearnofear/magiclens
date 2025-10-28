# MagicLens Server Architecture

MagicLens uses a distributed architecture with three specialized servers to provide optimal performance and scalability for different aspects of the platform.

## Server Components

### 1. Main API Service (Port 8000)
**Technology**: Python/FastAPI
**Purpose**: Core business logic and REST API

This is the primary backend service that handles:
- User authentication and profile management
- Video and asset upload/storage
- Database operations
- Collaboration workflow management
- Render queue processing
- AI analysis services
- Health monitoring and metrics

**Key Features**:
- REST API endpoints for all platform functionality
- JWT authentication with Flow wallet verification
- Database integration with PostgreSQL
- WebSocket endpoints for real-time features
- Comprehensive health checks and monitoring

### 2. Logging Server (Port 9000)
**Technology**: Python/FastAPI
**Purpose**: Log aggregation and error reporting

This dedicated service handles all logging and error reporting:
- Real-time log streaming to connected clients
- Error report aggregation from frontend
- Log file management and distribution
- System monitoring and alerting

**Key Features**:
- WebSocket-based log streaming
- Centralized error reporting
- File-based log storage
- Client subscription management

### 3. Collaboration Server (Port 3001)
**Technology**: Node.js/Socket.IO
**Purpose**: Real-time WebSocket collaboration

This specialized server handles real-time collaborative features:
- Overlay synchronization between multiple users
- Cursor position tracking
- Chat messaging
- User presence management
- Conflict resolution for simultaneous edits

**Key Features**:
- Low-latency WebSocket communication
- Room-based collaboration sessions
- Real-time data synchronization
- Presence tracking and notifications

## Architecture Benefits

### Separation of Concerns
Each server has a distinct, focused responsibility:
- **Main API Service**: Business logic and data persistence
- **Logging Server**: Observability and debugging
- **Collaboration Server**: Real-time communication

### Independent Scaling
Servers can be scaled independently based on load requirements:
- Scale Main API Service for high database workload
- Scale Logging Server for high log volume
- Scale Collaboration Server for many concurrent users

### Technology Specialization
Each server uses the optimal technology stack for its purpose:
- Python/FastAPI for business logic and data processing
- Node.js/Socket.IO for real-time bidirectional communication

## Communication Patterns

### Internal Communication
- Main API Service ↔ Database (PostgreSQL)
- Main API Service ↔ Redis (Render queue, caching)
- Main API Service ↔ Logging Server (Error reporting)
- Collaboration Server ↔ Main API Service (Authentication, data validation)

### External Communication
- Frontend ↔ All Servers (HTTP/WebSocket)
- Frontend ↔ Flow Blockchain (gRPC/REST)
- All Servers ↔ External Services (S3, CDN, etc.)

## Service Startup

To start all services in development:

```bash
# Terminal 1: Main API Service
cd services
python main.py

# Terminal 2: Logging Server
cd logging-server
python logging-server.py

# Terminal 3: Collaboration Server
cd app/server
node index.js
```

In production, services can be deployed independently using process managers like PM2 or container orchestration platforms like Kubernetes.