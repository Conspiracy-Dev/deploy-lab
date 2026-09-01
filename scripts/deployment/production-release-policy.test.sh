#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
policy="$script_dir/production-release-policy.sh"
revision='0123456789abcdef0123456789abcdef01234567'
other_revision='89abcdef0123456789abcdef0123456789abcdef'
image_ref='ghcr.io/conspiracy-dev/deploy-lab@sha256:653f0283674afa6e840ddecd712b6b13b7e61c8e89ba8f8a326022e6135a0bfb'
other_image_ref='ghcr.io/conspiracy-dev/deploy-lab@sha256:f138699caf90a0c76f54554a143f8e4fa693fe3bbc89ccfdfdbff7e346ed7fb8'
legacy_image_ref='ghcr.io/conspiracy-dev/deploy-lab@sha256:8891c68e54ab1c6423a1e277394dc38996b260f523d3bb3e5c31dacef1f742f7'

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
  'RELEASE_SOURCE=automatic'
  "REVISION=$revision"
  'QUALITY_WORKFLOW_NAME=quality'
  'QUALITY_CONCLUSION=success'
  'QUALITY_EVENT=push'
  'QUALITY_BRANCH=main'
  "QUALITY_REVISION=$revision"
  'PROVENANCE_SOURCE=verified-candidate'
  "CANDIDATE_REVISION=$revision"
  "CANDIDATE_IMAGE_REF=$image_ref"
  "RESOLVED_IMAGE_REF=$image_ref"
  "IMAGE_REVISION_LABEL=$revision"
  'IMAGE_SOURCE_LABEL=https://github.com/Conspiracy-Dev/deploy-lab'
  'PRODUCTION_SITE_URL=https://noash.net'
  "CURRENT_MAIN_REVISION=$revision"
)

legacy_case=("${base_case[@]}")
legacy_case[9]="CANDIDATE_IMAGE_REF=$legacy_image_ref"
legacy_case[10]="RESOLVED_IMAGE_REF=$legacy_image_ref"

historical_manual_case=("${base_case[@]}")
historical_manual_case[0]='RELEASE_SOURCE=manual'
historical_manual_case[7]='PROVENANCE_SOURCE=historical-quality'
historical_manual_case[8]='CANDIDATE_REVISION='
historical_manual_case[9]='CANDIDATE_IMAGE_REF='

historical_automatic_case=("${base_case[@]}")
historical_automatic_case[7]='PROVENANCE_SOURCE=historical-quality'
historical_automatic_case[8]='CANDIDATE_REVISION='
historical_automatic_case[9]='CANDIDATE_IMAGE_REF='

run_case 'verified automatic candidate' 0 true "${base_case[@]}"
run_case 'manual verified historical candidate' 0 true "${base_case[@]/RELEASE_SOURCE=automatic/RELEASE_SOURCE=manual}" "CURRENT_MAIN_REVISION=$other_revision"
run_case 'manual historical quality recovery' 0 true "${historical_manual_case[@]}"
run_case 'automatic historical quality recovery' 0 false "${historical_automatic_case[@]}"
run_case 'automatic stale candidate' 0 false "${base_case[@]/CURRENT_MAIN_REVISION=$revision/CURRENT_MAIN_REVISION=$other_revision}"
run_case 'failed quality provenance' 0 false "${base_case[@]/QUALITY_CONCLUSION=success/QUALITY_CONCLUSION=failure}"
run_case 'candidate image differs from resolved digest' 0 false "${base_case[@]/RESOLVED_IMAGE_REF=$image_ref/RESOLVED_IMAGE_REF=$other_image_ref}"
run_case 'wrong OCI source' 0 false "${base_case[@]/IMAGE_SOURCE_LABEL=https:\/\/github.com\/Conspiracy-Dev\/deploy-lab/IMAGE_SOURCE_LABEL=https:\/\/example.test\/other}"
run_case 'legacy wget image' 0 false "${legacy_case[@]}"
run_case 'invalid manual revision' 1 '' "${base_case[@]/RELEASE_SOURCE=automatic/RELEASE_SOURCE=manual}" 'REVISION=ABC'

printf 'Production release policy tests passed\n'
