/** Circle developer-wallet transaction IDs and Gateway x402 transfer IDs are UUIDs. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isCircleUuid(value) {
    return Boolean(value && UUID_RE.test(value.trim()));
}
/** 0x-prefixed EVM transaction hashes are not Circle wallet transfer UUIDs. */
export function isTxHash(value) {
    return Boolean(value && /^0x[0-9a-fA-F]{64}$/.test(value.trim()));
}
//# sourceMappingURL=ids.js.map