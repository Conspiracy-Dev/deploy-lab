#!/usr/bin/env bash

set -euo pipefail

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is unavailable: %s\n' "$1" >&2
    exit 1
  }
}

require_command docker

docker compose version >/dev/null 2>&1 || {
  printf 'Docker Compose v2 is unavailable\n' >&2
  exit 1
}

work_dir="$(mktemp -d)"
env_file="$work_dir/production.env"
rendered_file="$work_dir/production-compose.yaml"

cleanup() {
  rm -rf "$work_dir"
}

trap cleanup EXIT

printf '%s\n' \
  'IMAGE_REF=ghcr.io/conspiracy-dev/deploy-lab@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
  'DOMAIN=noash.net' > "$env_file"

docker compose --env-file "$env_file" -f infra/production/compose.yaml config --quiet
docker compose --env-file "$env_file" -f infra/production/compose.yaml config > "$rendered_file"

grep -Fq "curl --fail --silent --show-error --insecure --resolve \"\$\$DOMAIN:443:127.0.0.1\"" "$rendered_file"
grep -Fq "\"https://\$\$DOMAIN/\" > /dev/null" "$rendered_file"

if grep -Fq 'wget --spider' "$rendered_file"; then
  printf 'Production healthcheck must not use BusyBox wget\n' >&2
  exit 1
fi

printf 'Production Compose healthcheck test passed\n'
