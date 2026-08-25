#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly script_dir
readonly wrapper="$script_dir/deploy-lab"
readonly ssh_command="$script_dir/deploy-lab-ssh-command"
readonly image_one='ghcr.io/conspiracy-dev/deploy-lab@sha256:1111111111111111111111111111111111111111111111111111111111111111'
readonly image_two='ghcr.io/conspiracy-dev/deploy-lab@sha256:2222222222222222222222222222222222222222222222222222222222222222'

work_dir="$(mktemp -d)"
stub_dir="$work_dir/stub"
mkdir -p "$stub_dir"

cleanup() {
  rm -rf "$work_dir"
}

trap cleanup EXIT

cat > "$stub_dir/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ $1 == 'run' ]]; then
  [[ ${STUB_CADDY_FAIL:-0} != '1' ]]
  exit
fi

[[ $1 == 'compose' ]]
shift

env_file=''
all="$*"
while [[ $# -gt 0 ]]; do
  if [[ $1 == '--env-file' ]]; then
    env_file="$2"
    shift 2
    continue
  fi
  shift
done

image="$(sed -n 's/^IMAGE_REF=//p' "$env_file")"
printf '%s\n' "$all" >> "$STUB_LOG"

if [[ $all == *' config '* ]]; then
  [[ ${STUB_COMPOSE_CONFIG_FAIL:-0} != '1' ]]
  exit
fi

if [[ $all == *' pull site'* && $image == "${STUB_PULL_FAIL_IMAGE:-}" ]]; then
  exit 1
fi

if [[ $all == *' up --detach'* && $image == "${STUB_UP_FAIL_IMAGE:-}" ]]; then
  exit 1
fi
EOF

cat > "$stub_dir/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

image="$(sed -n 's/^IMAGE_REF=//p' "$STUB_STATE_DIR/current-image.env" 2>/dev/null || true)"

if [[ " $* " == *' --resolve '* ]]; then
  [[ $image != "${STUB_LOCAL_FAIL_IMAGE:-}" ]]
else
  [[ $image != "${STUB_PUBLIC_FAIL_IMAGE:-}" ]]
fi
EOF

cat > "$stub_dir/sleep" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

chmod 0700 "$stub_dir/docker" "$stub_dir/curl" "$stub_dir/sleep"

new_case() {
  case_dir="$(mktemp -d "$work_dir/case.XXXXXX")"
  compose_file="$case_dir/compose.yaml"
  state_dir="$case_dir/state"
  stub_log="$case_dir/docker.log"
  mkdir -p "$state_dir"
  printf '%s\n' 'services: {}' > "$compose_file"
  : > "$stub_log"
  unset STUB_CADDY_FAIL STUB_COMPOSE_CONFIG_FAIL STUB_PULL_FAIL_IMAGE
  unset STUB_UP_FAIL_IMAGE STUB_LOCAL_FAIL_IMAGE STUB_PUBLIC_FAIL_IMAGE
}

set_current_image() {
  printf 'IMAGE_REF=%s\nDOMAIN=example.test\n' "$1" > "$state_dir/current-image.env"
}

state_image() {
  sed -n 's/^IMAGE_REF=//p' "$state_dir/$1-image.env"
}

invoke_wrapper() {
  local image="$1"

  set +e
  wrapper_output="$(PATH="$stub_dir:$PATH" \
    DEPLOY_LAB_COMPOSE_FILE="$compose_file" \
    DEPLOY_LAB_STATE_DIR="$state_dir" \
    DEPLOY_LAB_DOMAIN='example.test' \
    STUB_LOG="$stub_log" \
    STUB_STATE_DIR="$state_dir" \
    STUB_CADDY_FAIL="${STUB_CADDY_FAIL:-0}" \
    STUB_COMPOSE_CONFIG_FAIL="${STUB_COMPOSE_CONFIG_FAIL:-0}" \
    STUB_PULL_FAIL_IMAGE="${STUB_PULL_FAIL_IMAGE:-}" \
    STUB_UP_FAIL_IMAGE="${STUB_UP_FAIL_IMAGE:-}" \
    STUB_LOCAL_FAIL_IMAGE="${STUB_LOCAL_FAIL_IMAGE:-}" \
    STUB_PUBLIC_FAIL_IMAGE="${STUB_PUBLIC_FAIL_IMAGE:-}" \
    "$wrapper" "$image" 2>&1)"
  wrapper_status=$?
  set -e
}

assert_status() {
  [[ $wrapper_status == "$1" ]] || {
    printf 'Expected exit %s, received %s\n%s\n' "$1" "$wrapper_status" "$wrapper_output" >&2
    exit 1
  }
}

new_case
invoke_wrapper 'ghcr.io/conspiracy-dev/deploy-lab:latest'
assert_status 64

new_case
rm "$compose_file"
invoke_wrapper "$image_two"
assert_status 78

new_case
STUB_COMPOSE_CONFIG_FAIL=1
invoke_wrapper "$image_two"
assert_status 78

new_case
set_current_image "$image_one"
STUB_PULL_FAIL_IMAGE="$image_two"
invoke_wrapper "$image_two"
assert_status 70
[[ "$(state_image current)" == "$image_one" ]]

new_case
set_current_image "$image_one"
STUB_CADDY_FAIL=1
invoke_wrapper "$image_two"
assert_status 70
[[ "$(state_image current)" == "$image_one" ]]

new_case
set_current_image "$image_one"
invoke_wrapper "$image_two"
assert_status 0
[[ "$(state_image current)" == "$image_two" ]]
[[ "$(state_image previous)" == "$image_one" ]]
grep -Fqx "Release is healthy: $image_two" <<< "$wrapper_output"

new_case
STUB_LOCAL_FAIL_IMAGE="$image_two"
invoke_wrapper "$image_two"
assert_status 70
[[ ! -e "$state_dir/current-image.env" ]]

new_case
set_current_image "$image_one"
STUB_LOCAL_FAIL_IMAGE="$image_two"
invoke_wrapper "$image_two"
assert_status 75
[[ "$(state_image current)" == "$image_one" ]]
grep -Fq 'Previous release restored after candidate failure.' <<< "$wrapper_output"

new_case
set_current_image "$image_one"
STUB_PUBLIC_FAIL_IMAGE="$image_two"
invoke_wrapper "$image_two"
assert_status 75
[[ "$(state_image current)" == "$image_one" ]]

new_case
set_current_image "$image_one"
STUB_LOCAL_FAIL_IMAGE="$image_two"
STUB_PULL_FAIL_IMAGE="$image_one"
invoke_wrapper "$image_two"
assert_status 70
[[ "$(state_image current)" == "$image_one" ]]
grep -Fq 'Previous release could not be restored.' <<< "$wrapper_output"

for command in \
  'ls -la' \
  "sudo /usr/local/sbin/deploy-lab $image_two extra" \
  "DEPLOY_LAB_STATE_DIR=/tmp/test sudo /usr/local/sbin/deploy-lab $image_two"; do
  if SSH_ORIGINAL_COMMAND="$command" "$ssh_command" >/dev/null 2>&1; then
    printf 'Forced SSH command accepted: %s\n' "$command" >&2
    exit 1
  fi
done

printf '%s\n' 'Deployment wrapper tests passed.'
