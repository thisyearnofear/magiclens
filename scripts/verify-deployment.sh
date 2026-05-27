#!/bin/bash
# MagicLens PM2 deployment verification script

set -euo pipefail

echo "Verifying MagicLens PM2 deployment setup..."

check_file() {
    local path="$1"
    if [ ! -f "$path" ]; then
        echo "Missing required file: $path"
        exit 1
    fi
    echo "Found $path"
}

check_command() {
    local command_name="$1"
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "Missing required command: $command_name"
        exit 1
    fi
    echo "Found $command_name"
}

check_file "deploy/deploy.sh"
check_file "deploy/ecosystem.config.js"
check_file "deploy/README.md"
check_file "services/pyproject.toml"
check_file "services/alembic.ini"

check_command "python3.11"
check_command "uv"
check_command "ssh"
check_command "rsync"

bash -n deploy/deploy.sh
echo "deploy/deploy.sh syntax OK"

UV_CACHE_DIR="${TMPDIR:-/tmp}/magiclens-uv-cache" \
    uv build --wheel --no-build-logs --no-build-isolation --out-dir "${TMPDIR:-/tmp}/magiclens-wheel-verify" services >/dev/null
echo "Backend wheel build OK"

echo ""
echo "Ready for PM2 backend deploy:"
echo "  bash deploy/deploy.sh"
