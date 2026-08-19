// hint:begin — generated from generated/wire_message.ts.hint. Edits between the markers are replaced; write inside a hole, or outside hint:end.
// The stable payload exchanged between stages.
export interface WireMessage {
    request_id: string;
    payload: string;
}

// Accept only objects carrying both wire fields.
export function validateWireMessage(value: unknown): boolean {
    // Honor:
    //   flow:
    //     Return false for any missing or non-string field.
    //   plus the knowledge inherited from ., generated — run `hint generated/wire_message.ts`
    // hint:hole(#validate_wire:body) spec=11c2bfef — your code; kept across re-emits.
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<WireMessage>;
    return typeof candidate.request_id === "string" && typeof candidate.payload === "string";
    // hint:end of hole.
}

// Normalize transport newlines without changing any other byte.
export function normalizePayload(payload: string): string {
    // Honor:
    //   flow:
    //     Convert CRLF to LF and leave existing LF unchanged.
    //   plus the knowledge inherited from ., generated — run `hint generated/wire_message.ts`
    // hint:hole(#normalize_payload:body) spec=69d13b3e — your code; kept across re-emits.
    throw new Error("Not implemented.");
    // hint:end of hole.
}
// hint:end — everything below is yours; the spec never touches it.
