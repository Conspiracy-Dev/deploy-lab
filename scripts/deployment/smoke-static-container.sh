#!/usr/bin/env bash

set -euo pipefail

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is unavailable: %s\n' "$1" >&2
    exit 1
  }
}

require_command docker
require_command python3
docker compose version >/dev/null 2>&1 || {
  printf 'Docker Compose v2 is unavailable\n' >&2
  exit 1
}

project="deploy_lab_smoke_${RANDOM}_$$"
port="$(python3 - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    print(sock.getsockname()[1])
PY
)"
base_url="http://localhost:${port}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  docker compose -p "$project" down --volumes --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

export HTTP_PORT="$port"
export NUXT_PUBLIC_SITE_URL="$base_url"
export SITE_HOST=localhost

docker compose -p "$project" up --build --wait --wait-timeout 120

docker compose -p "$project" restart site
docker compose -p "$project" up --wait --wait-timeout 60

IMAGE_REF='deploy-lab-static:local' EXPECTED_SITE_URL="$base_url" \
  bash "$script_dir/smoke-static-image.sh"

printf 'Static container smoke test passed at %s\n' "$base_url"
