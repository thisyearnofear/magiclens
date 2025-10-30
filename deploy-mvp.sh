#!/bin/bash
# MagicLens MVP Deployment Script for Hetzner

set -e  # Exit on any error

echo "🚀 Starting MagicLens MVP Deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose-mvp.yml" ]; then
    echo "❌ docker-compose-mvp.yml not found in current directory"
    echo "Please run this script from your project root directory"
    exit 1
fi

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 32
}

echo "🔧 Step 1: Setting up environment variables"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    JWT_SECRET=$(generate_jwt_secret)
    
    cat > .env << EOF
# JWT Configuration
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256

# CORS Configuration - Update these for your frontend domain
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
ALLOWED_METHODS=GET,POST,OPTIONS,PUT,DELETE
ALLOWED_HEADERS=Authorization,Content-Type,X-Requested-With
ALLOW_CREDENTIALS=true

# Flow Blockchain Configuration
FLOW_NETWORK=emulator
FLOW_ACCESS_NODE=http://localhost:8888

# Environment
ENV=production
EOF

    echo "✅ Created .env file with JWT secret and basic configuration"
    echo "⚠️  IMPORTANT: Update .env file with your actual configuration!"
    echo "   - Update ALLOWED_ORIGINS to include your Vercel domain"
    echo "   - Add your Flow private key if deploying to mainnet"
    echo "   - Update FLOW_NETWORK to 'mainnet' or 'testnet' as needed"
else
    echo "✅ Using existing .env file"
fi

echo "🐳 Step 2: Building and starting Docker services"

# Build and start services
docker-compose -f docker-compose-mvp.yml up -d --build

echo "⏳ Step 3: Waiting for services to start..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to start..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose-mvp.yml exec -T api alembic upgrade head

echo "✅ Step 4: Services started successfully!"

# Show service status
echo "📊 Service Status:"
docker-compose -f docker-compose-mvp.yml ps

echo ""
echo "🔍 API is available at: http://$(curl -s ifconfig.me):8000"
echo "   Health check: http://$(curl -s ifconfig.me):8000/health"
echo ""
echo "📋 Next Steps:"
echo "   1. Update your frontend to point to this backend (VITE_API_BASE_URL)"
echo "   2. Configure your Vercel deployment with correct environment variables"
echo "   3. Test the API endpoints to ensure everything works"
echo ""
echo "   Frontend .env should contain:"
echo "   VITE_API_BASE_URL=http://$(curl -s ifconfig.me):8000"
echo "   VITE_COLLABORATION_SERVER=ws://$(curl -s ifconfig.me):8000"
echo ""

echo "🎉 Deployment completed! Your MagicLens MVP is ready for users."