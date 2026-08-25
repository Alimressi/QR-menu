#!/usr/bin/env bash
# Generate GamePoint's whole photo set with the account's own Workers AI.
#
# flux-1-schnell is ~58 neurons an image, so the 92 dishes come to ~5,300 of the
# 10,000 free per day and the run costs nothing. (Leonardo Lucid Origin is
# ~2,590 an image — the same set would be 24 days of allowance, or a paid plan.)
#
# Waits by asking rather than by clock. The allowance is documented to reset at
# 00:00 UTC, but the accounting lagged well past it — sleeping until a wall
# clock time woke up to the same refusal. So it probes for a real image every
# quarter hour and starts the moment one comes back.
#
# The throwaway worker in scripts/ai-image-worker is only up while probing or
# generating, never through the wait, so a multi-hour `wrangler dev` cannot
# quietly die between the two.
#
# Usage: scripts/generate-gamepoint-photos.sh [id,id,...]
set -uo pipefail
cd "$(dirname "$0")/.."

PORT=8799
IDS="${1:-}"
LOG=/tmp/gamepoint-imagegen.log
PROBE='{"prompt":"a bowl of popcorn","model":"@cf/black-forest-labs/flux-1-schnell"}'

start_worker() {
  npx wrangler dev --remote --port "$PORT" --config scripts/ai-image-worker/wrangler.jsonc > "$LOG" 2>&1 &
  WORKER_PID=$!
  for _ in $(seq 60); do
    grep -qiE "Ready on" "$LOG" 2>/dev/null && return 0
    sleep 2
  done
  return 1
}

stop_worker() {
  [ -n "${WORKER_PID:-}" ] && kill "$WORKER_PID" 2>/dev/null
  WORKER_PID=""
}

trap 'stop_worker' EXIT

while true; do
  start_worker || { echo "Worker failed to start; see $LOG"; exit 1; }

  BODY=$(curl -s -m 120 -X POST "http://localhost:$PORT" -H 'content-type: application/json' -d "$PROBE" | head -c 200)

  if ! printf '%s' "$BODY" | grep -q "4006"; then
    echo "Allowance available. Generating..."
    node scripts/generate-gamepoint-photos.mjs "$IDS"
    exit $?
  fi

  stop_worker
  echo "$(date -u '+%H:%M UTC') — still out of neurons, retrying in 15 min"
  sleep 900
done
