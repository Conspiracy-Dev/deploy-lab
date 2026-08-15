#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly script_dir
readonly status_script="$script_dir/deploy-lab-status"
readonly image_one='ghcr.io/conspiracy-dev/deploy-lab@sha256:1111111111111111111111111111111111111111111111111111111111111111'
readonly image_two='ghcr.io/conspiracy-dev/deploy-lab@sha256:2222222222222222222222222222222222222222222222222222222222222222'

state_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$state_dir"
}
trap cleanup EXIT

assert_output() {
  local expected="$1"
  local actual

  actual="$(DEPLOY_LAB_STATE_DIR="$state_dir" "$status_script")"
  [[ $actual == "$expected" ]] || {
    printf 'Expected:\n%s\nActual:\n%s\n' "$expected" "$actual" >&2
    exit 1
  }
}

assert_output $'CURRENT=none\nPREVIOUS=none'

printf 'IMAGE_REF=%s\nDOMAIN=noash.net\n' "$image_one" > "$state_dir/current-image.env"
assert_output $'CURRENT=ghcr.io/conspiracy-dev/deploy-lab@sha256:1111111111111111111111111111111111111111111111111111111111111111\nPREVIOUS=none'

printf 'IMAGE_REF=%s\nDOMAIN=noash.net\n' "$image_two" > "$state_dir/previous-image.env"
assert_output $'CURRENT=ghcr.io/conspiracy-dev/deploy-lab@sha256:1111111111111111111111111111111111111111111111111111111111111111\nPREVIOUS=ghcr.io/conspiracy-dev/deploy-lab@sha256:2222222222222222222222222222222222222222222222222222222222222222'

printf 'IMAGE_REF=not-an-image\n' > "$state_dir/previous-image.env"
if DEPLOY_LAB_STATE_DIR="$state_dir" "$status_script" >/dev/null 2>&1; then
  echo 'Invalid state was accepted.' >&2
  exit 1
fi

echo 'Deployment status command tests passed.'
