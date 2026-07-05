/** Shared error types so all cores/plugins surface a consistent contract. */
export class CircleAgentError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "CircleAgentError";
        this.code = code;
        this.details = details;
    }
}
export const err = (code, message, details) => new CircleAgentError(code, message, details);
//# sourceMappingURL=errors.js.map