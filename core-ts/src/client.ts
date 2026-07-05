import type { CircleAgentConfig } from "./config.js";
import { err } from "./errors.js";

/**
 * Minimal structural interface of the Circle developer-controlled-wallets SDK
 * client that the kit relies on. Declaring it here keeps the core testable
 * (a mock can be injected) and avoids leaking the full SDK types everywhere.
 */
export interface CircleWalletsClient {
  createWalletSet(params: { name?: string }): Promise<any>;
  createWallets(params: {
    walletSetId: string;
    blockchains: string[];
    count?: number;
    accountType?: string;
    metadata?: unknown;
  }): Promise<any>;
  listWallets(params?: { walletSetId?: string; blockchain?: string }): Promise<any>;
  getWallet(params: { id: string }): Promise<any>;
  getWalletTokenBalance(params: { id: string }): Promise<any>;
  createTransaction(params: {
    walletId: string;
    tokenAddress?: string;
    tokenId?: string;
    destinationAddress: string;
    amounts: string[];
    fee?: unknown;
    idempotencyKey?: string;
  }): Promise<any>;
  getTransaction(params: { id: string }): Promise<any>;
  estimateTransferFee(params: {
    walletId: string;
    tokenAddress?: string;
    destinationAddress: string;
    amounts: string[];
  }): Promise<any>;
  accelerateTransaction(params: { id: string; idempotencyKey?: string }): Promise<any>;
  cancelTransaction(params: { id: string; idempotencyKey?: string }): Promise<any>;
  /** Execute a write function on a smart contract from a wallet. */
  createContractExecutionTransaction(params: {
    walletId: string;
    contractAddress: string;
    abiFunctionSignature?: string;
    abiParameters?: unknown[];
    callData?: string;
    amount?: string;
    fee?: unknown;
    idempotencyKey?: string;
  }): Promise<any>;
  /** Circle App Kit instance for unified fund flows (lazy-loaded). */
  appKit: any;
  /** Circle Wallets adapter for App Kit (lazy-loaded). */
  adapter: any;
}

/**
 * Lazily construct the real Circle SDK client. Imported dynamically so that
 * consumers who only use, say, chain metadata don't pay the dependency cost,
 * and so tests can inject a mock instead.
 */
export async function createWalletsClient(
  config: CircleAgentConfig
): Promise<CircleWalletsClient> {
  try {
    const mod = await import("@circle-fin/developer-controlled-wallets");
    const init =
      (mod as any).initiateDeveloperControlledWalletsClient ??
      (mod as any).default?.initiateDeveloperControlledWalletsClient;
    if (typeof init !== "function") {
      throw err(
        "DEPENDENCY_MISSING",
        "Could not find initiateDeveloperControlledWalletsClient in @circle-fin/developer-controlled-wallets."
      );
    }
    const walletsClient = init({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });

    // Initialize App Kit + Adapter
    const { AppKit } = await import("@circle-fin/app-kit");
    const { createCircleWalletsAdapter } = await import("@circle-fin/adapter-circle-wallets");

    const adapter = createCircleWalletsAdapter({
      apiKey: config.apiKey,
      entitySecret: config.entitySecret,
    });

    const appKit = new AppKit();

    return Object.assign(walletsClient, { appKit, adapter }) as CircleWalletsClient;
  } catch (e) {
    if (e && (e as any).code === "DEPENDENCY_MISSING") throw e;
    throw err(
      "DEPENDENCY_MISSING",
      "Failed to initialize @circle-fin/developer-controlled-wallets. Is it installed?",
      e
    );
  }
}
