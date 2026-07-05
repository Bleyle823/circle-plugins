import type { CircleAgentConfig } from "./config.js";
import { err } from "./errors.js";
import type { GatewayBalance, NanopaymentResult } from "./types.js";

/**
 * x402 nanopayments via Circle Gateway (`@circle-fin/x402-batching`).
 *
 * Nanopayments are gas-free, sub-cent USDC payments. The buyer deposits USDC
 * into a Gateway Wallet once, then signs offchain EIP-3009 authorizations that
 * Circle batches and settles onchain. This module wraps the buyer-side
 * GatewayClient and exposes a seller-side middleware factory.
 *
 * The dependency is optional; a helpful error is thrown if it's missing.
 */

interface GatewayClientLike {
  deposit(amount: string | number, options?: unknown): Promise<unknown>;
  pay(url: string, options?: unknown): Promise<unknown>;
  withdraw(amount: string | number, options?: unknown): Promise<unknown>;
  getBalances(address?: string): Promise<unknown>;
  supports(url: string): Promise<boolean>;
}

async function loadX402(): Promise<any> {
  try {
    return await import("@circle-fin/x402-batching" as string);
  } catch (e) {
    throw err(
      "DEPENDENCY_MISSING",
      "Nanopayments require the optional peer dependency @circle-fin/x402-batching. " +
        "Install it: npm install @circle-fin/x402-batching",
      e
    );
  }
}

async function makeGatewayClient(
  config: CircleAgentConfig
): Promise<GatewayClientLike> {
  if (!config.x402PrivateKey) {
    throw err(
      "CONFIG_MISSING",
      "X402_PRIVATE_KEY is required for nanopayments (buyer signing key)."
    );
  }
  const mod = await loadX402();
  const GatewayClient =
    mod.GatewayClient ?? mod.client?.GatewayClient ?? mod.default?.GatewayClient;
  if (!GatewayClient) {
    throw err("DEPENDENCY_MISSING", "GatewayClient not found in @circle-fin/x402-batching.");
  }
  return new GatewayClient({
    chain: config.x402Chain ?? "base-sepolia",
    privateKey: config.x402PrivateKey,
  }) as GatewayClientLike;
}

/** One-time (per chain) deposit of USDC into the Gateway Wallet contract. */
export async function gatewayDeposit(
  config: CircleAgentConfig,
  amount: string
): Promise<{ amount: string; raw: unknown }> {
  const client = await makeGatewayClient(config);
  const raw = await client.deposit(amount);
  return { amount, raw };
}

/** Pay for an x402-compatible resource. Handles the 402 negotiation + retry. */
export async function payX402(
  config: CircleAgentConfig,
  url: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<NanopaymentResult> {
  const client = await makeGatewayClient(config);
  const raw: any = await client.pay(url, options);
  return {
    url,
    paid: true,
    data: raw?.data ?? raw?.body ?? raw,
    amount: raw?.amount,
    status: raw?.status,
  };
}

export async function gatewayBalance(
  config: CircleAgentConfig,
  address?: string
): Promise<GatewayBalance> {
  const client = await makeGatewayClient(config);
  const raw: any = await client.getBalances(address);
  const available =
    raw?.available ?? raw?.balance ?? raw?.total ?? (Array.isArray(raw) ? raw : "0");
  return { chain: config.x402Chain, available: String(available), raw };
}

export async function gatewayWithdraw(
  config: CircleAgentConfig,
  amount: string
): Promise<{ amount: string; raw: unknown }> {
  const client = await makeGatewayClient(config);
  const raw = await client.withdraw(amount);
  return { amount, raw };
}

/**
 * Seller-side: build Express-compatible middleware that requires x402 payment
 * for a route. Thin wrapper over `createGatewayMiddleware` so agents can also
 * *earn* USDC by exposing paid endpoints.
 */
export async function requirePayment(params: {
  sellerAddress: string;
  price?: string;
  chain?: string;
}): Promise<unknown> {
  const mod = await loadX402();
  const factory =
    mod.createGatewayMiddleware ??
    mod.server?.createGatewayMiddleware ??
    mod.default?.createGatewayMiddleware;
  if (!factory) {
    throw err(
      "DEPENDENCY_MISSING",
      "createGatewayMiddleware not found in @circle-fin/x402-batching."
    );
  }
  return factory({
    sellerAddress: params.sellerAddress,
    price: params.price,
    chain: params.chain,
  });
}
