import type { FaucetResult, PaymentRequest } from "./types.js";
/**
 * Create a USDC payment request ("please pay me") for a given amount, chain,
 * and destination address. Produces an EIP-681 payment URI that wallets/QR
 * scanners can consume, plus a stable id for reconciliation.
 *
 * This is offchain metadata generation — no funds move until someone pays it.
 */
export declare function createPaymentRequest(params: {
    amount: string;
    chain: string;
    destinationAddress: string;
    memo?: string;
    tokenAddress?: string;
}): PaymentRequest;
/** Testnet faucet guidance for topping up an agent wallet with USDC. */
export declare function faucetInfo(chain: string): {
    chain: string;
    testnet: boolean;
    faucetUrl?: string;
    note: string;
};
/**
 * Request free testnet tokens from Circle's faucet (`POST /v1/faucet/drips`)
 * for a wallet address. Testnet only — mainnet chains have no faucet.
 *
 * Defaults: USDC is always requested; native gas is requested too unless the
 * chain's native gas token IS USDC (e.g. Arc), in which case USDC alone covers it.
 */
export declare function requestFaucet(params: {
    apiKey: string;
    address: string;
    chain: string;
    native?: boolean;
    usdc?: boolean;
    eurc?: boolean;
}): Promise<FaucetResult>;
/** Convert a decimal string amount to integer base units without float error. */
export declare function toBaseUnits(amount: string | number, decimals: number): string;
//# sourceMappingURL=requests.d.ts.map