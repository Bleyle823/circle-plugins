import { randomUUID } from "node:crypto";
import type { TransactionInfo } from "@circle-plugins/core";
import { envSetting } from "./env.js";
import type { IAgentRuntime } from "@elizaos/core";

type WalletsClient = {
  getWalletTokenBalance: (args: { id: string }) => Promise<any>;
  createTransaction: (args: Record<string, unknown>) => Promise<any>;
  getTransaction: (args: { id: string }) => Promise<any>;
};

/**
 * AppKit-based kit.sendUSDC currently fails when
 * @circle-fin/adapter-circle-wallets cannot import Blockchain from the wallets SDK.
 * This path uses developer-controlled wallets createTransaction with tokenId (works on Arc).
 */
export async function sendUsdcViaWalletsApi(args: {
  runtime?: IAgentRuntime;
  walletId: string;
  destinationAddress: string;
  amount: string;
  wait?: boolean;
}): Promise<TransactionInfo> {
  const apiKey =
    (args.runtime ? envSetting(args.runtime, "CIRCLE_API_KEY") : undefined) ??
    process.env.CIRCLE_API_KEY;
  const entitySecret =
    (args.runtime ? envSetting(args.runtime, "ENTITY_SECRET") : undefined) ??
    (args.runtime ? envSetting(args.runtime, "CIRCLE_ENTITY_SECRET") : undefined) ??
    process.env.ENTITY_SECRET ??
    process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    throw new Error("CIRCLE_API_KEY and ENTITY_SECRET are required to send USDC.");
  }

  const mod = await import("@circle-fin/developer-controlled-wallets");
  const init =
    (mod as any).initiateDeveloperControlledWalletsClient ??
    (mod as any).default?.initiateDeveloperControlledWalletsClient;
  if (typeof init !== "function") {
    throw new Error("initiateDeveloperControlledWalletsClient not found");
  }

  const client = init({ apiKey, entitySecret }) as WalletsClient;
  const balRes = await client.getWalletTokenBalance({ id: args.walletId });
  const balances = balRes?.data?.tokenBalances ?? [];
  const usdc = balances.find(
    (b: any) =>
      (b.token?.symbol ?? "").toUpperCase() === "USDC" &&
      b.token?.id &&
      (b.token?.tokenAddress || Number(b.token?.decimals) === 6)
  );
  const tokenId = usdc?.token?.id;
  if (!tokenId) {
    throw new Error(`No USDC tokenId found for wallet ${args.walletId}`);
  }

  const created = await client.createTransaction({
    walletId: args.walletId,
    tokenId,
    destinationAddress: args.destinationAddress,
    amounts: [args.amount],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
    idempotencyKey: randomUUID(),
  });
  const id = created?.data?.id;
  if (!id) {
    throw new Error("Transfer creation returned no transaction id.");
  }

  let state = created?.data?.state ?? "INITIATED";
  let txHash: string | undefined;
  if (args.wait !== false) {
    const start = Date.now();
    while (Date.now() - start < 120_000) {
      const txRes = await client.getTransaction({ id });
      const tx = txRes?.data?.transaction ?? txRes?.data;
      state = tx?.state ?? state;
      txHash = tx?.txHash;
      if (["COMPLETE", "FAILED", "DENIED", "CANCELLED"].includes(String(state))) {
        break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return {
    id,
    state,
    txHash,
    explorerUrl: txHash ? `https://testnet.arcscan.so/tx/${txHash}` : undefined,
  };
}
