#!/usr/bin/env bash
set -euo pipefail

hint generated/wire_message.ts >/dev/null
hint emit --check generated/wire_message.ts
hint diff generated/wire_message.ts
if hint status --exit-code; then
    echo "expected the committed unfilled demo hole to make status exit 1" >&2
    exit 1
elif [[ $? -ne 1 ]]; then
    exit 1
fi
hint verify generated/wire_message.ts
