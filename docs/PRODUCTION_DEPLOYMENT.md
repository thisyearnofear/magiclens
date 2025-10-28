# MagicLens Production Deployment Guide

This guide covers deploying MagicLens to production with all three services properly configured.

## Architecture Overview

MagicLens consists of four main components:
- **Frontend**: React/Vite application
- **Main API**: Python FastAPI service with pose analysis
- **Logging Server**: Python FastAPI service for log aggregation
- **Collaboration Server**: Node.js Socket.IO service for real-time collaboration

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or macOS 12+
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB+ (16GB+ recommended)
- **Storage**: 50GB+ SSD
- **Network**: 100Mbps+ bandwidth

### Software Dependencies
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **PostgreSQL**: 13+
- **Redis**: 6+ (optional, for caching)
- **Nginx**: 1.20+ (for reverse proxy)
- **Certbot**: For SSL certificates

## Environment Setup

### 1. Domain Configuration
```bash
# Set your domain
export DOMAIN="magiclens.app"
export API_DOMAIN="api.${DOMAIN}"
export COLLAB_DOMAIN="collab.${DOMAIN}"
```

### 2. SSL Certificates
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificates for all domains
sudo certbot certonly --nginx -d ${DOMAIN}
sudo certbot certonly --nginx -d ${API_DOMAIN}
sudo certbot certonly --nginx -d ${COLLAB_DOMAIN}
```

### 3. Database Setup
```bash
# Create production database
sudo -u postgres psql
CREATE DATABASE magiclens_prod;
CREATE USER magiclens_prod WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE magiclens_prod TO magiclens_prod;
\\q

# Run migrations
cd services
export DATABASE_URL="postgresql://magiclens_prod:secure_password_here@localhost:5432/magiclens_prod"
alembic upgrade head
```

## Service Configuration

### 1. Environment Variables

Create `.env.prod` files for each service:

#### Main API Service (`services/.env.prod`)
```bash
# Database
DATABASE_URL=postgresql://magiclens_prod:secure_password_here@localhost:5432/magiclens_prod

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-super-secure-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Flow Blockchain
FLOW_NETWORK=mainnet
FLOW_ACCESS_NODE=https://access-mainnet-beta.onflow.org
FLOW_ACCOUNT_ADDRESS=0xYourFlowAccountAddress
FLOW_ACCOUNT_KEY=your-flow-account-private-key

# File Storage
UPLOAD_DIR=/var/www/magiclens/uploads
MAX_UPLOAD_SIZE=50000000  # 50MB

# CORS
CORS_ORIGINS=https://magiclens.app,https://www.magiclens.app

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/magiclens/api.log

# Computer Vision
MEDIA_PIPE_MODEL_PATH=/opt/mediapipe
POSE_ANALYSIS_CACHE_TTL=3600
```

#### Logging Server (`logging-server/.env.prod`)
```bash
DATABASE_URL=postgresql://magiclens_prod:secure_password_here@localhost:5432/magiclens_prod
LOG_LEVEL=INFO
LOG_FILE=/var/log/magiclens/logging.log
SENTRY_DSN=your-sentry-dsn-here
```

#### Collaboration Server (`app/server/.env.prod`)
```bash
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://magiclens.app
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

#### Frontend (`.env.prod`)
```bash
VITE_API_BASE_URL=https://api.magiclens.app
VITE_COLLABORATION_SERVER=https://collab.magiclens.app
VITE_FLOW_NETWORK=mainnet
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### 2. Docker Configuration

Update `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: magiclens_prod
      POSTGRES_USER: magiclens_prod
      POSTGRES_PASSWORD: secure_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - magiclens_network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - magiclens_network
    restart: unless-stopped

  # Main API Service
  api:
    build:
      context: ./services
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://magiclens_prod:secure_password_here@postgres:5432/magiclens_prod
      - REDIS_URL=redis://redis:6379
    volumes:
      - uploads:/app/uploads
      - ./services:/app
    depends_on:
      - postgres
      - redis
    networks:
      - magiclens_network
    restart: unless-stopped

  # Logging Server
  logging:
    build:
      context: ./logging-server
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://magiclens_prod:secure_password_here@postgres:5432/magiclens_prod
    depends_on:
      - postgres
    networks:
      - magiclens_network
    restart: unless-stopped

  # Collaboration Server
  collaboration:
    build:
      context: ./app/server
      dockerfile: Dockerfile.prod
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - magiclens_network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:

networks:
  magiclens_network:
    driver: bridge
```

## Nginx Configuration

Create `/etc/nginx/sites-available/magiclens`:

```nginx
# Upstream servers
upstream api_backend {
    server api:8000;
}

upstream collab_backend {
    server collaboration:3001;
}

# HTTPS redirect
server {
    listen 80;
    server_name magiclens.app www.magiclens.app api.magiclens.app collab.magiclens.app;
    return 301 https://$server_name$request_uri;
}

# Main frontend
server {
    listen 443 ssl http2;
    server_name magiclens.app www.magiclens.app;

    ssl_certificate /etc/letsencrypt/live/magiclens.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/magiclens.app/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API server
server {
    listen 443 ssl http2;
    server_name api.magiclens.app;

    ssl_certificate /etc/letsencrypt/live/api.magiclens.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.magiclens.app/privkey.pem;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # API-specific headers
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Collaboration server
server {
    listen 443 ssl http2;
    server_name collab.magiclens.app;

    ssl_certificate /etc/letsencrypt/live/collab.magiclens.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/collab.magiclens.app/privkey.pem;

    location / {
        proxy_pass http://collab_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_buffering off;
        proxy_cache off;
    }
}
```

## Deployment Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and Docker Compose
sudo apt install docker.io docker-compose -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Deploy Application
```bash
# Clone repository
git clone https://github.com/thisyearnofear/magiclens.git
cd magiclens

# Copy environment files
cp services/.env.example services/.env.prod
cp logging-server/.env.example logging-server/.env.prod
cp app/server/.env.example app/server/.env.prod
cp app/.env.example app/.env.prod

# Edit environment files with production values
nano services/.env.prod
nano logging-server/.env.prod
nano app/server/.env.prod
nano app/.env.prod

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec api alembic upgrade head
```

### 3. Frontend Deployment
```bash
# Build frontend
cd app
pnpm install
pnpm build

# Serve with nginx (add to nginx config)
# Static files served from /var/www/magiclens/dist
sudo mkdir -p /var/www/magiclens
sudo cp -r dist/* /var/www/magiclens/
```

### 4. SSL and Nginx
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/magiclens /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Monitoring and Maintenance

### 1. Health Checks
```bash
# API health
curl https://api.magiclens.app/health

# Collaboration health
curl https://collab.magiclens.app/health

# Database health
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### 2. Logs
```bash
# View service logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f collaboration
docker-compose -f docker-compose.prod.yml logs -f logging

# Nginx logs
sudo tail -f /var/log/nginx/magiclens.access.log
sudo tail -f /var/log/nginx/magiclens.error.log
```

### 3. Backup Strategy
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U magiclens_prod magiclens_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/magiclens/uploads
```

### 4. Scaling
```bash
# Scale API service
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Add Redis cluster for high availability
# Configure load balancer for multiple API instances
```

## Security Checklist

- [ ] SSL certificates installed and auto-renewing
- [ ] Database credentials rotated
- [ ] JWT secrets regenerated
- [ ] File upload restrictions configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Security headers set
- [ ] Firewall configured
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Monitoring alerts configured

## Performance Optimization

### 1. Database
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_video_pose_analysis_video_id ON video_pose_analysis(video_id);
CREATE INDEX CONCURRENTLY idx_pose_sequence_matches_hash ON pose_sequence_matches(sequence_a_hash, sequence_b_hash);
```

### 2. Caching
```bash
# Redis configuration for high performance
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### 3. CDN
```bash
# Configure CloudFlare or similar CDN for static assets
# Set appropriate cache headers for uploaded content
```

## Troubleshooting

### Common Issues

1. **Services won't start**
   ```bash
   docker-compose -f docker-compose.prod.yml logs <service_name>
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Database connection issues**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   docker-compose -f docker-compose.prod.yml exec api python -c "import psycopg2; psycopg2.connect(os.environ['DATABASE_URL'])"
   ```

3. **WebSocket connections failing**
   ```bash
   # Check nginx websocket configuration
   sudo nginx -T | grep -A 10 "collab.magiclens.app"
   ```

4. **High memory usage**
   ```bash
   docker stats
   # Consider adding memory limits to docker-compose.yml
   ```

## Rollback Strategy

```bash
# Quick rollback to previous version
docker-compose -f docker-compose.prod.yml down
git checkout previous-tag
docker-compose -f docker-compose.prod.yml up -d --build

# Database rollback (if needed)
# Restore from backup
docker-compose -f docker-compose.prod.yml exec postgres psql -U magiclens_prod -d magiclens_prod < backup.sql
```

## Cost Optimization

### AWS/EC2 Instance Sizing
- **t3.medium**: Development/testing ($30/month)
- **t3.large**: Small production ($60/month)
- **t3.xlarge**: Medium production ($120/month)
- **c5.large**: High-performance pose analysis ($100/month)

### Storage Costs
- **EBS gp3**: $0.08/GB/month
- **Database**: ~$50/month for moderate usage
- **CDN**: $0.08/GB transferred

### Monitoring Costs
- **DataDog**: $15/host/month
- **Sentry**: $26/month (first 100K events)
- **Uptime monitoring**: $10-20/month
