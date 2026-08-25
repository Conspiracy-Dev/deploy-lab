#!/usr/bin/env bash

set -euo pipefail

usage() {
  printf '%s\n' 'Usage: smoke-production-public.sh https://canonical.example' >&2
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Required command is unavailable: %s\n' "$1" >&2
    exit 69
  }
}

readonly public_origin="${1:-}"

if [[ $# -ne 1 || ! $public_origin =~ ^https://[A-Za-z0-9.-]+$ ]]; then
  usage
  exit 64
fi

require_command curl
require_command grep
require_command mktemp

readonly http_origin="http://${public_origin#https://}"
work_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$work_dir"
}

trap cleanup EXIT

request_ok() {
  local path="$1"
  local name="$2"
  local status

  status="$(curl --fail-with-body --silent --show-error \
    --output "$work_dir/$name.body" \
    --dump-header "$work_dir/$name.headers" \
    --write-out '%{http_code}' \
    "$public_origin$path")"

  [[ $status == '200' ]] || {
    printf 'Expected 200 for %s, received %s\n' "$path" "$status" >&2
    exit 65
  }
}

request_ok / home
request_ok /privacy-policy privacy
request_ok /robots.txt robots
request_ok /sitemap.xml sitemap

redirect="$(curl --silent --show-error --output /dev/null --max-redirs 0 \
  --write-out '%{http_code} %{redirect_url}' "$http_origin/")"
[[ $redirect == "308 $public_origin/" ]] || {
  printf 'Expected HTTP 308 redirect to %s/, received %s\n' "$public_origin" "$redirect" >&2
  exit 65
}

grep -Fq "<link rel=\"canonical\" href=\"$public_origin/\"" "$work_dir/home.body"
grep -Fq "$public_origin" "$work_dir/robots.body"
grep -Fq "$public_origin" "$work_dir/sitemap.body"

grep -qi '^x-content-type-options: nosniff' "$work_dir/home.headers"
grep -qi '^referrer-policy: strict-origin-when-cross-origin' "$work_dir/home.headers"
grep -qi '^permissions-policy: camera=(), geolocation=(), microphone=()' "$work_dir/home.headers"
grep -qi '^strict-transport-security: max-age=31536000; includesubdomains' "$work_dir/home.headers"
grep -qi '^cache-control: no-cache' "$work_dir/home.headers"

asset_path="$(grep -Eo '/(_nuxt/[^"[:space:]]+\.[[:alnum:]_-]{8,}\.(css|js)|_fonts/[^"[:space:]]+\.[[:alnum:]_-]{8,}\.woff2|_ipx/[^"[:space:]]+)' \
  "$work_dir/home.body" | head -n 1)"
[[ -n $asset_path ]] || {
  printf '%s\n' 'No hashed static asset was found in the homepage response' >&2
  exit 65
}

request_ok "$asset_path" asset
grep -qi '^cache-control: public, max-age=31536000, immutable' "$work_dir/asset.headers"

not_found_status="$(curl --silent --show-error \
  --output "$work_dir/not-found.body" \
  --dump-header "$work_dir/not-found.headers" \
  --write-out '%{http_code}' \
  "$public_origin/not-a-route")"
[[ $not_found_status == '404' ]] || {
  printf 'Expected 404 for an unknown route, received %s\n' "$not_found_status" >&2
  exit 65
}
grep -Fq 'noindex, nofollow' "$work_dir/not-found.body"

printf 'Public production smoke passed for %s\n' "$public_origin"
