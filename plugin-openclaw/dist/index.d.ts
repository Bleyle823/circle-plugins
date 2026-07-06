/**
 * OpenClaw plugin for Circle + Arc agent wallets.
 *
 * Registers agent-callable tools that wrap @circle-plugins/core. Money-moving
 * tools (send, deposit, x402 pay) are marked `optional` so they require explicit
 * user opt-in per OpenClaw's tool-permission model.
 *
 * The generated `openclaw.plugin.json` (see repo) declares `contracts.tools`
 * so OpenClaw can discover ownership without loading this runtime.
 */
declare const _default: import("openclaw/plugin-sdk").PluginEntryConfig;
export default _default;
export { circleTools } from "./tools.js";
//# sourceMappingURL=index.d.ts.map