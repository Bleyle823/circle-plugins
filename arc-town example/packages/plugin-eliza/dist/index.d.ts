import { type Plugin } from "@elizaos/core";
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
export declare const circlePlugin: Plugin;
export default circlePlugin;
export { CircleService, getKit } from "./service.js";
export { CircleAgentKit } from "@circle-plugins/core";
export { makeAction, type CircleActionSpec } from "./shared.js";
export * from "./actions.js";
export { circleWalletProvider } from "./provider.js";
//# sourceMappingURL=index.d.ts.map