#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
    printf '[%s] [scripts] [%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" "$2" >&2
}

log INFO "building orchestrator-go -> bin/orchestrator"
mkdir -p "$ROOT/bin"
(cd "$ROOT/orchestrator-go" && go build -o "$ROOT/bin/orchestrator" .)

log INFO "byte-compiling compression-py/compressor.py"
python3 -m py_compile "$ROOT/compression-py/compressor.py"

log INFO "compiling renderer-ts -> renderer-ts/dist"
if [[ ! -d "$ROOT/node_modules" ]]; then
    log INFO "node_modules missing - running npm install"
    (cd "$ROOT" && npm install)
fi
(cd "$ROOT" && npx tsc -p renderer-ts)

log INFO "build complete"
