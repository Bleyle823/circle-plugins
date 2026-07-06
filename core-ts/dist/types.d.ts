/** Public data shapes returned by the kit (framework-agnostic). */
export interface WalletInfo {
    id: string;
    address: string;
    blockchain: string;
    accountType?: string;
    state?: string;
    walletSetId?: string;
}
export interface TokenBalance {
    token: string;
    tokenAddress?: string;
    symbol?: string;
    amount: string;
    decimals?: number;
}
export type TransactionState = "INITIATED" | "WAITING" | "QUEUED" | "CLEARED" | "SENT" | "STUCK" | "CONFIRMED" | "COMPLETE" | "FAILED" | "DENIED" | "CANCELLED";
export interface TransactionInfo {
    id: string;
    state: TransactionState | string;
    txHash?: string;
    explorerUrl?: string;
}
export interface FeeEstimate {
    low?: unknown;
    medium?: unknown;
    high?: unknown;
}
export interface PaymentRequest {
    /** Unique id for this request. */
    id: string;
    /** Amount of USDC requested. */
    amount: string;
    /** Chain id the payment should be made on. */
    chain: string;
    /** Destination address to pay. */
    destinationAddress: string;
    /** USDC token address on the chain. */
    tokenAddress?: string;
    /** Optional human note / memo. */
    memo?: string;
    /** EIP-681 style payment URI. */
    uri: string;
    /** Data string suitable for rendering a QR code (same as uri). */
    qrData: string;
    /** ISO timestamp. */
    createdAt: string;
}
export interface NanopaymentResult {
    url: string;
    paid: boolean;
    /** Response body returned by the paid resource, if any. */
    data?: unknown;
    /** Amount charged (base units), when reported by the server. */
    amount?: string;
    /** Human-readable amount (e.g. "0.01"), when reported. */
    formattedAmount?: string;
    /** Circle Gateway transfer UUID for the settled payment, when reported. */
    transaction?: string;
    /** Payer (buyer) address that signed the nanopayment. */
    payer?: string;
    /** Block explorer URL for the payer address on the payment chain. */
    explorerUrl?: string;
    status?: number;
}
export interface GatewayBalance {
    chain?: string;
    available: string;
    raw?: unknown;
}
export interface FaucetResult {
    chain: string;
    address: string;
    requested: {
        native: boolean;
        usdc: boolean;
        eurc: boolean;
    };
    note: string;
}
//# sourceMappingURL=types.d.ts.map