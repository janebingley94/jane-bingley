#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"

export YARN_CACHE_FOLDER="${YARN_CACHE_FOLDER:-$ROOT_DIR/.yarn-cache}"
export YARN_ENABLE_IMMUTABLE_INSTALLS="${YARN_ENABLE_IMMUTABLE_INSTALLS:-false}"

NEXT_ENABLED="${NEXT_ENABLED:-1}"

has_web=false
if [[ -f "$WEB_DIR/package.json" ]]; then
  has_web=true
fi

if [[ "$has_web" == "true" && "$NEXT_ENABLED" != "0" ]]; then
  (
    cd "$WEB_DIR"
    yarn install --non-interactive --network-timeout 600000
    yarn run build
  )
fi

(
  cd "$ROOT_DIR"
  yarn prisma generate
  yarn run build:api
)

