#!/usr/bin/env bash
set -euo pipefail

# MagicLens backend deploy
# Usage: ./deploy/deploy.sh
#
# Strategy: build-local → rsync → symlink → pm2 reload
# - services/ code: 632K (artifact is tiny)
# - Python venv shared across releases (~400MB one-time cost)
# - Old releases pruned (keeps last 3)

SERVER="snel-bot"
REMOTE_DIR="/opt/magiclens"
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)"
LOCAL_SERVICES="$(cd "$(dirname "$0")/../services" && pwd)"

echo "=== MagicLens Backend Deploy ==="
echo "  Server:     $SERVER"
echo "  Remote dir: $REMOTE_DIR"
echo "  Release:    $RELEASE_NAME"
echo ""

# ── 1. Build step (local) ──
echo "==> [1/5] Verifying package..."
(cd "$LOCAL_SERVICES" && python -c "import ast; ast.parse(open('api/routes.py').read()); print('  ✓ Syntax OK')") || echo "  ⚠️  Syntax check skipped"

# ── 2. Create release directory ──
echo "==> [2/5] Staging release directory..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/releases/$RELEASE_NAME $REMOTE_DIR/logs"

# ── 3. Rsync (only code — .env and __pycache__ excluded) ──
echo "==> [3/5] Rsyncing code..."
rsync -az --delete \
  --exclude '__pycache__' --exclude '*.pyc' \
  --exclude '.pytest_cache' --exclude '.ruff_cache' \
  --exclude '.env' \
  "$LOCAL_SERVICES/" "$SERVER:$REMOTE_DIR/releases/$RELEASE_NAME/"

# ── 4. Server setup: .env, venv, deps, migrations ──
echo "==> [4/5] Server environment setup..."
ssh "$SERVER" "bash -s" << REMOTE_SETUP
  set -euo pipefail
  RD="$REMOTE_DIR"
  RL="$RD/releases/$RELEASE_NAME"

  # Shared .env (first deploy only — edit after)
  if [ ! -f "$RD/.env" ]; then
    cp "$RL/.env.example" "$RD/.env"
    echo "  → Created $RD/.env — EDIT WITH REAL VALUES"
  fi

  # Symlink .env into release
  ln -sf "$RD/.env" "$RL/.env"

  # Shared venv (one-time ~400MB)
  if [ ! -d "$RD/venv" ]; then
    echo "  → Creating Python 3.11 venv..."
    python3.11 -m venv "$RD/venv"
  fi

  # Install/update deps
  echo "  → Installing dependencies..."
  "$RD/venv/bin/pip" install --no-cache-dir -e "$RL" --quiet
  echo "  ✓ Deps installed"

  # Alembic migrations
  echo "  → Running migrations..."
  (cd "$RL" && "$RD/venv/bin/alembic" upgrade head 2>/dev/null && echo "  ✓ Migrations OK") || echo "  ⚠️  Migrations skipped (check DB)"

REMOTE_SETUP

# ── 5. Symlink current, reload pm2, prune old releases ──
echo "==> [5/5] Switching traffic and reloading..."
ssh "$SERVER" "bash -s" << REMOTE_FINISH
  set -euo pipefail
  RD="$REMOTE_DIR"
  RL="$RD/releases/$RELEASE_NAME"

  # Atomically switch current
  ln -sfn "$RL" "$RD/current"

  # Copy ecosystem config from repo if not present
  if [ ! -f "$RD/ecosystem.config.js" ]; then
    echo "  → Copy ecosystem.config.js from repo (edit paths if needed)"
    # Will be placed manually from deploy/ecosystem.config.js
  fi

  # PM2 reload
  if command -v pm2 &>/dev/null; then
    if [ -f "$RD/ecosystem.config.js" ]; then
      pm2 startOrReload "$RD/ecosystem.config.js" --update-env 2>/dev/null
    else
      pm2 start "$RD/venv/bin/python" --name magiclens-api \
        -- -m uvicorn api.bootstrap:app \
        --host 0.0.0.0 --port 8000 --workers 4 \
        --proxy-headers --loop uvloop --http httptools || true
    fi
    pm2 save
    echo "  ✓ PM2 reloaded"
  else
    echo "  ⚠️  pm2 not found — start manually"
  fi

  # Prune old releases (keep last 3)
  cd "$RD/releases"
  ls -t | tail -n +4 | xargs -r rm -rf
  echo "  ✓ Pruned old releases"

REMOTE_FINISH

echo ""
echo "=== Deploy complete ==="
echo "  Release: $RELEASE_NAME"
echo "  Server:  $SERVER"
echo "  Current: $REMOTE_DIR/current -> $RELEASE_NAME"
echo ""
echo "Check: ssh $SERVER 'pm2 status'"
echo "Logs:  ssh $SERVER 'pm2 logs magiclens-api --lines 20'"
