# MagicLens Backend Deployment

## First-time server setup (one-time)

```bash
# SSH in and install system dependencies
ssh snel-bot

# Install Python 3.11 (if not present)
sudo apt update && sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib libpq-dev
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createuser --pwprompt magiclens_user
sudo -u postgres createdb --owner=magiclens_user magiclens

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Install PM2 globally (if not already)
sudo npm install -g pm2

# Create magiclens directory
sudo mkdir -p /opt/magiclens
sudo chown -R $USER:$USER /opt/magiclens

# Copy ecosystem config from repo
# (from local machine)
scp deploy/ecosystem.config.js snel-bot:/opt/magiclens/ecosystem.config.js

exit
```

## Configure environment

After first deploy, edit `/opt/magiclens/.env` on the server:

```bash
ssh snel-bot
nano /opt/magiclens/.env
```

Required variables (at minimum):
| Variable | Value |
|---|---|
| `JWT_SECRET_KEY` | Generate: `openssl rand -hex 32` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `magiclens` |
| `DB_USER` | `magiclens_user` |
| `DB_PASSWORD` | (what you set above) |
| `REDIS_URL` | `redis://localhost:6379/0` |
| `ALLOWED_ORIGINS` | `https://magiclens.vercel.app` |

## Deploy

```bash
# From local machine
./deploy/deploy.sh
```

The deploy script builds a backend wheel on your machine, then syncs only the
wheel plus Alembic files to the server. The remote box never needs the full
source tree.

## Disk usage estimate

| Item | Size |
|---|---|
| Release files | ~1-5MB |
| Python venv (opencv, mediapipe, numpy) | ~300-500MB |
| PostgreSQL data directory | ~100MB+ (grows with use) |
| Redis data (RDB/AOF) | ~1-10MB |
| Media uploads | Variable (local disk or S3) |
| Old releases (3 kept) | ~a few MB total |

Total baseline: ~500MB-1GB before media uploads.

## Tips for space-constrained servers

- **Use S3-compatible storage** (Hetzner Object Storage) for media instead of local disk — set `MEDIA_ACCESS_KEY`/`MEDIA_SECRET_KEY`/`MEDIA_ENDPOINT_URL`/`MEDIA_BUCKET` in `.env`
- **Set `LOCAL_MEDIA_DIR`** to /tmp if you have no S3 (tmpfs, lost on reboot)
- **Disable unused services**: If pose analysis isn't needed, trim the runtime dependency set before building the wheel
- **Old releases are tiny** because the server only keeps wheel artifacts and migrations; the venv is the heavy part and is shared
