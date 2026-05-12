#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET_REF="${1:-main}"

echo "Deploying ref: ${TARGET_REF}"
git fetch --all --tags
git checkout "${TARGET_REF}"
git pull --ff-only || true

if [[ ! -f ".env" ]]; then
  echo ".env not found. Copying from .env.example"
  cp .env.example .env
  echo "Update .env before exposing to production traffic."
fi

docker compose up -d --build
docker compose ps
