#!/usr/bin/env bash

# Disable tracing before any credential-bearing editor is opened.
set +x
set -euo pipefail

usage() {
  printf 'Usage: bash scripts/deployment/contact-vps.sh connect|setup|check [SSH_ALIAS]\n'
}

action="${1:-}"
if [[ $action == '--help' || $action == '-h' ]]; then
  usage
  exit 0
fi
if [[ $# -lt 1 || $# -gt 2 || ! $action =~ ^(connect|setup|check)$ ]]; then
  usage >&2
  exit 1
fi

ssh_alias="${2:-}"
if [[ -z $ssh_alias ]]; then
  read -r -p 'Введите настроенный SSH-алиас для обслуживания VPS: ' ssh_alias
fi
if [[ ! $ssh_alias =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
  printf 'Укажите SSH-алиас, а не команду, адрес с user@ или параметры SSH.\n' >&2
  exit 1
fi

# Resolve existing local configuration; never discover or accept a new host key.
ssh_options=(-o StrictHostKeyChecking=yes -o BatchMode=yes -o IdentitiesOnly=yes
  -o ForwardAgent=no -o ForwardX11=no -o ClearAllForwardings=yes -o ConnectTimeout=10)
ssh_config="$(ssh -G "${ssh_options[@]}" "$ssh_alias")"
resolved_host="$(awk '$1 == "hostname" { print $2; exit }' <<< "$ssh_config")"
resolved_user="$(awk '$1 == "user" { print $2; exit }' <<< "$ssh_config")"
if [[ $resolved_host != '194.87.83.103' || $resolved_user != 'maintenance' ]]; then
  printf 'Остановлено: алиас должен указывать на maintenance на производственном VPS 194.87.83.103.\n' >&2
  exit 1
fi

if [[ $action == 'connect' ]]; then
  exec ssh -t "${ssh_options[@]}" "$ssh_alias"
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# Single-quote the static program, including embedded quotes. No credential is
# read locally or transmitted as an SSH command argument.
remote_script="$(sed "s/'/'\\\\''/g" "$script_dir/contact-env.sh")"
exec ssh -t "${ssh_options[@]}" "$ssh_alias" "sudo -n bash -c '$remote_script' -- '$action'"
