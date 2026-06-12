"""Pied Piper middle-out compression engine (pipeline stage 2).

Reads a CompressionJob from stdin and emits a CompressionResult to stdout.
"""

import json
import sys
from datetime import datetime, timezone
from typing import NoReturn

SERVICE_NAME = "compression-py"
ALGORITHM = "middle-out-rle-v1"
ERR_BAD_JOB = "PP_BAD_JOB"


def log(level: str, message: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{timestamp}] [{SERVICE_NAME}] [{level}] {message}", file=sys.stderr)


def emit_error(code: str, message: str, request_id: str) -> NoReturn:
    log("ERROR", f"{code}: {message}")
    envelope = {
        "error": {
            "code": code,
            "message": message,
            "source_service": SERVICE_NAME,
            "request_id": request_id,
        }
    }
    print(json.dumps(envelope))
    sys.exit(1)


def rle(text: str) -> str:
    encoded: list[str] = []
    i = 0
    while i < len(text):
        j = i
        while j < len(text) and text[j] == text[i]:
            j += 1
        encoded.append(f"{text[i]}{j - i}")
        i = j
    return "".join(encoded)


def compress_middle_out(text: str) -> str:
    middle = len(text) // 2
    left = rle(text[:middle][::-1])  # first half, encoded from the middle outward
    right = rle(text[middle:])
    return f"{left}|{right}"


def main() -> None:
    raw = sys.stdin.read()
    request_id = ""
    try:
        job = json.loads(raw)
    except json.JSONDecodeError as exc:
        emit_error(ERR_BAD_JOB, f"input is not valid JSON: {exc.msg}", request_id)
    if isinstance(job, dict) and isinstance(job.get("error"), dict):
        code = job["error"].get("code", "UNKNOWN")
        log("ERROR", f"forwarding upstream failure {code}")
        print(json.dumps(job))
        sys.exit(1)
    if isinstance(job, dict) and isinstance(job.get("request_id"), str):
        request_id = job["request_id"]
    payload = job.get("payload") if isinstance(job, dict) else None
    if not request_id or not isinstance(payload, str) or payload == "":
        emit_error(
            ERR_BAD_JOB,
            "job must carry string request_id and non-empty string payload",
            request_id,
        )
    log("INFO", f"accepted job {request_id}")

    compressed = compress_middle_out(payload)
    original_size = len(payload.encode("utf-8"))
    result = {
        "request_id": request_id,
        "source_service": SERVICE_NAME,
        "algorithm": ALGORITHM,
        "original_size_bytes": original_size,
        "compressed_payload": compressed,
        "compression_ratio": round(original_size / len(compressed), 2),
    }
    print(json.dumps(result))
    log("INFO", f"emitted result {request_id} (ratio {result['compression_ratio']})")


if __name__ == "__main__":
    main()
