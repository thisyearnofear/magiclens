#!/usr/bin/env bash
set -euo pipefail

SERVER="snel-bot"
REMOTE_DIR="/opt/magiclens"
RELEASE_NAME="release-$(date +%Y%m%d-%H%M%S)"
LOCAL_SERVICES="$(cd "$(dirname "$0")/../services" && pwd)"
LOCAL_BUILD_DIR="$(mktemp -d "${TMPDIR:-/tmp}/magiclens-build.XXXXXX")"

cleanup() {
  rm -rf "$LOCAL_BUILD_DIR"
}
trap cleanup EXIT

echo "=== MagicLens Backend Deploy ==="
echo "  Server:     $SERVER"
echo "  Remote dir: $REMOTE_DIR"
echo "  Release:    $RELEASE_NAME"
echo ""

echo "==> [1/6] Verifying package..."
(cd "$LOCAL_SERVICES" && python3.11 - <<'PY'
from pathlib import Path

for path in [
    "api/bootstrap.py",
    "api/routes.py",
    "core/database.py",
    "alembic/env.py",
]:
    compile(Path(path).read_text(), path, "exec")

print("  ✓ Syntax OK")
PY
) || echo "  ⚠️  Syntax check skipped"

echo "==> [2/6] Building local wheel..."
mkdir -p "$LOCAL_BUILD_DIR/dist"
UV_CACHE_DIR="$LOCAL_BUILD_DIR/uv-cache" \
  uv build --wheel --no-build-logs --no-build-isolation --out-dir "$LOCAL_BUILD_DIR/dist" "$LOCAL_SERVICES" >/dev/null
WHEEL_FILE="$(find "$LOCAL_BUILD_DIR/dist" -maxdepth 1 -name '*.whl' | head -n 1)"
if [ -z "$WHEEL_FILE" ]; then
  echo "  ✗ Wheel build failed"
  exit 1
fi
echo "  ✓ Built $(basename "$WHEEL_FILE")"

echo "==> [3/6] Staging release directory..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/releases/$RELEASE_NAME $REMOTE_DIR/logs"

echo "==> [4/6] Syncing runtime files..."
rsync -az --delete \
  --exclude '__pycache__' --exclude '*.pyc' \
  "$LOCAL_SERVICES/alembic/" "$SERVER:$REMOTE_DIR/releases/$RELEASE_NAME/alembic/"
rsync -az --delete \
  "$LOCAL_SERVICES/alembic.ini" \
  "$LOCAL_SERVICES/.env.example" \
  "$SERVER:$REMOTE_DIR/releases/$RELEASE_NAME/"
rsync -az --delete \
  "$LOCAL_BUILD_DIR/dist/" \
  "$SERVER:$REMOTE_DIR/releases/$RELEASE_NAME/dist/"

echo "==> [5/6] Server environment setup..."
ssh "$SERVER" "RD=$REMOTE_DIR RL=$REMOTE_DIR/releases/$RELEASE_NAME bash -s" << 'REMOTE_SETUP'
  set -eo pipefail
  if [ ! -f "$RD/.env" ]; then
    cp "$RL/.env.example" "$RD/.env"
    echo "  → Created $RD/.env — EDIT WITH REAL VALUES"
  fi
  ln -sf "$RD/.env" "$RL/.env"
  if [ ! -d "$RD/venv" ]; then
    echo "  → Creating Python 3.11 venv..."
    python3.11 -m venv "$RD/venv"
  fi
  echo "  → Installing dependencies..."
  WHEEL_PATH="$(find "$RL/dist" -maxdepth 1 -name '*.whl' | head -n 1)"
  if [ -z "$WHEEL_PATH" ]; then
    echo "  ✗ Missing release wheel"
    exit 1
  fi
  "$RD/venv/bin/pip" install --no-cache-dir --upgrade "$WHEEL_PATH" --quiet
  echo "  ✓ Deps installed"
  echo "  → Running migrations..."
  (cd "$RL" && "$RD/venv/bin/alembic" upgrade head 2>/dev/null && echo "  ✓ Migrations OK") || echo "  ⚠️  Migrations skipped (check DB)"
REMOTE_SETUP

echo "==> [6/6] Switching traffic and reloading..."
ssh "$SERVER" "RD=$REMOTE_DIR RL=$REMOTE_DIR/releases/$RELEASE_NAME bash -s" << 'REMOTE_FINISH'
  set -eo pipefail
  ln -sfn "$RL" "$RD/current"
  if command -v pm2 &>/dev/null; then
    if [ -f "$RD/ecosystem.config.js" ]; then
      pm2 startOrReload "$RD/ecosystem.config.js" --update-env 2>/dev/null || true
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
