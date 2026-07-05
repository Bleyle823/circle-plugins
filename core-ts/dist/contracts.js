import { v4 as uuidv4 } from "uuid";
import { ID_TO_APPKIT_CHAIN } from "./chains.js";
import { err } from "./errors.js";
import { getAddress } from "./wallets.js";
/**
 * SDK-native DeFi capabilities that the Circle CLI Agent Stack exposes but the
 * developer-controlled-wallets SDK doesn't offer as one-liners:
 *
 *  - executeContract: arbitrary contract write (createContractExecutionTransaction)
 *  - bridgeUSDC:      CCTP v2 (approve -> depositForBurn -> attest -> receiveMessage)
 *  - swap:            via a configured DEX aggregator (quote -> approve -> execute)
 *
 * All are built on the same wallet the rest of the kit uses, so no CLI or
 * separate session is required.
 */
const feeConfig = (feeLevel = "MEDIUM") => ({
    type: "level",
    config: { feeLevel },
});
/** Left-pad an EVM address to a 32-byte hex string (CCTP bytes32 encoding). */
export function addressToBytes32(address) {
    const clean = address.replace(/^0x/, "").toLowerCase();
    if (clean.length !== 40)
        throw err("VALIDATION", `Invalid EVM address: "${address}".`);
    return "0x" + "0".repeat(24) + clean;
}
function appKitChain(id) {
    const mapped = ID_TO_APPKIT_CHAIN[id.toUpperCase()];
    if (!mapped)
        throw err("VALIDATION", `Chain "${id}" is not supported by App Kit.`);
    return mapped;
}
/** Execute a write function on a contract from a wallet. */
export async function executeContract(client, params) {
    if (!params.abiFunctionSignature && !params.callData) {
        throw err("VALIDATION", "executeContract needs either abiFunctionSignature or callData.");
    }
    const res = await client.createContractExecutionTransaction({
        walletId: params.walletId,
        contractAddress: params.contractAddress,
        abiFunctionSignature: params.abiFunctionSignature,
        abiParameters: params.abiParameters,
        callData: params.callData,
        amount: params.amount,
        fee: feeConfig(params.feeLevel),
        idempotencyKey: uuidv4(),
    });
    const id = res?.data?.id;
    if (!id)
        throw err("UPSTREAM", "Contract execution returned no transaction id.", res);
    return { id, state: res?.data?.state ?? "INITIATED" };
}
/**
 * Bridge USDC across chains via CCTP v2. Uses the Circle App Kit to handle
 * the complete flow (approve -> burn -> attest -> mint).
 */
export async function bridgeUSDC(client, _config, params) {
    const sourceAddress = await getAddress(client, params.sourceWalletId);
    const destAddress = params.mintRecipient ?? (await getAddress(client, params.destWalletId));
    const result = await client.appKit.bridge({
        from: {
            adapter: client.adapter,
            chain: appKitChain(params.fromChain),
            address: sourceAddress,
        },
        to: {
            adapter: client.adapter,
            chain: appKitChain(params.toChain),
            address: destAddress,
        },
        amount: params.amount,
    });
    const burnStep = result.steps.find((s) => s.name.toLowerCase() === "burn");
    const mintStep = result.steps.find((s) => s.name.toLowerCase() === "mint");
    return {
        fromChain: params.fromChain,
        toChain: params.toChain,
        amount: params.amount,
        burnTxId: burnStep?.txHash ?? "pending",
        burnTxHash: burnStep?.txHash,
        mintTxId: mintStep?.txHash,
        mintTxHash: mintStep?.txHash,
        state: result.state === "success" ? "COMPLETE" : "BURNED",
    };
}
/**
 * Fetch a swap quote from the Circle App Kit.
 */
export async function getSwapQuote(client, config, params) {
    const estimate = await client.appKit.estimateSwap({
        from: {
            adapter: client.adapter,
            chain: appKitChain(params.chain),
            address: params.takerAddress,
        },
        tokenIn: params.sellToken,
        tokenOut: params.buyToken,
        amountIn: params.sellAmount,
        config: {
            kitKey: config.kitKey,
            slippageBps: params.slippageBps,
        },
    });
    return {
        sellToken: params.sellToken,
        buyToken: params.buyToken,
        sellAmount: params.sellAmount,
        buyAmount: estimate.estimatedOutput.amount,
        allowanceTarget: "", // App Kit handles approval internally
        to: "",
        data: "",
    };
}
/**
 * Execute a token swap from a wallet using the Circle App Kit.
 */
export async function swap(client, config, params) {
    const result = await client.appKit.swap({
        from: {
            adapter: client.adapter,
            chain: appKitChain(params.chain),
            address: params.walletAddress,
        },
        tokenIn: params.sellToken,
        tokenOut: params.buyToken,
        amountIn: params.sellAmount,
        config: {
            kitKey: config.kitKey,
            slippageBps: params.slippageBps,
        },
    });
    return {
        quote: {
            sellToken: params.sellToken,
            buyToken: params.buyToken,
            sellAmount: params.sellAmount,
            buyAmount: result.amountOut,
        },
        swapTxId: result.txHash,
    };
}
//# sourceMappingURL=contracts.js.map