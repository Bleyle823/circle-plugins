/** Shared error types so all cores/plugins surface a consistent contract. */
export type CircleAgentErrorCode = "CONFIG_MISSING" | "VALIDATION" | "CONFIRMATION_REQUIRED" | "MAINNET_BLOCKED" | "NOT_FOUND" | "DEPENDENCY_MISSING" | "TRANSACTION_FAILED" | "UPSTREAM";
export declare class CircleAgentError extends Error {
    readonly code: CircleAgentErrorCode;
    readonly details?: unknown;
    constructor(code: CircleAgentErrorCode, message: string, details?: unknown);
}
export declare const err: (code: CircleAgentErrorCode, message: string, details?: unknown) => CircleAgentError;
//# sourceMappingURL=errors.d.ts.map