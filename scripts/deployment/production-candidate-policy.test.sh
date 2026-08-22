#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
policy="$script_dir/production-candidate-policy.sh"
revision='0123456789abcdef0123456789abcdef01234567'
current_revision='89abcdef0123456789abcdef0123456789abcdef'

run_case() {
  local name="$1"
  local expected_status="$2"
  local expected_eligible="$3"
  shift 3
  local output
  local actual_status=0
  local actual_eligible

  output="$(mktemp)"
  if ! env GITHUB_OUTPUT="$output" "$@" "$policy"; then
    actual_status=1
  fi

  actual_eligible="$(sed -n 's/^eligible=//p' "$output")"
  rm -f "$output"

  [ "$actual_status" = "$expected_status" ] || {
    printf '%s: expected status %s, received %s\n' "$name" "$expected_status" "$actual_status" >&2
    exit 1
  }

  [ "$actual_eligible" = "$expected_eligible" ] || {
    printf '%s: expected eligible=%s, received %s\n' "$name" "$expected_eligible" "$actual_eligible" >&2
    exit 1
  }
}

base_case=(
  "QUALITY_WORKFLOW_NAME=quality"
  "QUALITY_CONCLUSION=success"
  "SOURCE_EVENT=push"
  "HEAD_BRANCH=main"
  "REVISION=$revision"
  'PRODUCTION_SITE_URL=https://noash.net'
)

run_case 'successful main push' 0 true "${base_case[@]}"
run_case 'pull request' 0 false \
  "QUALITY_WORKFLOW_NAME=quality" \
  "QUALITY_CONCLUSION=success" \
  'SOURCE_EVENT=pull_request' \
  'HEAD_BRANCH=main' \
  "REVISION=$revision" \
  'PRODUCTION_SITE_URL=https://noash.net'
run_case 'non-main branch' 0 false \
  "QUALITY_WORKFLOW_NAME=quality" \
  "QUALITY_CONCLUSION=success" \
  'SOURCE_EVENT=push' \
  'HEAD_BRANCH=feature' \
  "REVISION=$revision" \
  'PRODUCTION_SITE_URL=https://noash.net'
run_case 'failed quality run' 0 false \
  "QUALITY_WORKFLOW_NAME=quality" \
  'QUALITY_CONCLUSION=failure' \
  'SOURCE_EVENT=push' \
  'HEAD_BRANCH=main' \
  "REVISION=$revision" \
  'PRODUCTION_SITE_URL=https://noash.net'
run_case 'cancelled quality run' 0 false \
  "QUALITY_WORKFLOW_NAME=quality" \
  'QUALITY_CONCLUSION=cancelled' \
  'SOURCE_EVENT=push' \
  'HEAD_BRANCH=main' \
  "REVISION=$revision" \
  'PRODUCTION_SITE_URL=https://noash.net'
run_case 'missing production origin' 1 '' "${base_case[@]/PRODUCTION_SITE_URL=https:\/\/noash.net/PRODUCTION_SITE_URL=}"
run_case 'invalid production origin' 1 '' \
  "QUALITY_WORKFLOW_NAME=quality" \
  "QUALITY_CONCLUSION=success" \
  'SOURCE_EVENT=push' \
  'HEAD_BRANCH=main' \
  "REVISION=$revision" \
  'PRODUCTION_SITE_URL=http://noash.net'
run_case 'stale main revision' 0 false "${base_case[@]}" "CURRENT_MAIN_REVISION=$current_revision"

printf 'Production candidate policy tests passed\n'
