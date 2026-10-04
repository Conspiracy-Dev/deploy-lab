#!/usr/bin/env bash

set +x
set -euo pipefail

readonly config_dir='/opt/deploy-lab'
readonly config_file="$config_dir/contact.env"

fail() {
  printf '%s\n' "$1" >&2
  exit 1
}

check_directory() {
  [[ -d $config_dir && ! -L $config_dir ]] || fail 'Каталог /opt/deploy-lab отсутствует или является симлинком. Нужна проверка администратора.'
  [[ $(stat -c '%u' "$config_dir") == 0 ]] || fail 'Каталог /opt/deploy-lab должен принадлежать root.'
  local directory_mode
  directory_mode="$(stat -c '%a' "$config_dir")"
  (( (8#$directory_mode & 0022) == 0 )) || fail 'Каталог /opt/deploy-lab доступен для записи группе или другим пользователям.'
  [[ ! -L $config_file ]] || fail 'contact.env является симлинком. Изменения остановлены.'
  [[ ! -e $config_file || -f $config_file ]] || fail 'contact.env не является обычным файлом.'
}

check_file() {
  [[ -f $config_file ]] || fail 'Файл contact.env ещё не подготовлен.'
  [[ $(stat -c '%u:%g:%a:%h' "$config_file") == '0:0:600:1' ]] || fail 'Ожидается обычный файл root:root с правами 600 и без жёстких ссылок.'
  # Validate the minimal dotenv contract without sourcing or displaying it.
  awk '
    /^NUXT_NOTION_TOKEN=[A-Za-z0-9_]+$/ { token++; next }
    /^NUXT_NOTION_DATA_SOURCE_ID=[0-9A-Fa-f-]+$/ {
      value = substr($0, index($0, "=") + 1)
      if (length(value) != 32 && !(length(value) == 36 &&
          substr(value, 9, 1) == "-" && substr(value, 14, 1) == "-" &&
          substr(value, 19, 1) == "-" && substr(value, 24, 1) == "-")) invalid = 1
      gsub(/-/, "", value)
      if (length(value) != 32) invalid = 1
      source++; next
    }
    { invalid = 1 }
    END { exit (invalid || token != 1 || source != 1) }
  ' "$config_file" || fail 'Нужны ровно две строки: непустой NUXT_NOTION_TOKEN и корректный NUXT_NOTION_DATA_SOURCE_ID, без кавычек и дополнительных строк.'
  printf 'Конфигурация подготовлена: root:root, 600, обе переменные заданы. Значения скрыты.\n'
  printf 'Это не проверка доступа к Notion. Контейнеры и сайт не изменены.\n'
}

[[ $(id -u) == 0 ]] || fail 'Запустите через административный доступ с sudo.'
[[ $# == 1 && $1 =~ ^(setup|check)$ ]] || fail 'Usage: sudo bash contact-env.sh setup|check'
check_directory

if [[ $1 == setup ]]; then
  command -v nano >/dev/null || fail 'Редактор nano не установлен. Остановитесь и сообщите администратору; скрипт не устанавливает пакеты.'
  if [[ -e $config_file ]]; then
    [[ $(stat -c '%u:%g:%a:%h' "$config_file") == '0:0:600:1' ]] || fail 'Существующий файл имеет небезопасные права или ссылки. Автоматически изменять его нельзя.'
  else
    umask 077
    (set -o noclobber; : > "$config_file")
    chown root:root "$config_file"
    chmod 600 "$config_file"
  fi
  printf 'В редакторе задайте ровно две строки (настоящие значения вставляйте только туда):\n'
  printf 'NUXT_NOTION_TOKEN=...\nNUXT_NOTION_DATA_SOURCE_ID=...\n'
  printf 'Сохранить: Ctrl+O, Enter. Выйти: Ctrl+X. Не присылайте скриншот редактора.\n'
  nano -- "$config_file"
fi

check_file
