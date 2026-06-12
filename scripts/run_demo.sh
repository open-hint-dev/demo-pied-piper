#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
    printf '[%s] [scripts] [%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >&2
}

TEXT="${1:-Piiiiiiiiiieeeeeeeeeed Piiiiiiiiiipeeeeeeeeeer streeeeeeeeeetches sooooooooo goooooooood!}"

if [[ ! -x "$ROOT/bin/orchestrator" || ! -f "$ROOT/renderer-ts/dist/app.js" ]]; then
    log INFO "build artifacts missing - running build"
    "$ROOT/scripts/build.sh"
fi

log INFO "running pipeline: orchestrator-go | compression-py | renderer-ts"

printf '%s' "$TEXT" \
    | "$ROOT/bin/orchestrator" \
    | python3 "$ROOT/compression-py/compressor.py" \
    | node "$ROOT/renderer-ts/dist/app.js"
