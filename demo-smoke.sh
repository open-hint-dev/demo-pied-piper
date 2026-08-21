#!/usr/bin/env bash
set -euo pipefail
HINT_BIN="${HINT_BIN:-hint}"

if [[ -n "${HINTBOOK_SOFTWARE_ENGINEER:-}" ]]; then
    "$HINT_BIN" remove @openhint/hintbook-software-engineer
    "$HINT_BIN" add "file://${HINTBOOK_SOFTWARE_ENGINEER}"
fi

"$HINT_BIN" generated/wire_message.ts >/dev/null
"$HINT_BIN" emit --check generated/wire_message.ts
"$HINT_BIN" diff generated/wire_message.ts
if "$HINT_BIN" status --exit-code; then
    echo "expected the committed unfilled demo hole to make status exit 1" >&2
    exit 1
elif [[ $? -ne 1 ]]; then
    exit 1
fi
"$HINT_BIN" verify generated/wire_message.ts
