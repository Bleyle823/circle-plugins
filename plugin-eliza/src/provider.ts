import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from "@elizaos/core";
import { addHeader } from "@elizaos/core";
import { getKit } from "./service.js";

/**
 * Injects Circle wallet context into agent state so it can reason about funds and
 * pick the right action. Uses CIRCLE_WALLET_ID (setting/env) as the active wallet.
 */
export const circleWalletProvider: Provider = {
  name: "CIRCLE_WALLET",
  description: "Configured Circle agent wallet, network, USDC balance, and available actions.",
  position: 50,
  get: async (runtime: IAgentRuntime, _message: Memory, _state: State): Promise<ProviderResult> => {
    const lines: string[] = [];
    let values: Record<string, unknown> = {};
    let data: Record<string, unknown> = {};

    try {
      const kit = getKit(runtime);
      const chain = kit.getChain();
      const walletId =
        (runtime.getSetting?.("CIRCLE_WALLET_ID") as string | undefined) ??
        process.env.CIRCLE_WALLET_ID;

      lines.push(`Network: ${kit.config.network}`, `Default chain: ${chain.name} (${chain.id})`);

      if (walletId) {
        const [address, usdc] = await Promise.all([
          kit.getAddress(walletId).catch(() => undefined),
          kit.getUsdcBalance(walletId).catch(() => "0"),
        ]);
        lines.push(
          `Agent wallet: ${walletId}${address ? ` (${address})` : ""}`,
          `USDC balance: ${usdc}`
        );
        values = { circleChain: chain.id, circleWalletId: walletId, circleUsdc: usdc };
        data = { walletId, address, usdc, chain: chain.id, network: kit.config.network };
      } else {
        lines.push("Agent wallet: not created yet — use CIRCLE_CREATE_WALLET.");
        values = { circleChain: chain.id };
        data = { chain: chain.id, network: kit.config.network };
      }

      const faucet = kit.faucetInfo();
      if (faucet.faucetUrl) lines.push(`Faucet (testnet): ${faucet.faucetUrl}`);

      lines.push(
        "",
        "Route chat requests to actions:",
        '- "balance" / "how much USDC" -> CIRCLE_CHECK_BALANCE',
        '- "send X USDC to 0x..." -> CIRCLE_SEND_USDC (confirm recipient + amount first)',
        '- "request/invoice X USDC" -> CIRCLE_REQUEST_USDC',
        '- "pay <url>" / nanopayment -> CIRCLE_PAY_X402',
        '- "deposit into gateway" -> CIRCLE_GATEWAY_DEPOSIT (needs confirm: true)',
        '- "gateway balance" -> CIRCLE_GATEWAY_BALANCE',
        "Mainnet and large transfers require confirm: true. Never ask the user for API keys or the entity secret."
      );
    } catch (e) {
      lines.push(
        `Circle wallet unavailable: ${e instanceof Error ? e.message : String(e)}`,
        "Set CIRCLE_API_KEY and ENTITY_SECRET to enable wallet actions."
      );
    }

    const text = addHeader("# Circle Wallet", lines.join("\n"));
    return { text, values, data };
  },
};
