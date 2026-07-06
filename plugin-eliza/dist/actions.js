import { convo, makeAction } from "./shared.js";
import { defaultPaywallUrl, extractUrl, normalizePaywallUrl } from "./params.js";
import { wantsGatewayBalance, wantsWalletBalance, wantsX402Payment } from "./intent.js";
export const createWalletAction = makeAction({
    name: "CIRCLE_CREATE_WALLET",
    similes: ["CREATE_WALLET", "NEW_WALLET", "MAKE_AGENT_WALLET", "SETUP_WALLET"],
    description: "Create a new Circle developer-controlled agent wallet on the configured chain (default Arc Testnet). " +
        'Params: { chain?: string, accountType?: "EOA"|"SCA" }.',
    validate: async (_runtime, message) => /\b(create|new|setup|make)\b.*\b(wallet)\b/i.test(String(message?.content?.text ?? "")),
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
    description: "Check the USDC (and other token) balances for an agent wallet. Params: { walletId?: string }.",
    validate: async (_runtime, message) => wantsWalletBalance(String(message?.content?.text ?? "")),
    run: (kit, p) => kit.getBalance(p.walletId || process.env.CIRCLE_WALLET_ID),
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
    validate: async (_runtime, message) => {
        const text = String(message?.content?.text ?? "");
        return /\b(send|transfer|pay)\b/i.test(text) && /0x[a-fA-F0-9]{40}/.test(text);
    },
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
    validate: async (_runtime, message) => /\b(invoice|payment\s+request|request\s+usdc)\b/i.test(String(message?.content?.text ?? "")),
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
export const payX402Action = makeAction({
    name: "CIRCLE_PAY_X402",
    similes: ["PAY_X402", "NANOPAYMENT", "PAY_API", "PAY_RESOURCE", "MICROPAYMENT"],
    description: "Pay for an x402-compatible resource with a gas-free USDC nanopayment via Circle Gateway. " +
        `Default URL: ${defaultPaywallUrl()} (GET /risk-profile, $0.01 USDC). ` +
        "Params: { url?: string, method?: string, body?: unknown }.",
    validate: async (_runtime, message) => {
        const text = String(message?.content?.text ?? "");
        return wantsX402Payment(text) || Boolean(extractUrl(text));
    },
    run: (kit, p) => {
        const url = normalizePaywallUrl(String(p.url || defaultPaywallUrl()));
        return kit.payX402(url, { method: p.method, body: p.body });
    },
    formatResult: (r) => {
        const amount = r.formattedAmount ?? r.amount;
        const lines = [
            `Paid ${r.url} via gas-free nanopayment${amount ? ` (${amount} USDC)` : ""}.`,
        ];
        if (r.data && typeof r.data === "object") {
            lines.push(`Response: ${JSON.stringify(r.data)}`);
        }
        if (r.transaction)
            lines.push(`Gateway transfer ID: ${r.transaction}`);
        if (r.explorerUrl)
            lines.push(`View on explorer: ${r.explorerUrl}`);
        return lines.join("\n");
    },
    examples: [
        convo("Pay for the risk profile at the x402 paywall", "Making a gas-free nanopayment.", "CIRCLE_PAY_X402,REPLY"),
        convo("Pay http://localhost:4021/risk-profile and return the result", "Making a gas-free nanopayment.", "CIRCLE_PAY_X402,REPLY"),
    ],
});
export const gatewayDepositAction = makeAction({
    name: "CIRCLE_GATEWAY_DEPOSIT",
    similes: ["GATEWAY_DEPOSIT", "FUND_NANOPAYMENTS", "DEPOSIT_USDC"],
    description: "Deposit USDC into the Circle Gateway balance to fund future x402 nanopayments. Requires confirm: true. " +
        "Params: { amount: string|number, confirm: boolean }.",
    requiredParams: ["amount"],
    validate: async (_runtime, message) => /\b(deposit|fund)\b/i.test(String(message?.content?.text ?? "")) &&
        /\bgateway\b/i.test(String(message?.content?.text ?? "")),
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
    validate: async (_runtime, message) => wantsGatewayBalance(String(message?.content?.text ?? "")),
    run: (kit, p) => kit.gatewayBalance(p.address),
    formatResult: (b) => `Gateway balance: ${b.available} USDC.`,
    examples: [
        convo("What's my gateway balance?", "Checking your Gateway balance.", "CIRCLE_GATEWAY_BALANCE,REPLY"),
    ],
});
export const requestFaucetAction = makeAction({
    name: "CIRCLE_REQUEST_FAUCET",
    similes: [
        "REQUEST_FAUCET",
        "FAUCET",
        "GET_TESTNET_USDC",
        "REQUEST_GAS",
        "GAS_FAUCET",
        "FUND_WALLET",
        "TOP_UP_WALLET",
        "GET_GAS",
    ],
    description: "Request free testnet USDC (and native gas, when the chain needs it) from the Circle faucet " +
        "to fund an agent wallet. Testnet only — falls back to CIRCLE_WALLET_ID if no walletId is given. " +
        "Params: { walletId?: string, address?: string, chain?: string, native?: boolean, usdc?: boolean, eurc?: boolean }.",
    validate: async (_runtime, message) => /\b(faucet|testnet\s+usdc|top\s*up|fund\s+my\s+wallet)\b/i.test(String(message?.content?.text ?? "")),
    run: (kit, p) => kit.requestFaucet({
        walletId: p.walletId ?? process.env.CIRCLE_WALLET_ID,
        address: p.address,
        chain: p.chain,
        native: p.native,
        usdc: p.usdc,
        eurc: p.eurc,
    }),
    formatResult: (r) => r.note,
    examples: [
        convo("My wallet has no gas, can you request some testnet USDC from the faucet?", "Requesting testnet USDC from the Circle faucet now.", "CIRCLE_REQUEST_FAUCET"),
        convo("Top up my wallet from the faucet", "Funding your wallet from the Circle faucet.", "CIRCLE_REQUEST_FAUCET"),
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
    requestFaucetAction,
];
//# sourceMappingURL=actions.js.map