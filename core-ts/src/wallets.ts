import type { CircleWalletsClient } from "./client.js";
import { getChain } from "./chains.js";
import { err } from "./errors.js";
import type { TokenBalance, WalletInfo } from "./types.js";

function mapWallet(w: any): WalletInfo {
  return {
    id: w.id,
    address: w.address,
    blockchain: w.blockchain,
    accountType: w.accountType,
    state: w.state,
    walletSetId: w.walletSetId,
  };
}

export async function createWalletSet(
  client: CircleWalletsClient,
  name = "Circle Agent Kit"
): Promise<{ id: string; name?: string }> {
  const res = await client.createWalletSet({ name });
  const set = res?.data?.walletSet ?? res?.data;
  if (!set?.id) throw err("UPSTREAM", "Wallet set creation returned no id.", res);
  return { id: set.id, name: set.name };
}

export async function createWallet(
  client: CircleWalletsClient,
  params: {
    walletSetId: string;
    chain: string;
    accountType?: "EOA" | "SCA";
    count?: number;
  }
): Promise<WalletInfo[]> {
  const chain = getChain(params.chain);
  const res = await client.createWallets({
    walletSetId: params.walletSetId,
    blockchains: [chain.id],
    count: params.count ?? 1,
    accountType: params.accountType ?? "EOA",
  });
  const wallets = res?.data?.wallets ?? [];
  if (!wallets.length) throw err("UPSTREAM", "Wallet creation returned no wallets.", res);
  return wallets.map(mapWallet);
}

export async function listWallets(
  client: CircleWalletsClient,
  params: { walletSetId?: string; chain?: string } = {}
): Promise<WalletInfo[]> {
  const res = await client.listWallets({
    walletSetId: params.walletSetId,
    blockchain: params.chain ? getChain(params.chain).id : undefined,
  });
  const wallets = res?.data?.wallets ?? [];
  return wallets.map(mapWallet);
}

export async function getAddress(
  client: CircleWalletsClient,
  walletId: string
): Promise<string> {
  const res = await client.getWallet({ id: walletId });
  const wallet = res?.data?.wallet ?? res?.data;
  if (!wallet?.address) throw err("NOT_FOUND", `No wallet found for id "${walletId}".`);
  return wallet.address;
}

/**
 * Balances MUST come from getWalletTokenBalance — getWallet/listWallets never
 * return balance data (per Circle skill rules).
 */
export async function getBalance(
  client: CircleWalletsClient,
  walletId: string
): Promise<TokenBalance[]> {
  const res = await client.getWalletTokenBalance({ id: walletId });
  const balances = res?.data?.tokenBalances ?? [];
  return balances.map((b: any) => ({
    token: b.token?.name ?? b.token?.symbol ?? "UNKNOWN",
    symbol: b.token?.symbol,
    tokenAddress: b.token?.tokenAddress,
    decimals: b.token?.decimals,
    amount: b.amount,
  }));
}

/** Convenience: sum of USDC across returned balances for a wallet. */
export async function getUsdcBalance(
  client: CircleWalletsClient,
  walletId: string
): Promise<string> {
  const balances = await getBalance(client, walletId);
  const usdc = balances.find(
    (b) => (b.symbol ?? "").toUpperCase() === "USDC"
  );
  return usdc?.amount ?? "0";
}
