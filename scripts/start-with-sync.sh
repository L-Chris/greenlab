#!/bin/sh
set -eu

npm run start &
web_pid="$!"

while true; do
  npm run sync:ha || true
  sleep "${HA_SYNC_INTERVAL_SECONDS:-1800}"
done &
sync_pid="$!"

term() {
  kill "$web_pid" "$sync_pid" 2>/dev/null || true
}

trap term INT TERM

set +e
wait "$web_pid"
status="$?"
term
wait "$sync_pid" 2>/dev/null || true
exit "$status"
