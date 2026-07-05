import type { CircleAgentConfig } from "./config.js";
import type { GatewayBalance, NanopaymentResult } from "./types.js";
/** One-time (per chain) deposit of USDC into the Gateway Wallet contract. */
export declare function gatewayDeposit(config: CircleAgentConfig, amount: string): Promise<{
    amount: string;
    raw: unknown;
}>;
/** Pay for an x402-compatible resource. Handles the 402 negotiation + retry. */
export declare function payX402(config: CircleAgentConfig, url: string, options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
}): Promise<NanopaymentResult>;
export declare function gatewayBalance(config: CircleAgentConfig, address?: string): Promise<GatewayBalance>;
export declare function gatewayWithdraw(config: CircleAgentConfig, amount: string): Promise<{
    amount: string;
    raw: unknown;
}>;
/**
 * Seller-side: build Express-compatible middleware that requires x402 payment
 * for a route. Thin wrapper over `createGatewayMiddleware` so agents can also
 * *earn* USDC by exposing paid endpoints.
 */
export declare function requirePayment(params: {
    sellerAddress: string;
    price?: string;
    chain?: string;
}): Promise<unknown>;
//# sourceMappingURL=nanopayments.d.ts.map