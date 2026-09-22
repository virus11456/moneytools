#!/usr/bin/env bash
set -euo pipefail

release_id=${1:?release id required}
[[ "$release_id" =~ ^[0-9a-f]{40}$ ]]
base=/var/www/stocktools-frontend
release="$base/releases/$release_id"
test -s "$release/index.html"
test -s "$release/sitemap.xml"
test -d "$release/assets"

previous=$(readlink "$base/current" || true)
rm -f "$base/.next" "$base/.rollback"
ln -s "releases/$release_id" "$base/.next"
mv -Tf "$base/.next" "$base/current"

if ! curl --fail --silent --show-error --max-time 10 \
  --resolve www.stocktools.cc:443:127.0.0.1 \
  https://www.stocktools.cc/ > /dev/null; then
  if [[ -n "$previous" ]]; then
    ln -s "$previous" "$base/.rollback"
    mv -Tf "$base/.rollback" "$base/current"
  fi
  exit 1
fi

printf 'Activated %s\n' "$release_id"
