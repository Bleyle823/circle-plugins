import { getChain } from "./chains.js";
import { err } from "./errors.js";
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
export function assertValidAddress(address, chainId) {
    const chain = getChain(chainId);
    // Non-EVM chains (Solana etc.) use different formats; only validate EVM here.
    if (chain.chainId != null && !EVM_ADDRESS.test(address)) {
        throw err("VALIDATION", `Invalid EVM address: "${address}".`);
    }
    if (!address || address.length < 20) {
        throw err("VALIDATION", `Invalid destination address: "${address}".`);
    }
}
export function assertPositiveAmount(amount) {
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
export function assertConfirmed(config, action, amountUsdc, ctx) {
    const isMainnet = config.network === "MAINNET";
    const overThreshold = amountUsdc != null && amountUsdc > config.confirmThresholdUsdc;
    if ((isMainnet || overThreshold) && !ctx.confirm) {
        const reason = isMainnet
            ? `on MAINNET`
            : `above the ${config.confirmThresholdUsdc} USDC confirmation threshold`;
        throw err(isMainnet ? "MAINNET_BLOCKED" : "CONFIRMATION_REQUIRED", `"${action}" ${reason} requires explicit confirmation. ` +
            `Re-run with confirm: true after verifying destination, amount, network, and token.`);
    }
}
//# sourceMappingURL=guardrails.js.map