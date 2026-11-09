#!/usr/bin/env bash
# Обновляет код в render-deploy/ из ../site (исходный проект не меняется).
# Запуск: ./render/sync.sh  (из папки render-deploy)
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$HERE/../site"

rsync -a --delete \
  --exclude '/.git/' \
  --exclude '/render/' \
  --exclude '/render.yaml' \
  --exclude '/.node-version' \
  --exclude '/DEPLOY.md' \
  --exclude 'node_modules' --exclude 'node_modules.nosync' \
  --exclude '.next' --exclude '.next.nosync' \
  --exclude '/uploads/' \
  --exclude '/e2e/' --exclude '/playwright.config.ts' \
  --exclude '/test-results/' --exclude '/playwright-report/' \
  --exclude '*.test.ts' --exclude '/vitest.config.ts' \
  --exclude '/.env' --exclude '/.env.local' \
  --exclude '*.tsbuildinfo' --exclude '/next-env.d.ts' \
  --exclude '.DS_Store' \
  "$SRC/" "$HERE/"

echo "Синхронизировано из $SRC"
