#!/usr/bin/env bash

set -euo pipefail

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is unavailable: %s\n' "$1" >&2
    exit 1
  }
}

require_command curl
require_command docker
require_command python3

image_ref="${IMAGE_REF:?Set IMAGE_REF to the immutable image digest}"
expected_site_url="${EXPECTED_SITE_URL:?Set EXPECTED_SITE_URL to the canonical origin}"
project="deploy_lab_image_smoke_${RANDOM}_$$"
site_container="${project}_site"
health_container="${project}_healthcheck"
data_volume="${project}_data"
config_volume="${project}_config"
port="$(python3 - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    print(sock.getsockname()[1])
PY
)"
base_url="http://localhost:${port}"
work_dir="$(mktemp -d)"

cleanup() {
  docker rm --force "$site_container" "$health_container" >/dev/null 2>&1 || true
  docker volume rm --force "$data_volume" "$config_volume" >/dev/null 2>&1 || true
  rm -rf "$work_dir"
}

trap cleanup EXIT

docker image inspect "$image_ref" >/dev/null
docker volume create "$data_volume" >/dev/null
docker volume create "$config_volume" >/dev/null
docker run --detach --name "$site_container" \
  --publish "127.0.0.1:${port}:80" \
  --read-only \
  --tmpfs /tmp \
  --volume "$data_volume:/data" \
  --volume "$config_volume:/config" \
  --env SITE_HOST=localhost \
  "$image_ref" >/dev/null

wait_for_site() {
  local attempt=0

  while [ "$attempt" -lt 30 ]; do
    if curl --fail --silent --show-error "$base_url/" >/dev/null 2>&1; then
      return 0
    fi

    attempt=$((attempt + 1))
    sleep 1
  done

  printf 'Timed out waiting for the static site container\n' >&2
  docker logs "$site_container" >&2 || true
  exit 1
}

wait_for_site

request() {
  local path="$1"
  local stem="$2"
  local status

  status="$(curl --fail-with-body --silent --show-error --output "$work_dir/$stem.body" \
    --dump-header "$work_dir/$stem.headers" --write-out '%{http_code}' "$base_url$path")"

  [ "$status" = '200' ] || {
    printf 'Expected 200 for %s, received %s\n' "$path" "$status" >&2
    exit 1
  }
}

request / home
request /privacy-policy privacy
request /robots.txt robots
request /sitemap.xml sitemap

docker restart "$site_container" >/dev/null
wait_for_site
request / restarted-home

grep -Fq "$expected_site_url" "$work_dir/robots.body"
grep -Fq "$expected_site_url" "$work_dir/sitemap.body"
grep -qi '^x-content-type-options: nosniff' "$work_dir/home.headers"
grep -qi '^referrer-policy: strict-origin-when-cross-origin' "$work_dir/home.headers"
grep -qi '^permissions-policy: camera=(), geolocation=(), microphone=()' "$work_dir/home.headers"

[ "$(grep -ci '^content-security-policy:' "$work_dir/home.headers" || true)" -le 1 ]

asset_path="$(grep -Eo '/(_nuxt/[^"[:space:]]+\.(css|js)|_fonts/[^"[:space:]]+\.woff2|_ipx/[^"[:space:]]+)' "$work_dir/home.body" | head -n 1)"
[ -n "$asset_path" ] || {
  printf 'No generated static asset was found in the homepage response\n' >&2
  exit 1
}

request "$asset_path" asset
grep -qi '^cache-control: public, max-age=31536000, immutable' "$work_dir/asset.headers"

not_found_status="$(curl --silent --show-error --output "$work_dir/not-found.body" \
  --dump-header "$work_dir/not-found.headers" --write-out '%{http_code}' "$base_url/not-a-route")"
[ "$not_found_status" = '404' ] || {
  printf 'Expected 404 for an unknown route, received %s\n' "$not_found_status" >&2
  exit 1
}

grep -Fq 'noindex, nofollow' "$work_dir/not-found.body"

docker run --rm --entrypoint sh "$image_ref" -c '
  ! command -v node &&
  command -v curl &&
  test ! -d /app &&
  test ! -e /srv/.env &&
  test -f /srv/index.html &&
  test -f /srv/404.html
'

printf '%s\n' \
  '{' \
  '  local_certs' \
  '}' \
  'healthcheck.test {' \
  '  respond "ok"' \
  '}' > "$work_dir/healthcheck.Caddyfile"

docker run --detach --name "$health_container" --network none \
  --volume "$work_dir/healthcheck.Caddyfile:/etc/caddy/Caddyfile:ro" \
  "$image_ref" >/dev/null

readiness_attempt=0
while [ "$readiness_attempt" -lt 30 ]; do
  if docker exec "$health_container" curl --fail --silent --show-error --insecure \
    --resolve 'healthcheck.test:443:127.0.0.1' 'https://healthcheck.test/' >/dev/null 2>&1; then
    break
  fi

  readiness_attempt=$((readiness_attempt + 1))
  sleep 1
done

if [ "$readiness_attempt" -eq 30 ]; then
  printf 'Timed out waiting for the HTTPS healthcheck container\n' >&2
  docker logs "$health_container" >&2 || true
  exit 1
fi

attempt=0
while [ "$attempt" -lt 20 ]; do
  docker exec "$health_container" curl --fail --silent --show-error --insecure \
    --resolve 'healthcheck.test:443:127.0.0.1' 'https://healthcheck.test/' >/dev/null
  attempt=$((attempt + 1))
done

if docker exec "$health_container" ps -eo stat=,comm= | grep -Eq '^Z.*ssl_client$'; then
  printf 'Repeated HTTPS healthchecks left zombie ssl_client processes\n' >&2
  exit 1
fi

printf 'Static image smoke test passed for %s at %s\n' "$image_ref" "$base_url"
