import { convo, makeAction } from "./shared.js";
export const createWalletAction = makeAction({
    name: "CIRCLE_CREATE_WALLET",
    similes: ["CREATE_WALLET", "NEW_WALLET", "MAKE_AGENT_WALLET", "SETUP_WALLET"],
    description: "Create a new Circle developer-controlled agent wallet on the configured chain (default Arc Testnet). " +
        'Params: { chain?: string, accountType?: "EOA"|"SCA" }.',
    run: (kit, p) => kit.createWallet({
        chain: p.chain,
        accountType: p.accountType,
    }),
    formatResult: (w) => `Created wallet ${w.id} at ${w.address} on ${w.blockchain}.`,
    examples: [
        convo("Create a new agent wallet on Arc", "Creating your Circle wallet now.", "CIRCLE_CREATE_WALLET"),
        convo("Set up a USDC wallet for me", "Setting up your agent wallet.", "CIRCLE_CREATE_WALLET"),
    ],
});
export const checkBalanceAction = makeAction({
    name: "CIRCLE_CHECK_BALANCE",
    similes: ["CHECK_BALANCE", "WALLET_BALANCE", "USDC_BALANCE", "HOW_MUCH_USDC", "MY_BALANCE"],
    description: "Check the USDC (and other token) balances for an agent wallet. Params: { walletId: string }.",
    requiredParams: ["walletId"],
    run: (kit, p) => kit.getBalance(p.walletId),
    formatResult: (balances) => {
        const usdc = balances.find((b) => (b.symbol ?? "").toUpperCase() === "USDC");
        const extra = balances.length > 1 ? ` (+${balances.length - 1} other tokens)` : "";
        return `Balance: ${usdc?.amount ?? "0"} USDC${extra}.`;
    },
    examples: [
        convo("What's my wallet balance?", "Checking your balances now.", "CIRCLE_CHECK_BALANCE"),
    ],
});
export const sendUsdcAction = makeAction({
    name: "CIRCLE_SEND_USDC",
    similes: ["SEND_USDC", "TRANSFER_USDC", "PAY_USDC", "SEND_MONEY"],
    description: "Send USDC from an agent wallet to a destination address. Confirm recipient and amount first. " +
        "Mainnet or large transfers require confirm: true. " +
        "Params: { walletId: string, destinationAddress: string, amount: string|number, chain?, confirm?: boolean, wait?: boolean }.",
    requiredParams: ["walletId", "destinationAddress", "amount"],
    run: (kit, p) => kit.sendUSDC({
        walletId: p.walletId,
        destinationAddress: p.destinationAddress,
        amount: String(p.amount),
        chain: p.chain,
        confirm: Boolean(p.confirm),
        wait: p.wait !== false,
    }),
    formatResult: (tx, p) => `Sent ${p.amount} USDC. Transaction ${tx.id} is ${tx.state}.${tx.explorerUrl ? ` ${tx.explorerUrl}` : ""}`,
    examples: [
        convo("Send 0.5 USDC to 0x1111111111111111111111111111111111111111", "I'll send 0.5 USDC to that address now.", "CIRCLE_SEND_USDC"),
    ],
});
export const requestUsdcAction = makeAction({
    name: "CIRCLE_REQUEST_USDC",
    similes: ["REQUEST_USDC", "PAYMENT_REQUEST", "INVOICE", "REQUEST_PAYMENT", "CREATE_INVOICE"],
    description: "Create a USDC payment request (invoice + EIP-681 payment URI/QR) to receive funds. " +
        "Params: { amount: string|number, destinationAddress: string, chain?, memo? }.",
    requiredParams: ["amount", "destinationAddress"],
    run: (kit, p) => kit.createPaymentRequest({
        amount: String(p.amount),
        destinationAddress: p.destinationAddress,
        chain: p.chain,
        memo: p.memo,
    }),
    formatResult: (req) => `Payment request for ${req.amount} USDC on ${req.chain}. Pay via: ${req.uri}`,
    examples: [
        convo("Request 10 USDC to 0x2222222222222222222222222222222222222222", "Here is your payment request.", "CIRCLE_REQUEST_USDC"),
    ],
});
// --- Dev-controlled SDK: Contracts, Bridge, Swap ---------------------------
export const payX402Action = makeAction({
    name: "CIRCLE_PAY_X402",
    similes: ["PAY_X402", "NANOPAYMENT", "PAY_API", "PAY_RESOURCE", "MICROPAYMENT"],
    description: "Pay for an x402-compatible resource with a gas-free USDC nanopayment via Circle Gateway. " +
        "Params: { url: string, method?: string, body?: unknown }.",
    requiredParams: ["url"],
    run: (kit, p) => kit.payX402(p.url, { method: p.method, body: p.body }),
    formatResult: (r) => `Paid ${r.url} via gas-free nanopayment${r.amount ? ` (${r.amount} USDC)` : ""}.`,
    examples: [
        convo("Pay https://api.example.com/llm and get the result", "Making a gas-free nanopayment.", "CIRCLE_PAY_X402"),
    ],
});
export const gatewayDepositAction = makeAction({
    name: "CIRCLE_GATEWAY_DEPOSIT",
    similes: ["GATEWAY_DEPOSIT", "FUND_NANOPAYMENTS", "DEPOSIT_USDC"],
    description: "Deposit USDC into the Circle Gateway balance to fund future x402 nanopayments. Requires confirm: true. " +
        "Params: { amount: string|number, confirm: boolean }.",
    requiredParams: ["amount"],
    run: (kit, p) => kit.gatewayDeposit(String(p.amount), Boolean(p.confirm)),
    formatResult: (r) => `Deposited ${r.amount} USDC into Gateway.`,
    examples: [
        convo("Deposit 5 USDC into gateway, confirmed", "Depositing 5 USDC to Gateway.", "CIRCLE_GATEWAY_DEPOSIT"),
    ],
});
export const gatewayBalanceAction = makeAction({
    name: "CIRCLE_GATEWAY_BALANCE",
    similes: ["GATEWAY_BALANCE", "NANOPAYMENT_BALANCE"],
    description: "Check the Circle Gateway (nanopayments) USDC balance. Params: { address?: string }.",
    run: (kit, p) => kit.gatewayBalance(p.address),
    formatResult: (b) => `Gateway balance: ${b.available} USDC.`,
    examples: [convo("What's my gateway balance?", "Checking your Gateway balance.", "CIRCLE_GATEWAY_BALANCE")],
});
export const executeContractAction = makeAction({
    name: "CIRCLE_EXECUTE_CONTRACT",
    similes: ["EXECUTE_CONTRACT", "CALL_CONTRACT", "CONTRACT_WRITE", "APPROVE_TOKEN"],
    description: "Execute a write function on a smart contract from a wallet (SDK-native). Always requires confirm: true. " +
        'Params: { walletId: string, contractAddress: string, abiFunctionSignature?: string (e.g. "approve(address,uint256)"), ' +
        "abiParameters?: any[], callData?: string, amount?: string, chain?, confirm: boolean, wait?: boolean }.",
    requiredParams: ["walletId", "contractAddress"],
    run: (kit, p) => kit.executeContract({
        walletId: p.walletId,
        contractAddress: p.contractAddress,
        abiFunctionSignature: p.abiFunctionSignature,
        abiParameters: p.abiParameters,
        callData: p.callData,
        amount: p.amount != null ? String(p.amount) : undefined,
        chain: p.chain,
        confirm: Boolean(p.confirm),
        wait: p.wait !== false,
    }),
    formatResult: (tx) => `Contract execution ${tx.id} is ${tx.state}.${tx.explorerUrl ? ` ${tx.explorerUrl}` : ""}`,
    examples: [
        convo("Approve 1 USDC allowance for 0xSpender on the USDC contract, confirmed", "Executing the approve call.", "CIRCLE_EXECUTE_CONTRACT"),
    ],
});
export const bridgeUsdcAction = makeAction({
    name: "CIRCLE_BRIDGE_USDC",
    similes: ["BRIDGE_USDC", "CCTP_BRIDGE", "MOVE_USDC_CROSSCHAIN", "CROSSCHAIN_USDC"],
    description: "Bridge USDC across chains via CCTP v2 (approve -> burn -> attest -> mint) using SDK wallets. " +
        "Needs a source wallet on fromChain and a destination wallet on toChain. Mainnet/large amounts require confirm: true. " +
        "Params: { toChain: string, sourceWalletId: string, destWalletId: string, amount: string|number, fromChain?, mintRecipient?, waitForMint?: boolean, confirm?: boolean }.",
    requiredParams: ["toChain", "sourceWalletId", "destWalletId", "amount"],
    run: (kit, p) => kit.bridgeUSDC({
        toChain: p.toChain,
        sourceWalletId: p.sourceWalletId,
        destWalletId: p.destWalletId,
        amount: String(p.amount),
        fromChain: p.fromChain,
        mintRecipient: p.mintRecipient,
        waitForMint: p.waitForMint !== false,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => r.state === "COMPLETE"
        ? `Bridged ${r.amount} USDC ${r.fromChain} -> ${r.toChain}. Burn ${r.burnTxHash ?? r.burnTxId}, mint ${r.mintTxHash ?? r.mintTxId}.`
        : `Burned ${r.amount} USDC on ${r.fromChain} (tx ${r.burnTxHash ?? r.burnTxId}); minting on ${r.toChain} pending.`,
    examples: [
        convo("Bridge 10 USDC from my Base wallet to Arbitrum, confirmed", "Bridging 10 USDC via CCTP.", "CIRCLE_BRIDGE_USDC"),
    ],
});
export const swapQuoteAction = makeAction({
    name: "CIRCLE_SWAP_QUOTE",
    similes: ["SWAP_QUOTE", "PRICE_QUOTE", "QUOTE_SWAP"],
    description: "Get a DEX swap quote (SDK-native, via configured aggregator). sellAmount is in base units. " +
        "Params: { sellToken: string, buyToken: string, sellAmount: string, takerAddress: string, chain?, slippageBps? }.",
    requiredParams: ["sellToken", "buyToken", "sellAmount", "takerAddress"],
    run: (kit, p) => kit.swapQuote({
        sellToken: p.sellToken,
        buyToken: p.buyToken,
        sellAmount: String(p.sellAmount),
        takerAddress: p.takerAddress,
        chain: p.chain,
        slippageBps: p.slippageBps != null ? Number(p.slippageBps) : undefined,
    }),
    formatResult: (q) => `Quote: ${q.sellAmount} ${q.sellToken} -> ${q.buyAmount} ${q.buyToken}.`,
    examples: [
        convo("Quote swapping 10 USDC to EURC", "Getting a swap quote.", "CIRCLE_SWAP_QUOTE"),
    ],
});
export const swapAction = makeAction({
    name: "CIRCLE_SWAP",
    similes: ["SWAP_TOKENS", "EXECUTE_SWAP", "TRADE_TOKENS"],
    description: "Swap one token for another from a wallet (SDK-native, via configured DEX aggregator + contract execution). " +
        "sellAmount is in base units. Mainnet/large swaps require confirm: true. " +
        "Params: { walletId: string, walletAddress: string, sellToken: string, buyToken: string, sellAmount: string, chain?, slippageBps?, confirm?: boolean }.",
    requiredParams: ["walletId", "walletAddress", "sellToken", "buyToken", "sellAmount"],
    run: (kit, p) => kit.swap({
        walletId: p.walletId,
        walletAddress: p.walletAddress,
        sellToken: p.sellToken,
        buyToken: p.buyToken,
        sellAmount: String(p.sellAmount),
        chain: p.chain,
        slippageBps: p.slippageBps != null ? Number(p.slippageBps) : undefined,
        confirm: Boolean(p.confirm),
    }),
    formatResult: (r) => `Swap submitted (tx ${r.swapTxId}): ${r.quote.sellAmount} ${r.quote.sellToken} -> ~${r.quote.buyAmount} ${r.quote.buyToken}.`,
    examples: [
        convo("Swap 10 USDC to EURC from my wallet, confirmed", "Executing the swap.", "CIRCLE_SWAP"),
    ],
});
export const allActions = [
    createWalletAction,
    checkBalanceAction,
    sendUsdcAction,
    requestUsdcAction,
    payX402Action,
    gatewayDepositAction,
    gatewayBalanceAction,
    executeContractAction,
    bridgeUsdcAction,
    swapQuoteAction,
    swapAction,
];
//# sourceMappingURL=actions.js.map