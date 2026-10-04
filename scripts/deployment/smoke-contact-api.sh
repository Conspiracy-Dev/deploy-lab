#!/usr/bin/env bash

set -euo pipefail

readonly base_url="${CONTACT_SMOKE_URL:?Set the local smoke origin}"
readonly api_container="${CONTACT_SMOKE_API:?Set the disposable API container}"
readonly network="${CONTACT_SMOKE_NETWORK:?Set the disposable internal network}"
readonly image_ref="${IMAGE_REF:?Set the smoke image}"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

wait_for_api() {
  local attempt
  for attempt in {1..30}; do
    if docker exec "$api_container" curl --fail --silent \
      http://127.0.0.1:3000/contact-health >/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo 'API readiness did not become healthy.' >&2
  return 1
}

assert_response() {
  local expected_status="$1"
  local expected_body="$2"
  shift 2
  local status
  status="$(curl --silent --show-error --output "$work_dir/response.json" \
    --dump-header "$work_dir/headers" --write-out '%{http_code}' "$@")"
  [[ $status == "$expected_status" ]] || {
    printf 'Expected contact status %s; received %s\n' "$expected_status" "$status" >&2
    exit 1
  }
  if [[ -n $expected_body ]]; then
    python3 -c '
import json, sys
actual, expected = json.load(open(sys.argv[1])), json.loads(sys.argv[2])
for value in (actual, expected):
    if "fields" in value:
        value["fields"].sort()
assert actual == expected
' \
      "$work_dir/response.json" "$expected_body"
  fi
}

wait_for_api
assert_response 405 '' "$base_url/api/contact"
assert_response 404 '' "$base_url/contact-health"
assert_response 404 '' "$base_url/api/contact/extra"

assert_response 403 '{"error":"invalid_origin"}' -H 'Content-Type: application/json' \
  -H 'Origin: https://other.example' --data '{}' "$base_url/api/contact"
assert_response 415 '{"error":"unsupported_media_type"}' -H "Origin: $base_url" \
  -H 'Content-Type: text/plain' --data '{}' "$base_url/api/contact"

# A filled honeypot returns acceptance without reaching Notion (attempt one).
assert_response 201 '{"status":"accepted"}' -H "Origin: $base_url" \
  -H 'Content-Type: application/json' \
  --data '{"name":"Smoke test","email":"smoke@example.com","message":"Container-only smoke request","consent":true,"website":"bot"}' \
  "$base_url/api/contact"
grep -qi '^cache-control: no-store' "$work_dir/headers"

# Changing a forged forwarded address must not reset the real client's limit.
for suffix in 1 2 3 4; do
  assert_response 400 '{"error":"invalid_request","fields":["name","email","message","consent","website"]}' \
    -H "Origin: $base_url" -H 'Content-Type: application/json' \
    -H "X-Forwarded-For: 192.0.2.$suffix" --data '{}' "$base_url/api/contact"
done
assert_response 429 '{"error":"rate_limited"}' -H "Origin: $base_url" \
  -H 'Content-Type: application/json' -H 'X-Forwarded-For: 192.0.2.99' \
  --data '{}' "$base_url/api/contact"
grep -qi '^retry-after:' "$work_dir/headers"

# Missing credentials must fail safely, with no external request or leaked data.
docker rm --force "$api_container" >/dev/null
docker run --detach --name "$api_container" --network "$network" --network-alias api \
  --user node --read-only --tmpfs /tmp \
  --env NITRO_HOST=0.0.0.0 --env NITRO_PORT=3000 \
  --env "NUXT_PUBLIC_SITE_URL=$base_url" --env NUXT_TRUST_PROXY=true \
  "$image_ref" node /app/.output/server/index.mjs >/dev/null

for attempt in {1..30}; do
  if docker exec "$api_container" curl --silent --output /dev/null --write-out '%{http_code}' \
    http://127.0.0.1:3000/contact-health | grep -qx '503'; then
    break
  fi
  sleep 1
done
[[ $attempt -lt 30 ]]
assert_response 503 '{"error":"service_unavailable"}' -H "Origin: $base_url" \
  -H 'Content-Type: application/json' \
  --data '{"name":"Smoke test","email":"smoke@example.com","message":"Container-only smoke request","consent":true,"website":""}' \
  "$base_url/api/contact"

printf '%8200s' 'x' > "$work_dir/oversized-body"
assert_response 413 '' -H "Origin: $base_url" -H 'Content-Type: application/json' \
  --data-binary "@$work_dir/oversized-body" "$base_url/api/contact"

if [[ ${CONTACT_SMOKE_BROWSER:-0} == '1' ]]; then
  CONTACT_SMOKE_URL="$base_url" node "$script_dir/smoke-contact-browser.mjs"
fi

docker stop "$api_container" >/dev/null
assert_response 200 '' "$base_url/"
assert_response 502 '' -H "Origin: $base_url" -H 'Content-Type: application/json' \
  --data '{}' "$base_url/api/contact"

docker logs "${CONTACT_SMOKE_SITE:?Set the disposable site container}" > "$work_dir/proxy.log" 2>&1
docker logs "$api_container" > "$work_dir/api.log" 2>&1
python3 -c '
import json, sys
for path in sys.argv[1:]:
    text = open(path).read()
    assert "smoke@example.com" not in text
    assert "Container-only" not in text
    assert "192.0.2." not in text
    assert "contact-smoke-placeholder" not in text
    for line in text.splitlines():
        if line.startswith("{"):
            assert "request" not in json.loads(line)
' "$work_dir/proxy.log" "$work_dir/api.log"

echo 'Contact image smoke passed: readiness, routing, proxy trust, limiting, safe failure and page availability.'
