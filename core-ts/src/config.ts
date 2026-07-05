import { DEFAULT_CHAIN } from "./chains.js";
import { err } from "./errors.js";

export type Network = "TESTNET" | "MAINNET";

export interface CircleAgentConfig {
  /** Circle API key (format: PREFIX:ID:SECRET). */
  apiKey: string;
  /** 32-byte hex entity secret (registered by the developer, consumed here). */
  entitySecret: string;
  /** Target network. Defaults to TESTNET. */
  network: Network;
  /** Default chain id (see chains.ts). */
  defaultChain: string;
  /** Optional existing wallet set to reuse. */
  walletSetId?: string;
  /** USDC amount above which transfers require explicit confirmation. */
  confirmThresholdUsdc: number;
  /** x402 buyer private key for gasless nanopayment signatures. */
  x402PrivateKey?: string;
  /** x402 chain (as understood by @circle-fin/x402-batching, e.g. "base-sepolia"). */
  x402Chain?: string;
  /** Circle CLI binary for Agent Stack ops (Agent Wallets). Defaults to "circle". */
  cliBin?: string;
  /** DEX aggregator base URL for SDK-native swaps (0x-compatible schema). */
  swapApiUrl?: string;
  /** DEX aggregator API key (e.g. 0x). */
  swapApiKey?: string;
  /** Circle App Kit key (from Circle Console) for SDK-native swaps. */
  kitKey?: string;
}

const asNumber = (v: string | undefined, fallback: number): number => {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Build config from an explicit object merged over environment variables.
 * Explicit values always win; env fills the gaps.
 */
export function resolveConfig(
  overrides: Partial<CircleAgentConfig> = {},
  env: Record<string, string | undefined> = process.env
): CircleAgentConfig {
  const network = (overrides.network ??
    (env.CIRCLE_NETWORK as Network | undefined) ??
    "TESTNET") as Network;

  const config: CircleAgentConfig = {
    apiKey: overrides.apiKey ?? env.CIRCLE_API_KEY ?? "",
    entitySecret:
      overrides.entitySecret ??
      env.ENTITY_SECRET ??
      env.CIRCLE_ENTITY_SECRET ??
      "",
    network,
    defaultChain:
      overrides.defaultChain ?? env.CIRCLE_DEFAULT_CHAIN ?? DEFAULT_CHAIN,
    walletSetId: overrides.walletSetId ?? env.CIRCLE_WALLET_SET_ID ?? undefined,
    confirmThresholdUsdc:
      overrides.confirmThresholdUsdc ??
      asNumber(env.CIRCLE_CONFIRM_THRESHOLD_USDC, 100),
    x402PrivateKey: overrides.x402PrivateKey ?? env.X402_PRIVATE_KEY ?? undefined,
    x402Chain: overrides.x402Chain ?? env.X402_CHAIN ?? undefined,
    cliBin: overrides.cliBin ?? env.CIRCLE_CLI_BIN ?? undefined,
    swapApiUrl: overrides.swapApiUrl ?? env.SWAP_API_URL ?? undefined,
    swapApiKey: overrides.swapApiKey ?? env.SWAP_API_KEY ?? undefined,
    kitKey: overrides.kitKey ?? env.CIRCLE_KIT_KEY ?? env.KIT_KEY ?? undefined,
  };

  if (!config.apiKey) {
    throw err(
      "CONFIG_MISSING",
      "CIRCLE_API_KEY is required. Set it in the environment or pass apiKey."
    );
  }
  if (!config.entitySecret) {
    throw err(
      "CONFIG_MISSING",
      "ENTITY_SECRET (or CIRCLE_ENTITY_SECRET) is required. Generate and register it: " +
        "bun run register:entity-secret (in the circle Eliza workspace) or " +
        "https://developers.circle.com/wallets/dev-controlled/register-entity-secret"
    );
  }
  return config;
}
