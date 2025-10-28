# MagicLens Integration Testing

This document describes how to run end-to-end integration tests for the MagicLens pose analysis and collaboration features.

## Prerequisites

1. **All services running:**
   ```bash
   # Terminal 1: Flow Emulator
   flow emulator start --rest-port 8889 &

   # Terminal 2: Main API Service
   cd services
   python main.py  # Runs on http://localhost:8000

   # Terminal 3: Logging Server
   cd logging-server
   python logging-server.py  # Runs on http://localhost:9000

   # Terminal 4: Collaboration Server
   cd app/server
   node index.js  # Runs on http://localhost:3001

   # Terminal 5: Frontend
   cd app
   pnpm dev  # Runs on http://localhost:5173
   ```

2. **Database setup:**
   ```bash
   psql -c "CREATE DATABASE magiclens;" -U postgres
   psql -c "CREATE USER magiclens_user WITH PASSWORD 'magiclens_pass';" -U postgres
   psql -c "GRANT ALL PRIVILEGES ON DATABASE magiclens TO magiclens_user;" -U postgres
   ```

3. **Test user account** with valid authentication token

## Running Integration Tests

### Automated Tests
```bash
# Install dependencies if needed
npm install axios socket.io-client

# Run the integration test suite
node test-integration.js
```

### Manual End-to-End Testing

#### Test 1: Video Upload → Pose Analysis Flow
1. Open browser to `http://localhost:5173`
2. Connect Flow wallet
3. Navigate to video upload page
4. Upload a video file (MP4 recommended)
5. Verify video appears in gallery
6. Open video in collaboration workspace
7. Enable pose analysis in SmartOverlayPlacement component
8. Click "Analyze Video Poses"
9. Verify pose keypoints appear in visualization
10. Click "Get Smart Placement"
11. Verify overlay placement suggestions appear

#### Test 2: Real-time Collaboration
1. Open two browser windows/tabs
2. Both connect with different Flow wallets
3. User 1 creates collaboration on a video
4. User 2 joins the collaboration
5. User 1 enables pose analysis
6. Verify User 2 sees pose analysis updates in real-time
7. User 1 places overlay using smart placement
8. Verify User 2 sees overlay placement in real-time

#### Test 3: NFT Minting Integration
1. Complete pose analysis on a video
2. Create overlay using smart placement
3. Export final video with overlay
4. Mint as NFT on Flow blockchain
5. Verify NFT appears in user's gallery

## Test Results

The automated test script will output:
- ✅ API service health
- ✅ Authentication flow
- ✅ Pose analysis API
- ✅ Smart placement API
- ✅ WebSocket collaboration

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure all backend services are running
   - Check network connectivity
   - Verify environment variables

2. **WebSocket Connection Failed**
   - Ensure collaboration server is running on port 3001
   - Check CORS settings
   - Verify firewall settings

3. **Pose Analysis Fails**
   - Ensure MediaPipe dependencies are installed
   - Check video file format (MP4 recommended)
   - Verify video file is accessible

4. **Database Errors**
   - Ensure PostgreSQL is running
   - Verify database credentials
   - Check Alembic migrations

### Debug Commands

```bash
# Check service health
curl http://localhost:8000/health

# Test pose analysis API
curl -X POST http://localhost:8000/api/computer_vision/analyze_pose_sequence \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"frames": [[0.5, 0.5, 0.0, 1.0, 0.4, 0.6, 0.0, 1.0]]}'

# Check WebSocket connection
# Open browser dev tools and run:
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected'));
```

## Performance Benchmarks

Expected performance for pose analysis:
- **Video processing**: < 2000ms for 30-frame analysis
- **API response**: < 500ms for cached results
- **WebSocket latency**: < 100ms for real-time updates
- **Database queries**: < 50ms for cached pose data

## Contributing

When adding new features:
1. Update integration tests to cover new functionality
2. Add performance benchmarks
3. Document manual testing steps
4. Ensure backward compatibility
