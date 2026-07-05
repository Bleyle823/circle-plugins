import type { CircleWalletsClient } from "./client.js";
import type { FeeEstimate, TransactionInfo } from "./types.js";
export declare function estimateFee(client: CircleWalletsClient, params: {
    walletId: string;
    chain: string;
    destinationAddress: string;
    amount: string;
    tokenAddress?: string;
}): Promise<FeeEstimate>;
export declare function sendUSDC(client: CircleWalletsClient, params: {
    walletId: string;
    chain: string;
    destinationAddress: string;
    amount: string;
    tokenAddress?: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
}): Promise<TransactionInfo>;
export declare function getTransaction(client: CircleWalletsClient, id: string, chain?: string): Promise<TransactionInfo>;
/** Poll until the transaction reaches a terminal state (or times out). */
export declare function waitForTransaction(client: CircleWalletsClient, id: string, opts?: {
    chain?: string;
    intervalMs?: number;
    timeoutMs?: number;
}): Promise<TransactionInfo>;
export declare function accelerateTransaction(client: CircleWalletsClient, id: string): Promise<{
    id: string;
}>;
export declare function cancelTransaction(client: CircleWalletsClient, id: string): Promise<TransactionInfo>;
//# sourceMappingURL=transfers.d.ts.map