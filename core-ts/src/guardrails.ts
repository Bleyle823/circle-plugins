import type { CircleAgentConfig } from "./config.js";
import { getChain } from "./chains.js";
import { err } from "./errors.js";

/** A single place that enforces the Circle skill security rules. */
export interface GuardContext {
  /** Explicit user confirmation was provided for this action. */
  confirm?: boolean;
}

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function assertValidAddress(address: string, chainId: string): void {
  const chain = getChain(chainId);
  // Non-EVM chains (Solana etc.) use different formats; only validate EVM here.
  if (chain.chainId != null && !EVM_ADDRESS.test(address)) {
    throw err("VALIDATION", `Invalid EVM address: "${address}".`);
  }
  if (!address || address.length < 20) {
    throw err("VALIDATION", `Invalid destination address: "${address}".`);
  }
}

export function assertPositiveAmount(amount: string | number): number {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    throw err("VALIDATION", `Amount must be a positive number, got "${amount}".`);
  }
  return n;
}

/**
 * Enforce mainnet + high-value confirmation guardrails before a money-moving
 * action. Throws CONFIRMATION_REQUIRED / MAINNET_BLOCKED when confirmation is
 * missing.
 */
export function assertConfirmed(
  config: CircleAgentConfig,
  action: string,
  amountUsdc: number | undefined,
  ctx: GuardContext
): void {
  const isMainnet = config.network === "MAINNET";
  const overThreshold =
    amountUsdc != null && amountUsdc > config.confirmThresholdUsdc;

  if ((isMainnet || overThreshold) && !ctx.confirm) {
    const reason = isMainnet
      ? `on MAINNET`
      : `above the ${config.confirmThresholdUsdc} USDC confirmation threshold`;
    throw err(
      isMainnet ? "MAINNET_BLOCKED" : "CONFIRMATION_REQUIRED",
      `"${action}" ${reason} requires explicit confirmation. ` +
        `Re-run with confirm: true after verifying destination, amount, network, and token.`
    );
  }
}
