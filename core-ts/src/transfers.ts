import { v4 as uuidv4 } from "uuid";
import type { CircleWalletsClient } from "./client.js";
import { getChain } from "./chains.js";
import { err } from "./errors.js";
import type { FeeEstimate, TransactionInfo, TransactionState } from "./types.js";
import { getBalance } from "./wallets.js";

const TERMINAL: TransactionState[] = ["COMPLETE", "FAILED", "DENIED", "CANCELLED"];

function explorerUrl(chain: string, txHash?: string): string | undefined {
  if (!txHash) return undefined;
  const info = getChain(chain);
  return info.explorer ? `${info.explorer}/tx/${txHash}` : undefined;
}

/**
 * Resolve the USDC token address for a wallet on a chain. Prefers the
 * on-chain balance record (authoritative), falling back to the static registry.
 */
async function resolveUsdcTokenAddress(
  client: CircleWalletsClient,
  walletId: string,
  chain: string
): Promise<string> {
  const balances = await getBalance(client, walletId);
  const usdc = balances.find((b) => (b.symbol ?? "").toUpperCase() === "USDC");
  if (usdc?.tokenAddress) return usdc.tokenAddress;
  const fallback = getChain(chain).usdcAddress;
  if (fallback) return fallback;
  throw err(
    "VALIDATION",
    `Could not resolve a USDC token address for wallet ${walletId} on ${chain}.`
  );
}

export async function estimateFee(
  client: CircleWalletsClient,
  params: {
    walletId: string;
    chain: string;
    destinationAddress: string;
    amount: string;
    tokenAddress?: string;
  }
): Promise<FeeEstimate> {
  const tokenAddress =
    params.tokenAddress ??
    (await resolveUsdcTokenAddress(client, params.walletId, params.chain));
  const res = await client.estimateTransferFee({
    walletId: params.walletId,
    tokenAddress,
    destinationAddress: params.destinationAddress,
    amounts: [params.amount],
  });
  return res?.data ?? {};
}

export async function sendUSDC(
  client: CircleWalletsClient,
  params: {
    walletId: string;
    chain: string;
    destinationAddress: string;
    amount: string;
    tokenAddress?: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
  }
): Promise<TransactionInfo> {
  const tokenAddress =
    params.tokenAddress ??
    (await resolveUsdcTokenAddress(client, params.walletId, params.chain));

  const res = await client.createTransaction({
    walletId: params.walletId,
    tokenAddress,
    destinationAddress: params.destinationAddress,
    amounts: [params.amount],
    fee: {
      type: "level",
      config: { feeLevel: params.feeLevel ?? "MEDIUM" },
    },
    idempotencyKey: uuidv4(),
  });

  const id = res?.data?.id;
  if (!id) throw err("UPSTREAM", "Transfer creation returned no transaction id.", res);
  return { id, state: res?.data?.state ?? "INITIATED" };
}

export async function getTransaction(
  client: CircleWalletsClient,
  id: string,
  chain?: string
): Promise<TransactionInfo> {
  const res = await client.getTransaction({ id });
  const tx = res?.data?.transaction ?? res?.data;
  if (!tx) throw err("NOT_FOUND", `No transaction found for id "${id}".`);
  return {
    id: tx.id ?? id,
    state: tx.state,
    txHash: tx.txHash,
    explorerUrl: explorerUrl(chain ?? tx.blockchain, tx.txHash),
  };
}

/** Poll until the transaction reaches a terminal state (or times out). */
export async function waitForTransaction(
  client: CircleWalletsClient,
  id: string,
  opts: { chain?: string; intervalMs?: number; timeoutMs?: number } = {}
): Promise<TransactionInfo> {
  const interval = opts.intervalMs ?? 3000;
  const timeout = opts.timeoutMs ?? 120000;
  const start = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const tx = await getTransaction(client, id, opts.chain);
    if (TERMINAL.includes(tx.state as TransactionState)) return tx;
    if (Date.now() - start > timeout) {
      throw err(
        "TRANSACTION_FAILED",
        `Timed out after ${timeout}ms waiting for transaction ${id} (last state: ${tx.state}).`
      );
    }
    await new Promise((r) => setTimeout(r, interval));
  }
}

export async function accelerateTransaction(
  client: CircleWalletsClient,
  id: string
): Promise<{ id: string }> {
  const res = await client.accelerateTransaction({ id, idempotencyKey: uuidv4() });
  return { id: res?.data?.id ?? id };
}

export async function cancelTransaction(
  client: CircleWalletsClient,
  id: string
): Promise<TransactionInfo> {
  const res = await client.cancelTransaction({ id, idempotencyKey: uuidv4() });
  return { id, state: res?.data?.state ?? "CANCELLED" };
}
