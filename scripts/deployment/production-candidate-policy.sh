#!/usr/bin/env bash

set -euo pipefail

emit() {
  local eligible="$1"
  local reason="$2"

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'eligible=%s\nreason=%s\n' "$eligible" "$reason" >> "$GITHUB_OUTPUT"
  fi

  printf 'Production candidate policy: eligible=%s reason=%s\n' "$eligible" "$reason"
}

require_revision() {
  local revision="$1"

  [[ "$revision" =~ ^[0-9a-f]{40}$ ]] || {
    printf 'Expected a full lowercase 40-character revision\n' >&2
    exit 1
  }
}

valid_https_origin() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse

raw = sys.argv[1]
if raw != raw.strip():
    raise SystemExit(1)

parsed = urlparse(raw)
if (
    parsed.scheme != 'https'
    or not parsed.hostname
    or parsed.username
    or parsed.password
    or parsed.path not in ('', '/')
    or parsed.params
    or parsed.query
    or parsed.fragment
):
    raise SystemExit(1)
PY
}

workflow_name="${QUALITY_WORKFLOW_NAME:-}"
conclusion="${QUALITY_CONCLUSION:-}"
source_event="${SOURCE_EVENT:-}"
branch="${HEAD_BRANCH:-}"
revision="${REVISION:-}"
site_url="${PRODUCTION_SITE_URL:-}"
current_main_revision="${CURRENT_MAIN_REVISION:-}"

if [ "$workflow_name" != 'quality' ]; then
  emit false 'unexpected-workflow'
  exit 0
fi

if [ "$conclusion" != 'success' ]; then
  emit false 'quality-not-successful'
  exit 0
fi

if [ "$source_event" != 'push' ]; then
  emit false 'source-event-is-not-push'
  exit 0
fi

if [ "$branch" != 'main' ]; then
  emit false 'source-branch-is-not-main'
  exit 0
fi

require_revision "$revision"

if ! valid_https_origin "$site_url"; then
  printf 'PRODUCTION_SITE_URL must be an absolute HTTPS origin without a path, query, or fragment\n' >&2
  exit 1
fi

if [ -n "$current_main_revision" ]; then
  require_revision "$current_main_revision"

  if [ "$revision" != "$current_main_revision" ]; then
    emit false 'superseded-by-current-main'
    exit 0
  fi
fi

emit true 'eligible-main-quality-run'
