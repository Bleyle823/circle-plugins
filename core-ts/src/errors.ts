/** Shared error types so all cores/plugins surface a consistent contract. */

export type CircleAgentErrorCode =
  | "CONFIG_MISSING"
  | "VALIDATION"
  | "CONFIRMATION_REQUIRED"
  | "MAINNET_BLOCKED"
  | "NOT_FOUND"
  | "DEPENDENCY_MISSING"
  | "TRANSACTION_FAILED"
  | "UPSTREAM";

export class CircleAgentError extends Error {
  readonly code: CircleAgentErrorCode;
  readonly details?: unknown;

  constructor(code: CircleAgentErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "CircleAgentError";
    this.code = code;
    this.details = details;
  }
}

export const err = (
  code: CircleAgentErrorCode,
  message: string,
  details?: unknown
) => new CircleAgentError(code, message, details);
