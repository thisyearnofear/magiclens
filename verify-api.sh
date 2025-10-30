#!/bin/bash
# MagicLens MVP API Verification Script

set -e  # Exit on any error

echo "🔍 Verifying MagicLens MVP API..."

API_BASE_URL=${1:-"http://localhost:8000"}

echo "Testing endpoints at: $API_BASE_URL"
echo ""

# Test health endpoint
echo "✅ Testing health endpoint..."
curl -f "$API_BASE_URL/health" > /dev/null && echo "Health: OK" || echo "Health: FAILED"

# Test computer vision endpoints
echo ""
echo "🤖 Testing computer vision endpoints..."

# Test analyze_pose_sequence
echo "Testing pose sequence analysis..."
curl -f -X POST "$API_BASE_URL/api/computer_vision/analyze_pose_sequence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"frames": [[0.5, 0.5, 0.0, 1.0, 0.4, 0.6, 0.0, 1.0, 0.6, 0.6, 0.0, 1.0, 0.3, 0.7, 0.0, 1.0, 0.7, 0.7, 0.0, 1.0, 0.5, 0.8, 0.0, 1.0, 0.4, 0.9, 0.0, 1.0]]}" > /dev/null && \
  echo "Pose analysis: OK" || echo "Pose analysis: FAILED (Expected for unauthenticated request)"

# Test find_sequence_match
echo "Testing sequence match..."
curl -f -X POST "$API_BASE_URL/api/computer_vision/find_sequence_match" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"sequence_a": [[0.5, 0.5, 0.0, 1.0]], "sequence_b": [[0.5, 0.5, 0.0, 1.0]]}" > /dev/null && \
  echo "Sequence match: OK" || echo "Sequence match: FAILED (Expected for unauthenticated request)"

echo ""
echo "🌐 Testing WebSocket endpoint availability..."

# Test if port is open (basic check)
if nc -z localhost 8000; then
    echo "WebSocket port (8000): OK"
else
    echo "WebSocket port (8000): FAILED - Check if service is running"
fi

echo ""
echo "📊 Verifying service components..."

# Check if Docker containers are running
echo "Docker containers status:"
docker-compose -f docker-compose-mvp.yml ps

echo ""
echo "📝 Verification complete!"
echo ""
echo "Next steps:"
echo "1. If testing locally, ensure services are running with: docker-compose -f docker-compose-mvp.yml ps"
echo "2. Update your frontend to use: VITE_API_BASE_URL=$API_BASE_URL"
echo "3. For production deployment, update the ALLOWED_ORIGINS in .env to include your Vercel domain"