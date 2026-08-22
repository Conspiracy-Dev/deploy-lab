#!/usr/bin/env bash

set -euo pipefail

readonly image_name='ghcr.io/conspiracy-dev/deploy-lab'
readonly legacy_wget_digest='sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7'

emit() {
  local eligible="$1"
  local reason="$2"

  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf 'eligible=%s\nreason=%s\n' "$eligible" "$reason" >> "$GITHUB_OUTPUT"
  fi

  printf 'Production release policy: eligible=%s reason=%s\n' "$eligible" "$reason"
}

require_revision() {
  [[ "$1" =~ ^[0-9a-f]{40}$ ]] || {
    printf 'Expected a full lowercase 40-character revision\n' >&2
    exit 1
  }
}

require_image_ref() {
  [[ "$1" =~ ^ghcr\.io/conspiracy-dev/deploy-lab@sha256:[0-9a-f]{64}$ ]] || {
    printf 'Expected an immutable DeployLab GHCR image reference\n' >&2
    exit 1
  }
}

valid_https_origin() {
  python3 - "$1" <<'PY'
import sys
from urllib.parse import urlparse

raw = sys.argv[1]
parsed = urlparse(raw)
if (
    raw != raw.strip()
    or parsed.scheme != 'https'
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

release_source="${RELEASE_SOURCE:-}"
revision="${REVISION:-}"
quality_workflow_name="${QUALITY_WORKFLOW_NAME:-}"
quality_conclusion="${QUALITY_CONCLUSION:-}"
quality_event="${QUALITY_EVENT:-}"
quality_branch="${QUALITY_BRANCH:-}"
quality_revision="${QUALITY_REVISION:-}"
candidate_revision="${CANDIDATE_REVISION:-}"
candidate_image_ref="${CANDIDATE_IMAGE_REF:-}"
resolved_image_ref="${RESOLVED_IMAGE_REF:-}"
image_revision_label="${IMAGE_REVISION_LABEL:-}"
image_source_label="${IMAGE_SOURCE_LABEL:-}"
site_url="${PRODUCTION_SITE_URL:-}"
current_main_revision="${CURRENT_MAIN_REVISION:-}"

case "$release_source" in
  automatic | manual) ;;
  *)
    printf 'RELEASE_SOURCE must be automatic or manual\n' >&2
    exit 1
    ;;
esac

require_revision "$revision"
require_revision "$quality_revision"
require_revision "$candidate_revision"
require_image_ref "$candidate_image_ref"
require_image_ref "$resolved_image_ref"

if ! valid_https_origin "$site_url"; then
  printf 'PRODUCTION_SITE_URL must be an absolute HTTPS origin without a path, query, or fragment\n' >&2
  exit 1
fi

if [ "$quality_workflow_name" != 'quality' ] \
  || [ "$quality_conclusion" != 'success' ] \
  || [ "$quality_event" != 'push' ] \
  || [ "$quality_branch" != 'main' ] \
  || [ "$quality_revision" != "$revision" ]; then
  emit false 'quality-provenance-failed'
  exit 0
fi

if [ "$candidate_revision" != "$revision" ] || [ "$candidate_image_ref" != "$resolved_image_ref" ]; then
  emit false 'candidate-evidence-mismatch'
  exit 0
fi

if [ "$image_revision_label" != "$revision" ] || [ "$image_source_label" != "${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-Conspiracy-Dev/deploy-lab}" ]; then
  emit false 'oci-provenance-failed'
  exit 0
fi

if [ "$resolved_image_ref" = "$image_name@$legacy_wget_digest" ]; then
  emit false 'legacy-wget-image-rejected'
  exit 0
fi

if [ "$release_source" = 'automatic' ]; then
  require_revision "$current_main_revision"

  if [ "$revision" != "$current_main_revision" ]; then
    emit false 'superseded-by-current-main'
    exit 0
  fi
fi

emit true 'verified-release-candidate'
