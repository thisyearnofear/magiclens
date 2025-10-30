# MagicLens Deployment Guide

This guide covers deployment options for MagicLens across different environments: development, staging, and production.

## 🛠 Development Environment Setup

### Prerequisites
- Flow CLI v2.2.16+
- Node.js 18+
- Python 3.8+
- PostgreSQL

### Quick Setup
```bash
# 1. Start Flow Emulator
flow emulator start --rest-port 8889 &

# 2. Deploy Smart Contracts
flow project deploy --network emulator

# 3. Start Backend Services (3 terminals)
# Terminal 1: Main API Service
cd services && pip install -r requirements.txt && python main.py

# Terminal 2: Logging Server  
cd logging-server && pip install -e . && python logging-server.py

# Terminal 3: Collaboration Server
cd app/server && node index.js

# 4. Frontend
cd app && pnpm install && cp .env.example .env && pnpm dev
```

### Development Services
- **Frontend**: http://localhost:5173
- **Main API Service**: http://localhost:8000
- **Logging Server**: http://localhost:9000
- **Collaboration Server**: http://localhost:3001
- **Flow Emulator**: http://localhost:8889

## ☁️ Production Deployment (Hetzner + Vercel)

### 1. Prepare Hetzner Server

1. **Create Hetzner server** (recommended: CX21 or higher for MediaPipe)
2. **SSH into your server**:

```bash
ssh root@YOUR_SERVER_IP
```

3. **Install Docker and Docker Compose**:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
apt install ca-certificates curl gnupg lsb-release -y
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add current user to docker group (optional)
usermod -aG docker $USER
```

### 2. Deploy Backend Services

1. **Clone your repository**:

```bash
git clone https://github.com/YOUR_USERNAME/magiclens.git
cd magiclens
```

2. **Create environment file**:

```bash
# Create .env file in the root
cat > .env << 'EOF'
# JWT Configuration - Generate a strong secret key
JWT_SECRET_KEY=your-super-secret-jwt-key-here-32-characters-at-least!
JWT_ALGORITHM=HS256

# CORS Configuration - Update with your Vercel domain
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173,http://localhost:3000
ALLOWED_METHODS=GET,POST,OPTIONS,PUT,DELETE
ALLOWED_HEADERS=Authorization,Content-Type,X-Requested-With
ALLOW_CREDENTIALS=true

# Flow Blockchain Configuration
FLOW_NETWORK=mainnet
FLOW_ACCESS_NODE=https://access-mainnet-beta.onflow.org
FLOW_PRIVATE_KEY=your_flow_private_key_here

# Security
RATE_LIMIT_PER_MINUTE=60

# Environment
ENV=production
EOF
```

3. **Build and start services**:

```bash
# Build and start the services
docker-compose up -d --build

# Check if services are running
docker-compose logs -f
```

4. **Run database migrations**:

```bash
# Wait for services to start, then run migrations
docker-compose exec api alembic upgrade head
```

### 3. Configure Nginx (Optional but recommended)

1. **Install Nginx**:

```bash
apt install nginx -y
```

2. **Configure reverse proxy**:

```bash
# Remove default config
rm /etc/nginx/sites-enabled/default

# Create MagicLens config
cat > /etc/nginx/sites-available/magiclens << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Main API and WebSocket
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for video uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/magiclens /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx
```

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend for Production

Update your frontend `.env.production` file:

```
VITE_API_BASE_URL=https://your-hetzner-server.com
VITE_COLLABORATION_SERVER=wss://your-hetzner-server.com
VITE_FLOW_NETWORK=mainnet
VITE_SENTRY_DSN=your_sentry_dsn_here
```

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set build command to `npm run build` (or `pnpm build`)
4. Set output directory to `dist`
5. Add environment variables from your `.env.production` file
6. Deploy!

## 🔍 Post-Deployment Tasks

### 1. SSL Certificate (Recommended)

1. **Install Certbot**:

```bash
apt install certbot python3-certbot-nginx -y
```

2. **Obtain SSL certificate**:

```bash
certbot --nginx -d YOUR_DOMAIN
```

### 2. Health Checks

1. **Test your API** (replace with your actual domain/IP):

```bash
# Health check
curl http://YOUR_DOMAIN/health

# Test computer vision endpoints
curl -X POST http://YOUR_DOMAIN/api/computer_vision/analyze_pose_sequence \
  -H "Content-Type: application/json" \
  -d '{"frames": [[0.5, 0.5, 0.0, 1.0, 0.4, 0.6, 0.0, 1.0]]}'
```

### 3. Monitoring

1. **Check service status**:

```bash
# View logs
docker-compose logs -f

# Check running containers
docker-compose ps
```

## 🛠 Troubleshooting

### Common Issues:

1. **MediaPipe not available**: If you get MediaPipe import errors, ensure your server has enough resources and try rebuilding:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

2. **WebSocket not working**: Ensure your Nginx config includes WebSocket upgrade headers:
```
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

3. **Video uploads failing**: Check file size limits in your API and Nginx configs.

## 🎯 Next Steps After Successful Deployment

1. **Load testing**: Test with multiple concurrent users
2. **Performance optimization**: Monitor resource usage
3. **Security hardening**: Set up firewall, security headers, etc.
4. **Backup strategy**: Implement database and file backups

---
Your MVP is now ready to get in users' hands! 🚀