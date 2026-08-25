#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly script_dir
readonly smoke_script="$script_dir/smoke-production-public.sh"

work_dir="$(mktemp -d)"
stub_dir="$work_dir/stub"
mkdir -p "$stub_dir"

cleanup() {
  rm -rf "$work_dir"
}

trap cleanup EXIT

cat > "$stub_dir/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

body=''
headers=''
write_out=''
url=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      body="$2"
      shift 2
      ;;
    --dump-header)
      headers="$2"
      shift 2
      ;;
    --write-out)
      write_out="$2"
      shift 2
      ;;
    *)
      url="$1"
      shift
      ;;
  esac
done

if [[ $url == http://* ]]; then
  printf '308 https://example.test/'
  exit 0
fi

status='200'
cache='no-cache'
content='<link rel="canonical" href="https://example.test/"><script src="/_nuxt/entry.abcdefgh.js"></script>'

case "$url" in
  https://example.test/_nuxt/*)
    cache='public, max-age=31536000, immutable'
    content='asset'
    ;;
  https://example.test/not-a-route)
    status='404'
    content='noindex, nofollow'
    ;;
  https://example.test/robots.txt|https://example.test/sitemap.xml)
    content='https://example.test/'
    ;;
  https://example.test/privacy-policy)
    content='privacy'
    ;;
esac

if [[ ${STUB_PUBLIC_SMOKE_MODE:-success} == 'privacy-failure' && $url == 'https://example.test/privacy-policy' ]]; then
  status='500'
fi

if [[ -n $headers ]]; then
  {
    printf 'HTTP/2 %s\n' "$status"
    printf 'x-content-type-options: nosniff\n'
    printf 'referrer-policy: strict-origin-when-cross-origin\n'
    printf 'permissions-policy: camera=(), geolocation=(), microphone=()\n'
    printf 'strict-transport-security: max-age=31536000; includeSubDomains\n'
    printf 'cache-control: %s\n' "$cache"
  } > "$headers"
fi

if [[ -n $body && $body != '/dev/null' ]]; then
  printf '%s\n' "$content" > "$body"
fi

if [[ $write_out == '%{http_code}' ]]; then
  printf '%s' "$status"
elif [[ $write_out == '%{http_code} %{redirect_url}' ]]; then
  printf '%s https://example.test/' "$status"
fi

if [[ $status != '200' && $url != 'https://example.test/not-a-route' ]]; then
  exit 22
fi
EOF
chmod 0700 "$stub_dir/curl"

run_smoke() {
  PATH="$stub_dir:$PATH" bash "$smoke_script" "$@"
}

run_smoke https://example.test

if STUB_PUBLIC_SMOKE_MODE=privacy-failure run_smoke https://example.test >/dev/null 2>&1; then
  printf '%s\n' 'A failed public route was accepted.' >&2
  exit 1
fi

if run_smoke http://example.test >/dev/null 2>&1; then
  printf '%s\n' 'A non-HTTPS origin was accepted.' >&2
  exit 1
fi

printf '%s\n' 'Public production smoke tests passed.'
