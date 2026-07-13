import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from "@elizaos/core";
import { addHeader } from "@elizaos/core";
import { defaultPaywallUrl } from "./params.js";
import { envSetting } from "./env.js";

/**
 * Injects Circle wallet and nanopayment context (config only — no blocking API calls).
 */
export const circleWalletProvider: Provider = {
  name: "CIRCLE_WALLET",
  description: "Circle agent wallet, USDC balance, and nanopayment (Gateway) status.",
  position: 50,
  get: async (runtime: IAgentRuntime, _message: Memory, _state: State): Promise<ProviderResult> => {
    const lines: string[] = [];
    const walletId = envSetting(runtime, "CIRCLE_WALLET_ID");
    const network = envSetting(runtime, "CIRCLE_NETWORK") ?? "TESTNET";
    const defaultChain = envSetting(runtime, "CIRCLE_DEFAULT_CHAIN") ?? "ARC-TESTNET";
    const hasX402 = Boolean(
      envSetting(runtime, "X402_PRIVATE_KEY") ?? envSetting(runtime, "CLIENT_PRIVATE_KEY")
    );
    const paywallUrl =
      envSetting(runtime, "X402_PAYWALL_URL") ?? defaultPaywallUrl();

    lines.push(`Network: ${network}`, `Default chain: ${defaultChain}`);

    if (hasX402) {
      lines.push("Nanopayments: configured");
      lines.push(`Paywall: ${paywallUrl} ($0.01 USDC)`);
    }

    if (walletId) {
      lines.push(`Agent wallet ID: ${walletId}`);
    } else {
      lines.push("Agent wallet: not set — use CIRCLE_CREATE_WALLET");
    }

    lines.push(
      "",
      "When the user asks for live data, run the matching action (then REPLY with the result):",
      '- Gateway balance → CIRCLE_GATEWAY_BALANCE',
      '- Wallet USDC balance → CIRCLE_CHECK_BALANCE',
      '- Pay x402 paywall / risk profile → CIRCLE_PAY_X402',
      '- Deposit to Gateway → CIRCLE_GATEWAY_DEPOSIT',
      '- Send USDC → CIRCLE_SEND_USDC',
      '- Testnet faucet → CIRCLE_REQUEST_FAUCET',
      "",
      "For greetings and general chat, use REPLY only (no Circle action)."
    );

    const values: Record<string, unknown> = {
      circleChain: defaultChain,
      ...(walletId ? { circleWalletId: walletId } : {}),
    };

    const text = addHeader("# Circle Wallet & Nanopayments", lines.join("\n"));
    return {
      text,
      values,
      data: { walletId, chain: defaultChain, network, paywallUrl, hasX402 },
    };
  },
};
