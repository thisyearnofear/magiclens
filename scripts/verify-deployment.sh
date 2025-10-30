#!/bin/bash
# MagicLens Deployment Verification Script

echo "🔍 Verifying MagicLens Deployment Setup..."

# Check if required files exist
echo "Checking for required files..."
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
else
    echo "✅ docker-compose.yml found"
fi

if [ ! -f "services/Dockerfile" ]; then
    echo "❌ services/Dockerfile not found"
    exit 1
else
    echo "✅ services/Dockerfile found"
fi

if [ ! -f "services/pyproject.toml" ]; then
    echo "❌ services/pyproject.toml not found"
    exit 1
else
    echo "✅ services/pyproject.toml found"
fi

# Check if Docker is installed
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
else
    echo "✅ Docker installed"
fi

# Check if Docker Compose is available
echo "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not available"
    exit 1
else
    echo "✅ Docker Compose available"
fi

# Check Docker Compose configuration
echo "Validating docker-compose.yml..."
if docker-compose config &> /dev/null; then
    echo "✅ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml validation failed"
    exit 1
fi

echo "✅ All checks passed! Ready for deployment."
echo ""
echo "To deploy MagicLens, run:"
echo "  docker-compose up -d --build"