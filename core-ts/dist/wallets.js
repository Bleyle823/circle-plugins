import { getChain } from "./chains.js";
import { err } from "./errors.js";
function mapWallet(w) {
    return {
        id: w.id,
        address: w.address,
        blockchain: w.blockchain,
        accountType: w.accountType,
        state: w.state,
        walletSetId: w.walletSetId,
    };
}
export async function createWalletSet(client, name = "Circle Agent Kit") {
    const res = await client.createWalletSet({ name });
    const set = res?.data?.walletSet ?? res?.data;
    if (!set?.id)
        throw err("UPSTREAM", "Wallet set creation returned no id.", res);
    return { id: set.id, name: set.name };
}
export async function createWallet(client, params) {
    const chain = getChain(params.chain);
    const res = await client.createWallets({
        walletSetId: params.walletSetId,
        blockchains: [chain.id],
        count: params.count ?? 1,
        accountType: params.accountType ?? "EOA",
    });
    const wallets = res?.data?.wallets ?? [];
    if (!wallets.length)
        throw err("UPSTREAM", "Wallet creation returned no wallets.", res);
    return wallets.map(mapWallet);
}
export async function listWallets(client, params = {}) {
    const res = await client.listWallets({
        walletSetId: params.walletSetId,
        blockchain: params.chain ? getChain(params.chain).id : undefined,
    });
    const wallets = res?.data?.wallets ?? [];
    return wallets.map(mapWallet);
}
export async function getAddress(client, walletId) {
    const res = await client.getWallet({ id: walletId });
    const wallet = res?.data?.wallet ?? res?.data;
    if (!wallet?.address)
        throw err("NOT_FOUND", `No wallet found for id "${walletId}".`);
    return wallet.address;
}
/**
 * Balances MUST come from getWalletTokenBalance — getWallet/listWallets never
 * return balance data (per Circle skill rules).
 */
export async function getBalance(client, walletId) {
    const res = await client.getWalletTokenBalance({ id: walletId });
    const balances = res?.data?.tokenBalances ?? [];
    return balances.map((b) => ({
        token: b.token?.name ?? b.token?.symbol ?? "UNKNOWN",
        symbol: b.token?.symbol,
        tokenAddress: b.token?.tokenAddress,
        decimals: b.token?.decimals,
        amount: b.amount,
    }));
}
/** Convenience: sum of USDC across returned balances for a wallet. */
export async function getUsdcBalance(client, walletId) {
    const balances = await getBalance(client, walletId);
    const usdc = balances.find((b) => (b.symbol ?? "").toUpperCase() === "USDC");
    return usdc?.amount ?? "0";
}
//# sourceMappingURL=wallets.js.map