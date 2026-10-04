#!/usr/bin/env bash

set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# The fixed production path exists only in this isolated disposable container.
# No source, Notion credential, SSH connection or production volume is used.
docker run --rm --interactive --network none --read-only --user root \
  --tmpfs /opt/deploy-lab:rw,mode=0755 --tmpfs /tmp:rw,exec,mode=1777 \
  --mount "type=bind,src=$script_dir,dst=/tests,readonly" \
  --entrypoint bash deploy-lab-static:local -s <<'TEST'
set -euo pipefail
readonly helper=/tests/contact-env.sh
readonly fixture=/opt/deploy-lab/contact.env
readonly synthetic_token=ntn_synthetic_contact_helper_fixture

valid_fixture() {
  printf 'NUXT_NOTION_TOKEN=%s\nNUXT_NOTION_DATA_SOURCE_ID=11111111-2222-3333-4444-555555555555\n' "$synthetic_token" > "$fixture"
  chmod 600 "$fixture"
}
expect_failure() {
  if bash "$helper" check >/tmp/output 2>&1; then
    echo 'Invalid configuration was accepted.' >&2
    exit 1
  fi
  if grep -q "$synthetic_token" /tmp/output; then
    echo 'Credential appeared in diagnostics.' >&2
    exit 1
  fi
}

expect_failure
valid_fixture
bash "$helper" check >/tmp/output 2>&1
grep -q 'Значения скрыты' /tmp/output
! grep -q "$synthetic_token" /tmp/output

chmod 644 "$fixture"
expect_failure
valid_fixture
chown 1000:1000 "$fixture"
expect_failure
chown root:root "$fixture"
ln "$fixture" /opt/deploy-lab/extra-link
expect_failure
rm /opt/deploy-lab/extra-link
mv "$fixture" /opt/deploy-lab/linked-env
ln -s /opt/deploy-lab/linked-env "$fixture"
expect_failure
rm "$fixture" /opt/deploy-lab/linked-env

printf 'NUXT_NOTION_TOKEN=%s\n' "$synthetic_token" > "$fixture"
chmod 600 "$fixture"
expect_failure
valid_fixture
printf 'NUXT_NOTION_TOKEN=duplicate\n' >> "$fixture"
expect_failure
valid_fixture
printf 'touch /tmp/credential-executed\n' >> "$fixture"
expect_failure
[[ ! -e /tmp/credential-executed ]]
valid_fixture
sed -i 's/11111111-2222-3333-4444-555555555555/11111111222233334444555555555555--/' "$fixture"
expect_failure
valid_fixture
chmod 777 /opt/deploy-lab
expect_failure
chmod 755 /opt/deploy-lab

# An editor stub is the only mocked I/O boundary; it never uses real secrets.
mkdir /tmp/bin
printf '#!/usr/bin/env bash\nprintf "edited\\n" > /tmp/editor-called\n' > /tmp/bin/nano
chmod +x /tmp/bin/nano
export PATH="/tmp/bin:$PATH"
before="$(sha256sum "$fixture")"
bash "$helper" setup >/tmp/output 2>&1
[[ -f /tmp/editor-called && $(sha256sum "$fixture") == "$before" ]]
! grep -q "$synthetic_token" /tmp/output
rm "$fixture" /tmp/editor-called
if bash "$helper" setup >/tmp/output 2>&1; then
  echo 'An empty configuration was accepted.' >&2
  exit 1
fi
[[ -f /tmp/editor-called && $(stat -c '%u:%g:%a' "$fixture") == '0:0:600' ]]
echo 'Contact configuration helpers: isolated file-safety and redaction tests passed.'
TEST
