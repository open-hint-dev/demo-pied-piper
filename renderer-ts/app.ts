// Pied Piper report renderer (pipeline stage 3): reads a CompressionResult
// (or an upstream error envelope) from stdin and prints the human report.

const SERVICE_NAME = "renderer-ts";

interface CompressionResult {
    request_id: string;
    source_service: string;
    algorithm: string;
    original_size_bytes: number;
    compressed_payload: string;
    compression_ratio: number;
}

interface ErrorEnvelope {
    error: {
        code: string;
        message: string;
        source_service: string;
        request_id: string;
    };
}

function log(level: "INFO" | "ERROR", message: string): void {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    process.stderr.write(`[${timestamp}] [${SERVICE_NAME}] [${level}] ${message}\n`);
}

function emitError(code: string, message: string, requestId: string): never {
    log("ERROR", `${code}: ${message}`);
    const envelope: ErrorEnvelope = {
        error: { code, message, source_service: SERVICE_NAME, request_id: requestId },
    };
    process.stdout.write(`${JSON.stringify(envelope)}\n`);
    process.exit(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
    if (!isRecord(value) || !isRecord(value.error)) {
        return false;
    }
    const body = value.error;
    return (
        typeof body.code === "string" &&
        typeof body.message === "string" &&
        typeof body.source_service === "string" &&
        typeof body.request_id === "string"
    );
}

function isCompressionResult(value: unknown): value is CompressionResult {
    return (
        isRecord(value) &&
        typeof value.request_id === "string" &&
        typeof value.source_service === "string" &&
        typeof value.algorithm === "string" &&
        typeof value.original_size_bytes === "number" &&
        typeof value.compressed_payload === "string" &&
        typeof value.compression_ratio === "number"
    );
}

function renderReport(result: CompressionResult): string {
    const weissman = Math.min(5.2, result.compression_ratio * 2.89);
    return [
        "=== PIED PIPER COMPRESSION REPORT ===",
        `request ........ ${result.request_id}`,
        `algorithm ...... ${result.algorithm}`,
        `original ....... ${result.original_size_bytes} bytes`,
        `compressed ..... ${result.compressed_payload.length} bytes`,
        `ratio .......... ${result.compression_ratio.toFixed(2)}`,
        `weissman ....... ${weissman.toFixed(2)}`,
        "=====================================",
    ].join("\n");
}

function readStdin(): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
        process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        process.stdin.on("error", reject);
    });
}

async function main(): Promise<void> {
    const raw = await readStdin();
    let message: unknown;
    try {
        message = JSON.parse(raw);
    } catch {
        emitError("PP_BAD_RESULT", "input is not valid JSON", "");
    }

    if (isErrorEnvelope(message)) {
        log("ERROR", `upstream failure ${message.error.code} from ${message.error.source_service}`);
        process.stdout.write(`=== PIPELINE FAILED: ${message.error.code}: ${message.error.message} ===\n`);
        process.exit(1);
    }
    if (!isCompressionResult(message)) {
        const requestId =
            isRecord(message) && typeof message.request_id === "string" ? message.request_id : "";
        emitError("PP_BAD_RESULT", "message is not a valid CompressionResult", requestId);
    }

    log("INFO", `accepted result ${message.request_id}`);
    process.stdout.write(`${renderReport(message)}\n`);
    log("INFO", `emitted report ${message.request_id}`);
}

main().catch((error: unknown) => {
    emitError("PP_INTERNAL", error instanceof Error ? error.message : String(error), "");
});
