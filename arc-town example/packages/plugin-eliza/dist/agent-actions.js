import { convo, makeAction } from "./shared.js";
/**
 * Circle Agent Stack actions — user-custody agent wallets operated via the
 * `circle` CLI: authenticate, fund, transfer, bridge, swap, execute contract.
 * These require the Circle CLI to be installed (`npm i -g @circle-fin/cli`).
 */
function cliText(r) {
    const msg = r.data?.message;
    if (msg)
        return String(msg);
    if (r.data != null)
        return JSON.stringify(r.data);
    return (r.stdout || "").trim() || "Done.";
}
export const agentLoginInitAction = makeAction({
    name: "CIRCLE_AGENT_LOGIN_INIT",
    similes: ["AGENT_LOGIN", "WALLET_LOGIN", "AUTHENTICATE_WALLET", "START_LOGIN"],
    description: "Start Circle Agent Wallet authentication: sends a one-time password (OTP) to an email and returns a request id. " +
        "Complete with CIRCLE_AGENT_LOGIN_COMPLETE. Params: { email: string }.",
    requiredParams: ["email"],
    run: (kit, p) => kit.agentLoginInit(p.email),
    formatResult: (r) => r.requestId
        ? `OTP sent. Request id: ${r.requestId}. Reply with the OTP to finish login (expires in 10 min).`
        : `Login initiated. ${r.raw.trim()}`,
    examples: [
        convo("Log in to my agent wallet as me@example.com", "Sending you a one-time password.", "CIRCLE_AGENT_LOGIN_INIT"),
    ],
});
export const agentLoginCompleteAction = makeAction({
    name: "CIRCLE_AGENT_LOGIN_COMPLETE",
    similes: ["COMPLETE_LOGIN", "VERIFY_OTP", "FINISH_LOGIN", "ENTER_OTP"],
    description: "Complete Circle Agent Wallet authentication with the request id and the OTP from the inbox. " +
        "Creates agent wallets on all supported chains. Params: { requestId: string, otp: string }.",
    requiredParams: ["requestId", "otp"],
    run: (kit, p) => kit.agentLoginComplete(p.requestId, p.otp),
    formatResult: (r) => cliText(r),
    examples: [
        convo("The code is B1X-123456", "Completing your login.", "CIRCLE_AGENT_LOGIN_COMPLETE"),
    ],
});
export const agentListWalletsAction = makeAction({
    name: "CIRCLE_AGENT_LIST_WALLETS",
    similes: ["LIST_AGENT_WALLETS", "MY_AGENT_WALLETS", "AGENT_WALLET_ADDRESS", "WALLET_LIST"],
    description: "List Circle agent wallets and their addresses, optionally filtered by chain. Params: { chain?: string }.",
    run: (kit, p) => kit.agentListWallets(p.chain),
    formatResult: (r) => cliText(r),
    examples: [
        convo("What's my agent wallet address on Base?", "Listing your agent wallets.", "CIRCLE_AGENT_LIST_WALLETS"),
    ],
});
export const agentFundAction = makeAction({
    name: "CIRCLE_AGENT_FUND",
    similes: ["FUND_WALLET", "FUND_AGENT_WALLET", "ADD_FUNDS", "TOP_UP", "DEPOSIT_TO_WALLET"],
    description: "Fund an agent wallet. On testnet this draws USDC from the Circle faucet (omit amount/method). " +
        'On mainnet use method "crypto" (QR/deposit URI) or "fiat" (onramp), and set confirm: true. ' +
        "Params: { address: string, chain?: string, amount?: string|number, method?: \"crypto\"|\"fiat\", token?: string, confirm?: boolean }.",
    requiredParams: ["address"],
    run: (kit, p) => kit.agentFund({
        address: p.address,
        chain: p.chain,
        amount: p.amount != null ? String(p.amount) : undefined,
        method: p.method,
        token: p.token,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Fund my wallet 0x1111111111111111111111111111111111111111 on Arc testnet", "Requesting testnet funds.", "CIRCLE_AGENT_FUND"),
    ],
});
export const agentBalanceAction = makeAction({
    name: "CIRCLE_AGENT_BALANCE",
    similes: ["AGENT_BALANCE", "WALLET_BALANCE_CLI", "CHECK_AGENT_BALANCE"],
    description: "Check the on-chain balance of an agent wallet address. Params: { address: string, chain?: string }.",
    requiredParams: ["address"],
    run: (kit, p) => kit.agentBalance(p.address, p.chain),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Check the balance of 0x1111111111111111111111111111111111111111", "Checking that wallet's balance.", "CIRCLE_AGENT_BALANCE"),
    ],
});
export const agentTransferAction = makeAction({
    name: "CIRCLE_AGENT_TRANSFER",
    similes: ["AGENT_TRANSFER", "SEND_FROM_AGENT_WALLET", "CLI_TRANSFER"],
    description: "Transfer USDC (or --token) from an agent wallet to a recipient via the Circle CLI. " +
        "Mainnet/large transfers require confirm: true. " +
        "Params: { to: string, amount: string|number, address: string, chain?: string, token?: string, confirm?: boolean }.",
    requiredParams: ["to", "amount", "address"],
    run: (kit, p) => kit.agentTransfer({
        to: p.to,
        amount: String(p.amount),
        address: p.address,
        chain: p.chain,
        token: p.token,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Transfer 5 USDC to 0x2222222222222222222222222222222222222222 from my wallet 0x1111111111111111111111111111111111111111", "Sending 5 USDC now.", "CIRCLE_AGENT_TRANSFER"),
    ],
});
export const agentBridgeFeeAction = makeAction({
    name: "CIRCLE_AGENT_BRIDGE_FEE",
    similes: ["BRIDGE_FEE", "CCTP_FEE", "ESTIMATE_BRIDGE"],
    description: "Estimate the CCTP bridge fee to move USDC to another chain. Params: { toChain: string, fromChain?: string }.",
    requiredParams: ["toChain"],
    run: (kit, p) => kit.agentBridgeFee(p.toChain, p.fromChain),
    formatResult: (r) => cliText(r),
    examples: [
        convo("How much to bridge to Arbitrum from Base?", "Estimating the bridge fee.", "CIRCLE_AGENT_BRIDGE_FEE"),
    ],
});
export const agentBridgeAction = makeAction({
    name: "CIRCLE_AGENT_BRIDGE",
    similes: ["BRIDGE_USDC", "CCTP_BRIDGE", "MOVE_USDC_CROSSCHAIN"],
    description: "Bridge USDC across chains via CCTP (burn on source, mint on destination). Requires confirm: true for mainnet/large amounts. " +
        "Params: { toChain: string, amount: string|number, address: string, fromChain?: string, recipient?: string, confirm?: boolean }.",
    requiredParams: ["toChain", "amount", "address"],
    run: (kit, p) => kit.agentBridge({
        toChain: p.toChain,
        amount: String(p.amount),
        address: p.address,
        fromChain: p.fromChain,
        recipient: p.recipient,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Bridge 10 USDC to Arbitrum from my Base wallet 0x1111111111111111111111111111111111111111, confirmed", "Bridging 10 USDC to Arbitrum.", "CIRCLE_AGENT_BRIDGE"),
    ],
});
export const agentBridgeStatusAction = makeAction({
    name: "CIRCLE_AGENT_BRIDGE_STATUS",
    similes: ["BRIDGE_STATUS", "CHECK_BRIDGE", "CCTP_STATUS"],
    description: "Check the status of an in-flight CCTP bridge by its burn transaction hash. Params: { txHash: string, fromChain?: string }.",
    requiredParams: ["txHash"],
    run: (kit, p) => kit.agentBridgeStatus(p.txHash, p.fromChain),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Is my bridge done? tx 0xabc", "Checking the bridge status.", "CIRCLE_AGENT_BRIDGE_STATUS"),
    ],
});
export const agentSwapQuoteAction = makeAction({
    name: "CIRCLE_AGENT_SWAP_QUOTE",
    similes: ["SWAP_QUOTE", "PRICE_QUOTE", "QUOTE_SWAP"],
    description: "Get a token swap price quote (no execution). Params: { sellToken: string, sellAmount: string|number, buyToken: string, chain?: string }.",
    requiredParams: ["sellToken", "sellAmount", "buyToken"],
    run: (kit, p) => kit.agentSwapQuote({
        sellToken: p.sellToken,
        sellAmount: String(p.sellAmount),
        buyToken: p.buyToken,
        chain: p.chain,
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Quote 10 EURC to USDC", "Getting a swap quote.", "CIRCLE_AGENT_SWAP_QUOTE"),
    ],
});
export const agentSwapAction = makeAction({
    name: "CIRCLE_AGENT_SWAP",
    similes: ["SWAP_TOKENS", "EXECUTE_SWAP", "TRADE_TOKENS"],
    description: "Swap one token for another from an agent wallet with a buyMin stop-limit. Mainnet/large swaps require confirm: true. " +
        "Params: { sellToken: string, sellAmount: string|number, buyToken: string, buyMin: string|number, address: string, chain?: string, slippageBps?: number, confirm?: boolean }.",
    requiredParams: ["sellToken", "sellAmount", "buyToken", "buyMin", "address"],
    run: (kit, p) => kit.agentSwap({
        sellToken: p.sellToken,
        sellAmount: String(p.sellAmount),
        buyToken: p.buyToken,
        buyMin: String(p.buyMin),
        address: p.address,
        chain: p.chain,
        slippageBps: p.slippageBps != null ? Number(p.slippageBps) : undefined,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Swap 10 EURC to at least 9.9 USDC from 0x1111111111111111111111111111111111111111, confirmed", "Executing the swap.", "CIRCLE_AGENT_SWAP"),
    ],
});
export const agentContractAddressAction = makeAction({
    name: "CIRCLE_AGENT_CONTRACT_ADDRESS",
    similes: ["CONTRACT_ADDRESS", "FIND_CONTRACT", "USDC_ADDRESS", "CCTP_ADDRESS"],
    description: "Look up a Circle contract address (usdc, cctp, gateway, ...) for a chain. Params: { name: string, chain?: string }.",
    requiredParams: ["name"],
    run: (kit, p) => kit.agentContractAddress(p.name, p.chain),
    formatResult: (r) => cliText(r),
    examples: [
        convo("What's the USDC contract address on Base?", "Looking that up.", "CIRCLE_AGENT_CONTRACT_ADDRESS"),
    ],
});
export const agentExecuteContractAction = makeAction({
    name: "CIRCLE_AGENT_EXECUTE_CONTRACT",
    similes: ["EXECUTE_CONTRACT", "CALL_CONTRACT", "CONTRACT_WRITE", "APPROVE_TOKEN"],
    description: "Execute a write function on a smart contract from an agent wallet. Always requires confirm: true. " +
        "Params: { signature: string (e.g. \"approve(address,uint256)\"), params: (string|number)[], contract: string, address: string, chain?: string, amount?: string, confirm: boolean }.",
    requiredParams: ["signature", "params", "contract", "address"],
    run: (kit, p) => kit.agentExecuteContract({
        signature: p.signature,
        params: p.params ?? [],
        contract: p.contract,
        address: p.address,
        chain: p.chain,
        amount: p.amount != null ? String(p.amount) : undefined,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => cliText(r),
    examples: [
        convo("Approve 1 USDC allowance for 0xSpender on the USDC contract, confirmed", "Executing the approve call.", "CIRCLE_AGENT_EXECUTE_CONTRACT"),
    ],
});
export const agentStackActions = [
    agentLoginInitAction,
    agentLoginCompleteAction,
    agentListWalletsAction,
    agentFundAction,
    agentBalanceAction,
    agentTransferAction,
    agentBridgeFeeAction,
    agentBridgeAction,
    agentBridgeStatusAction,
    agentSwapQuoteAction,
    agentSwapAction,
    agentContractAddressAction,
    agentExecuteContractAction,
];
//# sourceMappingURL=agent-actions.js.map