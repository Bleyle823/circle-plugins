import { logger, type Plugin } from "@elizaos/core";
import { CircleAgentKit } from "@circle-plugins/core";
import { CircleService } from "./service.js";
import { allActions } from "./actions.js";
import { circleWalletProvider } from "./provider.js";
import { startPaywalledServer } from "./server.js";

/**
 * ElizaOS plugin for Circle + Arc agent wallets.
 *
 * All Circle logic lives in `@circle-plugins/core`; this package only adapts
 * that kit into ElizaOS Actions/Provider/Service so the same implementation is
 * shared with the OpenClaw plugin (and mirrored by the Hermes Python core).
 *
 * Register in your character config:
 *   plugins: ["@circle-plugins/plugin-eliza"]
 * and set CIRCLE_API_KEY + ENTITY_SECRET (and X402_PRIVATE_KEY for nanopayments).
 */
export const circlePlugin: Plugin = {
  name: "circle-plugins",
  description:
    "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, and payment requests.",
  services: [CircleService],
  actions: allActions,
  evaluators: [],
  providers: [circleWalletProvider],
  init: async () => {
    const missing = ["CIRCLE_API_KEY"].filter((k) => !process.env[k]);
    const hasSecret = Boolean(
      process.env.ENTITY_SECRET?.trim() || process.env.CIRCLE_ENTITY_SECRET?.trim()
    );
    if (!hasSecret) missing.push("ENTITY_SECRET");
    const hasX402 = Boolean(process.env.X402_PRIVATE_KEY?.trim() || process.env.CLIENT_PRIVATE_KEY?.trim());
    logger.info(
      {
        actionCount: allActions.length,
        network: process.env.CIRCLE_NETWORK ?? "TESTNET",
        defaultChain: process.env.CIRCLE_DEFAULT_CHAIN ?? "ARC-TESTNET",
        configured: missing.length === 0 && hasX402,
        nanopayments: hasX402,
      },
      "[plugin-circle] circle-plugins initialized"
    );
    if (missing.length) {
      logger.warn(
        `[plugin-circle] Missing env: ${missing.join(", ")}. Wallet actions will fail until these are set.`
      );
    }
    if (!hasX402) {
      logger.warn(
        `[plugin-circle] Missing X402_PRIVATE_KEY / CLIENT_PRIVATE_KEY. Nanopayments will fail.`
      );
    }

    const sellerAddress = process.env.SERVER_ADDRESS?.trim();
    const serverKey = process.env.SERVER_PRIVATE_KEY?.trim();
    if (sellerAddress && serverKey) {
      try {
        const { privateKeyToAccount } = await import("viem/accounts");
        const derived = privateKeyToAccount(serverKey as `0x${string}`).address;
        if (derived.toLowerCase() !== sellerAddress.toLowerCase()) {
          logger.error(
            `[plugin-circle] SERVER_ADDRESS (${sellerAddress}) does not match SERVER_PRIVATE_KEY (${derived}). ` +
              "Run: bun run setup:x402"
          );
        }
      } catch {
        /* viem optional at init */
      }
    }

    const autoStart = process.env.AUTO_START_X402_SERVER !== "false";
    if (sellerAddress && autoStart) {
      const port = Number(process.env.X402_PAYWALL_PORT ?? 4021);
      const kit = CircleAgentKit.create({
        apiKey: process.env.CIRCLE_API_KEY ?? "dummy",
        entitySecret:
          process.env.ENTITY_SECRET ?? process.env.CIRCLE_ENTITY_SECRET ?? "dummy",
        x402PrivateKey:
          process.env.X402_PRIVATE_KEY ?? process.env.CLIENT_PRIVATE_KEY,
        x402Chain: process.env.X402_CHAIN ?? "arcTestnet",
        sellerAddress,
      });
      await startPaywalledServer(kit, port);
    } else if (!sellerAddress) {
      logger.warn(
        "[plugin-circle] SERVER_ADDRESS not set — x402 paywall server not started. " +
          "Set SERVER_ADDRESS or run: bun run x402:server"
      );
    }
  },
};

export default circlePlugin;
export { CircleService, getKit } from "./service.js";
export { CircleAgentKit } from "@circle-plugins/core";
export { makeAction, type CircleActionSpec } from "./shared.js";
export * from "./actions.js";
export { circleWalletProvider } from "./provider.js";
