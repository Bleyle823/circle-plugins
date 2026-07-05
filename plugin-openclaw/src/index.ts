import { definePluginEntry } from "openclaw/plugin-sdk";
import { circleTools, runTool } from "./tools.js";

/**
 * OpenClaw plugin for Circle + Arc agent wallets.
 *
 * Registers agent-callable tools that wrap @circle-agent-kit/core. Money-moving
 * tools (send, deposit, x402 pay) are marked `optional` so they require explicit
 * user opt-in per OpenClaw's tool-permission model.
 *
 * The generated `openclaw.plugin.json` (see repo) declares `contracts.tools`
 * so OpenClaw can discover ownership without loading this runtime.
 */
export default definePluginEntry({
  id: "circle-agent-kit",
  name: "Circle Agent Kit",
  description:
    "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, and payment requests.",
  register: (api) => {
    for (const tool of circleTools) {
      api.registerTool({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
        optional: tool.optional,
        handler: (params) => runTool(tool, params),
      });
    }
  },
});

export { circleTools } from "./tools.js";
