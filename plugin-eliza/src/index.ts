import { logger, type Plugin } from "@elizaos/core";
import { CircleService } from "./service.js";
import { allActions } from "./actions.js";
import { circleWalletProvider } from "./provider.js";

/**
 * ElizaOS plugin for Circle + Arc agent wallets.
 *
 * All Circle logic lives in `@circle-agent-kit/core`; this package only adapts
 * that kit into ElizaOS Actions/Provider/Service so the same implementation is
 * shared with the OpenClaw plugin (and mirrored by the Hermes Python core).
 *
 * Register in your character config:
 *   plugins: ["@circle-agent-kit/plugin-eliza"]
 * and set CIRCLE_API_KEY + ENTITY_SECRET (and X402_PRIVATE_KEY for nanopayments).
 */
export const circlePlugin: Plugin = {
  name: "circle-agent-kit",
  description:
    "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, and payment requests.",
  services: [CircleService],
  actions: allActions,
  evaluators: [],
  providers: [circleWalletProvider],
  init: async () => {
    const missing = ["CIRCLE_API_KEY", "ENTITY_SECRET"].filter((k) => !process.env[k]);
    const hasX402 = Boolean(process.env.X402_PRIVATE_KEY?.trim());
    logger.info(
      {
        actionCount: allActions.length,
        network: process.env.CIRCLE_NETWORK ?? "TESTNET",
        defaultChain: process.env.CIRCLE_DEFAULT_CHAIN ?? "ARC-TESTNET",
        configured: missing.length === 0,
        nanopayments: hasX402,
      },
      "[plugin-eliza] circle-agent-kit initialized"
    );
    if (missing.length) {
      logger.warn(
        `[plugin-eliza] Missing env: ${missing.join(", ")}. Wallet actions will fail until these are set.`
      );
    }
  },
};

export default circlePlugin;
export { CircleService, getKit } from "./service.js";
export { makeAction, type CircleActionSpec } from "./shared.js";
export * from "./actions.js";
export { circleWalletProvider } from "./provider.js";
