#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="$repo_root/infra/production/compose.yaml"

IMAGE_REF='ghcr.io/conspiracy-dev/deploy-lab@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
DOMAIN='noash.net' \
  docker compose -f "$compose_file" config --quiet

if rg --fixed-strings --quiet 'wget --spider' "$compose_file"; then
  echo 'production healthcheck must not use BusyBox wget' >&2
  exit 1
fi

rg --fixed-strings --quiet \
  'curl --fail --silent --show-error --insecure --resolve "$$DOMAIN:443:127.0.0.1" "https://$$DOMAIN/" > /dev/null' \
  "$compose_file"
