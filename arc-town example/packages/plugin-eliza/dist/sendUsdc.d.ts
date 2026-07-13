import type { TransactionInfo } from "@circle-plugins/core";
import type { IAgentRuntime } from "@elizaos/core";
/**
 * AppKit-based kit.sendUSDC currently fails when
 * @circle-fin/adapter-circle-wallets cannot import Blockchain from the wallets SDK.
 * This path uses developer-controlled wallets createTransaction with tokenId (works on Arc).
 */
export declare function sendUsdcViaWalletsApi(args: {
    runtime?: IAgentRuntime;
    walletId: string;
    destinationAddress: string;
    amount: string;
    wait?: boolean;
}): Promise<TransactionInfo>;
//# sourceMappingURL=sendUsdc.d.ts.map