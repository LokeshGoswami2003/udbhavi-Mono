#!/usr/bin/env bash
# Real deploy logic. Runs on the EC2 host after the stub at
# /var/www/apps/udbhavi/deploy.sh has fetched the requested branch.
#
# Layout assumed:
#   /var/www/apps/udbhavi/repo      git working tree (origin/main checked out)
#   /var/www/apps/udbhavi/shared    server.env, client.env  (gitignored on disk)
#
# Idempotent — safe to run multiple times.

set -euo pipefail

APP_DIR="/var/www/apps/udbhavi"
REPO_DIR="$APP_DIR/repo"
SHARED_DIR="$APP_DIR/shared"
BRANCH="${1:-main}"

SHA="$(git -C "$REPO_DIR" rev-parse --short HEAD)"
echo "[deploy] branch=$BRANCH sha=$SHA"

# Wire the secrets into the working tree. server reads .env at runtime,
# vite reads .env.production at build time.
ln -sfn "$SHARED_DIR/server.env"   "$REPO_DIR/server/.env"
ln -sfn "$SHARED_DIR/client.env"   "$REPO_DIR/client/.env.production"

install_deps() {
  local dir="$1"
  shift
  cd "$dir"
  if [ -f package-lock.json ]; then
    npm ci --no-audit --no-fund "$@" || {
      echo "[deploy] npm ci failed in $dir; falling back to npm install"
      npm install --no-audit --no-fund "$@"
    }
  else
    npm install --no-audit --no-fund "$@"
  fi
}

echo "[deploy] installing server deps"
install_deps "$REPO_DIR/server" --omit=dev

echo "[deploy] installing client deps"
install_deps "$REPO_DIR/client"

echo "[deploy] building client"
cd "$REPO_DIR/client"
npm run build

echo "[deploy] reloading API via PM2"
cd "$APP_DIR"
if pm2 describe udbhavi-api >/dev/null 2>&1; then
  pm2 reload udbhavi-api --update-env
else
  pm2 start ecosystem.config.cjs
  pm2 save
fi

echo "[deploy] done at $SHA"
