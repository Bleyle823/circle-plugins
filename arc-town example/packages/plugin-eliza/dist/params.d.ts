import type { Memory, State } from "@elizaos/core";
export declare function extractAddress(text: string): string | undefined;
export declare function extractAmount(text: string): string | undefined;
export declare function extractUrl(text: string): string | undefined;
export declare function defaultPaywallUrl(): string;
/** Ensure paywall requests always hit the /risk-profile route. */
export declare function normalizePaywallUrl(url: string): string;
/** Keep only real tool params from the runtime-provided options object. */
export declare function pickActionParams(options?: Record<string, unknown>): Record<string, unknown>;
/**
 * Resolve action params. Precedence (later wins):
 *   1. regex extraction from message text (+ prior responses)
 *   2. state values from providers (e.g. circleWalletId)
 *   3. structured `message.content.params`
 *   4. explicit handler `options`
 */
export declare function resolveParams(message: Memory, state?: State, options?: Record<string, unknown>, responses?: Memory[]): Record<string, unknown>;
//# sourceMappingURL=params.d.ts.map