import { DEFAULT_CHAIN } from "./chains.js";
import { err } from "./errors.js";
const asNumber = (v, fallback) => {
    if (v == null || v === "")
        return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};
/**
 * Build config from an explicit object merged over environment variables.
 * Explicit values always win; env fills the gaps.
 */
export function resolveConfig(overrides = {}, env = process.env) {
    const network = (overrides.network ??
        env.CIRCLE_NETWORK ??
        "TESTNET");
    const config = {
        apiKey: overrides.apiKey ?? env.CIRCLE_API_KEY ?? "",
        entitySecret: overrides.entitySecret ??
            env.ENTITY_SECRET ??
            env.CIRCLE_ENTITY_SECRET ??
            "",
        network,
        defaultChain: overrides.defaultChain ?? env.CIRCLE_DEFAULT_CHAIN ?? DEFAULT_CHAIN,
        walletSetId: overrides.walletSetId ?? env.CIRCLE_WALLET_SET_ID ?? undefined,
        confirmThresholdUsdc: overrides.confirmThresholdUsdc ??
            asNumber(env.CIRCLE_CONFIRM_THRESHOLD_USDC, 100),
        x402PrivateKey: overrides.x402PrivateKey ?? env.X402_PRIVATE_KEY ?? env.CLIENT_PRIVATE_KEY ?? undefined,
        x402Chain: overrides.x402Chain ?? env.X402_CHAIN ?? undefined,
        sellerAddress: overrides.sellerAddress ?? env.SERVER_ADDRESS ?? undefined,
        cliBin: overrides.cliBin ?? env.CIRCLE_CLI_BIN ?? undefined,
        swapApiUrl: overrides.swapApiUrl ?? env.SWAP_API_URL ?? undefined,
        swapApiKey: overrides.swapApiKey ?? env.SWAP_API_KEY ?? undefined,
        kitKey: overrides.kitKey ?? env.CIRCLE_KIT_KEY ?? env.KIT_KEY ?? undefined,
    };
    // Only require API key and entity secret if not in nanopayment-only mode
    const hasX402 = Boolean(config.x402PrivateKey);
    const needsFullConfig = !hasX402 || config.apiKey !== "dummy";
    if (needsFullConfig) {
        if (!config.apiKey || config.apiKey === "dummy") {
            throw err("CONFIG_MISSING", "CIRCLE_API_KEY is required. Set it in the environment or pass apiKey.");
        }
        if (!config.entitySecret || config.entitySecret === "dummy") {
            throw err("CONFIG_MISSING", "ENTITY_SECRET (or CIRCLE_ENTITY_SECRET) is required. Generate and register it: " +
                "bun run register:entity-secret (in the circle Eliza workspace) or " +
                "https://developers.circle.com/wallets/dev-controlled/register-entity-secret");
        }
    }
    return config;
}
//# sourceMappingURL=config.js.map