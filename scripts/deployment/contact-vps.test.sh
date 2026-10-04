#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT
mkdir "$test_dir/bin"

cat > "$test_dir/bin/ssh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
if [[ $1 == '-G' ]]; then
  printf 'hostname %s\nuser %s\n' "${TEST_HOST:-194.87.83.103}" "${TEST_USER:-maintenance}"
  exit 0
fi
printf '%s\n' "$@" > "$TEST_ARGUMENTS"
printf '%s' "${!#}" > "$TEST_COMMAND"
MOCK
chmod +x "$test_dir/bin/ssh"
export PATH="$test_dir/bin:$PATH"
export TEST_ARGUMENTS="$test_dir/arguments"
export TEST_COMMAND="$test_dir/command"

bash "$script_dir/contact-vps.sh" --help | grep -q 'connect|setup|check'
[[ ! -e $TEST_ARGUMENTS ]]

for action in connect setup check; do
  bash "$script_dir/contact-vps.sh" "$action" fixture-alias
  grep -qx 'StrictHostKeyChecking=yes' "$TEST_ARGUMENTS"
  grep -qx 'BatchMode=yes' "$TEST_ARGUMENTS"
  grep -qx 'IdentitiesOnly=yes' "$TEST_ARGUMENTS"
  grep -qx 'ForwardAgent=no' "$TEST_ARGUMENTS"
  grep -qx 'ForwardX11=no' "$TEST_ARGUMENTS"
  grep -qx 'ClearAllForwardings=yes' "$TEST_ARGUMENTS"
  grep -qx 'fixture-alias' "$TEST_ARGUMENTS"
  if [[ $action == connect ]]; then
    [[ $(< "$TEST_COMMAND") == 'fixture-alias' ]]
  else
    command_text="$(< "$TEST_COMMAND")"
    bash -n -c "$command_text"
    # Replace only the sudo I/O boundary to prove shell quoting preserves the
    # exact remote program and action; never execute it against the host.
    sudo() {
      [[ $1 == '-n' && $2 == bash && $3 == '-c' && $5 == '--' ]]
      [[ $4 == "$(< "$script_dir/contact-env.sh")" && $6 == "$action" ]]
    }
    eval "$command_text"
  fi
done

rm "$TEST_ARGUMENTS" "$TEST_COMMAND"
printf 'fixture-alias\n' | bash "$script_dir/contact-vps.sh" connect
grep -qx 'fixture-alias' "$TEST_ARGUMENTS"
rm "$TEST_ARGUMENTS" "$TEST_COMMAND"

for invalid_alias in '-oProxyCommand=example' 'maintenance@example' 'alias;command'; do
  if bash "$script_dir/contact-vps.sh" check "$invalid_alias" >/dev/null 2>&1; then
    echo 'Unsafe alias was accepted.' >&2
    exit 1
  fi
done
if TEST_HOST=138.124.85.193 bash "$script_dir/contact-vps.sh" check fixture-alias >/dev/null 2>&1; then
  echo 'Source VPS was accepted.' >&2
  exit 1
fi
if TEST_USER=deployer bash "$script_dir/contact-vps.sh" setup fixture-alias >/dev/null 2>&1; then
  echo 'Restricted deployment identity was accepted.' >&2
  exit 1
fi
if bash "$script_dir/contact-vps.sh" restart fixture-alias >/dev/null 2>&1; then
  echo 'Unapproved restart action was accepted.' >&2
  exit 1
fi
[[ ! -e $TEST_ARGUMENTS ]]

echo 'Contact VPS helpers: routing, quoting and access-boundary tests passed.'
