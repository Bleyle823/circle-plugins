import type { CircleAgentConfig } from "./config.js";
/** A single place that enforces the Circle skill security rules. */
export interface GuardContext {
    /** Explicit user confirmation was provided for this action. */
    confirm?: boolean;
}
export declare function assertValidAddress(address: string, chainId: string): void;
export declare function assertPositiveAmount(amount: string | number): number;
/**
 * Enforce mainnet + high-value confirmation guardrails before a money-moving
 * action. Throws CONFIRMATION_REQUIRED / MAINNET_BLOCKED when confirmation is
 * missing.
 */
export declare function assertConfirmed(config: CircleAgentConfig, action: string, amountUsdc: number | undefined, ctx: GuardContext): void;
//# sourceMappingURL=guardrails.d.ts.map