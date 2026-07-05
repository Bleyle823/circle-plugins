import type { CircleWalletsClient } from "./client.js";
import type { TokenBalance, WalletInfo } from "./types.js";
export declare function createWalletSet(client: CircleWalletsClient, name?: string): Promise<{
    id: string;
    name?: string;
}>;
export declare function createWallet(client: CircleWalletsClient, params: {
    walletSetId: string;
    chain: string;
    accountType?: "EOA" | "SCA";
    count?: number;
}): Promise<WalletInfo[]>;
export declare function listWallets(client: CircleWalletsClient, params?: {
    walletSetId?: string;
    chain?: string;
}): Promise<WalletInfo[]>;
export declare function getAddress(client: CircleWalletsClient, walletId: string): Promise<string>;
/**
 * Balances MUST come from getWalletTokenBalance — getWallet/listWallets never
 * return balance data (per Circle skill rules).
 */
export declare function getBalance(client: CircleWalletsClient, walletId: string): Promise<TokenBalance[]>;
/** Convenience: sum of USDC across returned balances for a wallet. */
export declare function getUsdcBalance(client: CircleWalletsClient, walletId: string): Promise<string>;
//# sourceMappingURL=wallets.d.ts.map