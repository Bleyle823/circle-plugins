import type { CircleAgentConfig } from "./config.js";
import { err } from "./errors.js";
import { isCircleUuid } from "./ids.js";
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
  readonly address?: string;
}

/** Block explorer base URLs per x402 chain identifier. */
const EXPLORER_BASE: Record<string, string> = {
  arcTestnet: "https://testnet.arcscan.app",
  "arc-testnet": "https://testnet.arcscan.app",
  baseSepolia: "https://sepolia.basescan.org",
  "base-sepolia": "https://sepolia.basescan.org",
};

function explorerAddressUrl(chain: string | undefined, address?: string): string | undefined {
  if (!chain || !address) return undefined;
  const base = EXPLORER_BASE[chain];
  return base ? `${base}/address/${address}` : undefined;
}

async function loadX402(subpath = ""): Promise<any> {
  const path = subpath
    ? `@circle-fin/x402-batching/${subpath}`
    : "@circle-fin/x402-batching";
  try {
    return await import(path as string);
  } catch (e) {
    throw err(
      "DEPENDENCY_MISSING",
      `Nanopayments require the optional peer dependency ${path}. ` +
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
  const mod = await loadX402("client");
  const GatewayClient =
    mod.GatewayClient ?? mod.client?.GatewayClient ?? mod.default?.GatewayClient;
  if (!GatewayClient) {
    throw err(
      "DEPENDENCY_MISSING",
      "GatewayClient not found in @circle-fin/x402-batching/client."
    );
  }
  return new GatewayClient({
    chain: config.x402Chain ?? "arcTestnet",
    privateKey: config.x402PrivateKey,
  }) as GatewayClientLike;
}

/** One-time (per chain) deposit of USDC into the Gateway Wallet contract. */
export async function gatewayDeposit(
  config: CircleAgentConfig,
  amount: string
): Promise<{ amount: string; raw: unknown }> {
  const client = await makeGatewayClient(config);
  const raw: any = await client.deposit(amount);
  return { 
    amount: raw?.formattedAmount ?? amount, 
    raw 
  };
}

const PAY_TIMEOUT_MS = 90_000;

/** Pay for an x402-compatible resource. Handles the 402 negotiation + retry. */
export async function payX402(
  config: CircleAgentConfig,
  url: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<NanopaymentResult> {
  const client = await makeGatewayClient(config);
  try {
    const raw: any = await Promise.race([
      client.pay(url, options),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Nanopayment timed out after ${PAY_TIMEOUT_MS / 1000}s`)),
          PAY_TIMEOUT_MS
        )
      ),
    ]);
    const payer = client.address;
    const gatewayTransferId =
      typeof raw?.transaction === "string" && isCircleUuid(raw.transaction)
        ? raw.transaction
        : undefined;
    return {
      url,
      paid: true,
      data: sanitizeBigInts(raw?.data ?? raw?.body ?? raw),
      amount: raw?.amount != null ? String(raw.amount) : undefined,
      formattedAmount: raw?.formattedAmount,
      transaction: gatewayTransferId,
      payer,      explorerUrl: explorerAddressUrl(config.x402Chain ?? "arcTestnet", payer),
      status: raw?.status,
    };
  } catch (error: any) {
    const msg = formatPaymentError(error);
    if (msg.includes("timed out")) {
      throw err(
        "UPSTREAM",
        `Nanopayment to ${url} timed out. The paywall must be running at http://localhost:4021/risk-profile.`
      );
    }
    if (msg.includes("status 404")) {
      throw err(
        "UPSTREAM",
        `Nanopayment to ${url} returned 404. The endpoint must exist and respond with HTTP 402 Payment Required. ` +
          `Use the local paywall at http://localhost:${process.env.X402_PAYWALL_PORT ?? "4021"}/risk-profile ` +
          `(or set X402_PAYWALL_URL). Ensure the paywall server is running: bun run x402:server`
      );
    }
    if (msg.includes("Invalid transfer ID") || msg.includes("params.id")) {
      throw err(
        "UPSTREAM",
        "Gateway payment failed: invalid transfer ID. " +
          "Stop any stale paywall on port 4021 (only one server should run), " +
          "verify SERVER_ADDRESS matches SERVER_PRIVATE_KEY (bun run setup:x402), " +
          "fund Gateway (bun run x402:deposit -- 1), then retry."
      );
    }
    throw error;
  }
}

function formatPaymentError(error: unknown): string {
  if (error instanceof Error) {
    const m = error.message;
    try {
      const parsed = JSON.parse(m) as { message?: string; error?: string };
      return parsed.message ?? parsed.error ?? m;
    } catch {
      /* not JSON */
    }
    if (m.includes("{") && m.includes("message")) {
      const match = m.match(/"message"\s*:\s*"([^"]+)"/);
      if (match?.[1]) return match[1];
    }
    return m;
  }
  return String(error);
}

/** Recursively convert BigInt values to strings so results are JSON-safe. */
function sanitizeBigInts(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(sanitizeBigInts);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeBigInts(v),
      ])
    );
  }
  return value;
}

export async function gatewayBalance(
  config: CircleAgentConfig,
  address?: string
): Promise<GatewayBalance> {
  const client = await makeGatewayClient(config);
  const raw: any = await client.getBalances(address);
  // Handle the balance structure from @circle-fin/x402-batching
  const available = raw?.gateway?.formattedAvailable ?? "0";
  return { 
    chain: config.x402Chain ?? "arcTestnet", 
    available: String(available), 
    raw 
  };
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
  const mod = await loadX402("server");
  const factory =
    mod.createGatewayMiddleware ??
    mod.server?.createGatewayMiddleware ??
    mod.default?.createGatewayMiddleware;
  if (!factory) {
    throw err(
      "DEPENDENCY_MISSING",
      "createGatewayMiddleware not found in @circle-fin/x402-batching/server."
    );
  }
  return factory({
    sellerAddress: params.sellerAddress,
    facilitatorUrl: "https://gateway-api-testnet.circle.com",
    networks: ["eip155:5042002"], // Arc Testnet only
  });
}
