import type { CircleWalletsClient } from "./client.js";
import type { CircleAgentConfig } from "./config.js";
import type { TransactionInfo } from "./types.js";
/** Left-pad an EVM address to a 32-byte hex string (CCTP bytes32 encoding). */
export declare function addressToBytes32(address: string): string;
/** Execute a write function on a contract from a wallet. */
export declare function executeContract(client: CircleWalletsClient, params: {
    walletId: string;
    contractAddress: string;
    abiFunctionSignature?: string;
    abiParameters?: unknown[];
    callData?: string;
    amount?: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
}): Promise<TransactionInfo>;
export interface BridgeResult {
    fromChain: string;
    toChain: string;
    amount: string;
    burnTxId: string;
    burnTxHash?: string;
    attestation?: string;
    mintTxId?: string;
    mintTxHash?: string;
    state: "BURNED" | "COMPLETE";
}
/**
 * Bridge USDC across chains via CCTP v2. Uses the Circle App Kit to handle
 * the complete flow (approve -> burn -> attest -> mint).
 */
export declare function bridgeUSDC(client: CircleWalletsClient, _config: CircleAgentConfig, params: {
    fromChain: string;
    toChain: string;
    sourceWalletId: string;
    destWalletId: string;
    amount: string;
    mintRecipient?: string;
    waitForMint?: boolean;
}): Promise<BridgeResult>;
export interface SwapQuote {
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    buyAmount: string;
    /** Router/spender to approve. */
    allowanceTarget: string;
    /** Router contract to call. */
    to: string;
    /** Raw calldata for the swap. */
    data: string;
    /** Native value to send (usually "0" for ERC20->ERC20). */
    value?: string;
}
/**
 * Fetch a swap quote from the Circle App Kit.
 */
export declare function getSwapQuote(client: CircleWalletsClient, config: CircleAgentConfig, params: {
    chain: string;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    takerAddress: string;
    slippageBps?: number;
}): Promise<SwapQuote>;
/**
 * Execute a token swap from a wallet using the Circle App Kit.
 */
export declare function swap(client: CircleWalletsClient, config: CircleAgentConfig, params: {
    walletId: string;
    walletAddress: string;
    chain: string;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    slippageBps?: number;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
}): Promise<{
    quote: any;
    swapTxId: string;
}>;
//# sourceMappingURL=contracts.d.ts.map