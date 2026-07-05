import { v4 as uuidv4 } from "uuid";
import { getChain } from "./chains.js";
import { assertPositiveAmount, assertValidAddress } from "./guardrails.js";
import { err } from "./errors.js";
/**
 * Create a USDC payment request ("please pay me") for a given amount, chain,
 * and destination address. Produces an EIP-681 payment URI that wallets/QR
 * scanners can consume, plus a stable id for reconciliation.
 *
 * This is offchain metadata generation — no funds move until someone pays it.
 */
export function createPaymentRequest(params) {
    assertPositiveAmount(params.amount);
    assertValidAddress(params.destinationAddress, params.chain);
    const chain = getChain(params.chain);
    const tokenAddress = params.tokenAddress ?? chain.usdcAddress;
    const decimals = chain.usdcDecimals;
    // Convert human USDC amount to base units for the EIP-681 uint256 value.
    const baseUnits = toBaseUnits(params.amount, decimals);
    // EIP-681: ERC-20 transfer request.
    // ethereum:<token>@<chainId>/transfer?address=<to>&uint256=<amount>
    const uri = tokenAddress && chain.chainId != null
        ? `ethereum:${tokenAddress}@${chain.chainId}/transfer?address=${params.destinationAddress}&uint256=${baseUnits}`
        : `usdc:${params.destinationAddress}?amount=${params.amount}&chain=${chain.id}`;
    return {
        id: uuidv4(),
        amount: params.amount,
        chain: chain.id,
        destinationAddress: params.destinationAddress,
        tokenAddress,
        memo: params.memo,
        uri,
        qrData: uri,
        createdAt: new Date().toISOString(),
    };
}
/** Testnet faucet guidance for topping up an agent wallet with USDC. */
export function faucetInfo(chain) {
    const info = getChain(chain);
    return {
        chain: info.id,
        testnet: info.testnet,
        faucetUrl: info.testnet ? "https://faucet.circle.com" : undefined,
        note: info.testnet
            ? `Request testnet USDC for ${info.name} at https://faucet.circle.com, then paste your wallet address.`
            : `${info.name} is a mainnet chain — fund it from a real USDC source; no faucet available.`,
    };
}
const FAUCET_URL = "https://api.circle.com/v1/faucet/drips";
/**
 * Request free testnet tokens from Circle's faucet (`POST /v1/faucet/drips`)
 * for a wallet address. Testnet only — mainnet chains have no faucet.
 *
 * Defaults: USDC is always requested; native gas is requested too unless the
 * chain's native gas token IS USDC (e.g. Arc), in which case USDC alone covers it.
 */
export async function requestFaucet(params) {
    const info = getChain(params.chain);
    if (!info.testnet) {
        throw err("MAINNET_BLOCKED", `${info.name} is a mainnet chain — the Circle faucet only dispenses testnet tokens. ` +
            `Fund it from a real USDC source instead.`);
    }
    assertValidAddress(params.address, params.chain);
    const wantsNative = params.native ?? !info.usdcIsGas;
    const wantsUsdc = params.usdc ?? true;
    const wantsEurc = params.eurc ?? false;
    let res;
    try {
        res = await fetch(FAUCET_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${params.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                address: params.address,
                blockchain: info.id,
                native: wantsNative,
                usdc: wantsUsdc,
                eurc: wantsEurc,
            }),
        });
    }
    catch (e) {
        throw err("UPSTREAM", "Failed to reach the Circle faucet API.", e);
    }
    if (!res.ok) {
        if (res.status === 403) {
            throw err("UPSTREAM", `Circle rejected the faucet API request (403 Forbidden) for this account. ` +
                `The /v1/faucet/drips API requires an account with faucet access enabled ` +
                `(some sandbox/test accounts don't have it). ` +
                `Request testnet tokens manually at https://faucet.circle.com for ${params.address} instead.`);
        }
        let message = `Faucet request failed with status ${res.status}.`;
        try {
            const body = (await res.json());
            if (body?.message)
                message = `Faucet request failed: ${body.message}`;
        }
        catch {
            // Response body wasn't JSON (or was empty) — keep the status-based message.
        }
        throw err("UPSTREAM", message);
    }
    const requestedList = [
        wantsNative && "native gas",
        wantsUsdc && "USDC",
        wantsEurc && "EURC",
    ].filter(Boolean);
    return {
        chain: info.id,
        address: params.address,
        requested: { native: wantsNative, usdc: wantsUsdc, eurc: wantsEurc },
        note: `Requested ${requestedList.join(" + ")} from the Circle faucet for ${params.address} ` +
            `on ${info.name}. Funds usually arrive within a minute — check the balance shortly.`,
    };
}
/** Convert a decimal string amount to integer base units without float error. */
export function toBaseUnits(amount, decimals) {
    const [whole, frac = ""] = String(amount).split(".");
    const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
    const combined = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
    return combined === "" ? "0" : combined;
}
//# sourceMappingURL=requests.js.map