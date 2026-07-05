import { CircleAgentError, CircleAgentKit } from "@circle-agent-kit/core";
let cachedKit;
export function kitFromEnv() {
    if (!cachedKit)
        cachedKit = CircleAgentKit.create();
    return cachedKit;
}
const obj = (properties, required = []) => ({
    type: "object",
    properties,
    required,
    additionalProperties: false,
});
const str = (description) => ({ type: "string", description });
const bool = (description) => ({ type: "boolean", description });
export const circleTools = [
    {
        name: "circle_create_wallet",
        description: "Create a new Circle developer-controlled agent wallet on a chain (default Arc Testnet).",
        parameters: obj({
            chain: str("Chain id, e.g. ARC-TESTNET, BASE-SEPOLIA. Defaults to configured chain."),
            accountType: { type: "string", enum: ["EOA", "SCA"], description: "Account type (default EOA)." },
        }),
        run: (kit, p) => kit.createWallet({ chain: p.chain, accountType: p.accountType }),
    },
    {
        name: "circle_check_balance",
        description: "Get token balances (including USDC) for an agent wallet.",
        parameters: obj({ walletId: str("Wallet id to inspect.") }, ["walletId"]),
        run: (kit, p) => kit.getBalance(p.walletId),
    },
    {
        name: "circle_faucet_info",
        description: "Get testnet faucet guidance for funding a wallet with USDC.",
        parameters: obj({ chain: str("Chain id (default configured chain).") }),
        run: async (kit, p) => kit.faucetInfo(p.chain),
    },
    {
        name: "circle_send_usdc",
        description: "Send USDC from an agent wallet to a destination address. Mainnet or large transfers require confirm=true.",
        optional: true,
        parameters: obj({
            walletId: str("Source wallet id."),
            destinationAddress: str("Recipient address (0x...)."),
            amount: str("USDC amount, e.g. '0.01'."),
            chain: str("Chain id (default configured chain)."),
            confirm: bool("Explicit confirmation for mainnet/large transfers."),
            wait: bool("Wait for the transaction to reach a terminal state (default true)."),
        }, ["walletId", "destinationAddress", "amount"]),
        run: (kit, p) => kit.sendUSDC({
            walletId: p.walletId,
            destinationAddress: p.destinationAddress,
            amount: String(p.amount),
            chain: p.chain,
            confirm: Boolean(p.confirm),
            wait: p.wait !== false,
        }),
    },
    {
        name: "circle_request_usdc",
        description: "Create a USDC payment request (invoice + EIP-681 payment URI/QR) to receive funds.",
        parameters: obj({
            amount: str("USDC amount requested."),
            destinationAddress: str("Address to receive the payment (0x...)."),
            chain: str("Chain id (default configured chain)."),
            memo: str("Optional note."),
        }, ["amount", "destinationAddress"]),
        run: async (kit, p) => kit.createPaymentRequest({
            amount: String(p.amount),
            destinationAddress: p.destinationAddress,
            chain: p.chain,
            memo: p.memo,
        }),
    },
    {
        name: "circle_pay_x402",
        description: "Pay for an x402-compatible resource with a gas-free USDC nanopayment via Circle Gateway.",
        optional: true,
        parameters: obj({
            url: str("URL of the x402-compatible resource."),
            method: str("HTTP method (default GET)."),
            body: { description: "Optional request body." },
        }, ["url"]),
        run: (kit, p) => kit.payX402(p.url, { method: p.method, body: p.body }),
    },
    {
        name: "circle_gateway_deposit",
        description: "Deposit USDC into the Circle Gateway balance to fund nanopayments. Requires confirm=true.",
        optional: true,
        parameters: obj({ amount: str("USDC amount to deposit."), confirm: bool("Explicit confirmation.") }, ["amount"]),
        run: (kit, p) => kit.gatewayDeposit(String(p.amount), Boolean(p.confirm)),
    },
    {
        name: "circle_gateway_balance",
        description: "Check the Circle Gateway (nanopayments) USDC balance.",
        parameters: obj({ address: str("Optional address to query.") }),
        run: (kit, p) => kit.gatewayBalance(p.address),
    },
    // --- Contracts / Bridge / Swap (SDK-native, dev-controlled wallet) ------
    {
        name: "circle_execute_contract",
        description: "Execute a write function on a smart contract from a dev-controlled wallet (SDK-native). Requires confirm=true.",
        optional: true,
        parameters: obj({
            walletId: str("Wallet id executing the call."),
            contractAddress: str("Target contract address (0x...)."),
            abiFunctionSignature: str('ABI signature, e.g. "approve(address,uint256)".'),
            abiParameters: { type: "array", description: "Function arguments in order.", items: {} },
            callData: str("Raw calldata (alternative to abiFunctionSignature/abiParameters)."),
            amount: str("Optional native value to send."),
            chain: str("Chain id (default configured)."),
            confirm: bool("Explicit confirmation (required)."),
            wait: bool("Wait for terminal state (default true)."),
        }, ["walletId", "contractAddress"]),
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
    },
    {
        name: "circle_bridge_usdc",
        description: "Bridge USDC across chains via CCTP v2 using dev-controlled wallets (approve -> burn -> attest -> mint). Mainnet/large amounts require confirm=true.",
        optional: true,
        parameters: obj({
            toChain: str("Destination chain id."),
            sourceWalletId: str("Source wallet id (on fromChain)."),
            destWalletId: str("Destination wallet id (on toChain)."),
            amount: str("USDC amount to bridge."),
            fromChain: str("Source chain id (default configured)."),
            mintRecipient: str("Optional mint recipient address (default destination wallet)."),
            waitForMint: bool("Wait and mint on destination (default true)."),
            confirm: bool("Explicit confirmation."),
        }, ["toChain", "sourceWalletId", "destWalletId", "amount"]),
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
    },
    {
        name: "circle_swap_quote",
        description: "Get a DEX swap quote (SDK-native, via configured aggregator). sellAmount is in base units.",
        parameters: obj({
            sellToken: str("Sell token address (0x...)."),
            buyToken: str("Buy token address (0x...)."),
            sellAmount: str("Amount to sell in base units."),
            takerAddress: str("Wallet address executing the swap."),
            chain: str("Chain id (default configured)."),
            slippageBps: { type: "number", description: "Max slippage in basis points." },
        }, ["sellToken", "buyToken", "sellAmount", "takerAddress"]),
        run: (kit, p) => kit.swapQuote({
            sellToken: p.sellToken,
            buyToken: p.buyToken,
            sellAmount: String(p.sellAmount),
            takerAddress: p.takerAddress,
            chain: p.chain,
            slippageBps: p.slippageBps != null ? Number(p.slippageBps) : undefined,
        }),
    },
    {
        name: "circle_swap",
        description: "Swap one token for another from a dev-controlled wallet (SDK-native, via configured DEX aggregator). sellAmount is base units. Mainnet/large swaps require confirm=true.",
        optional: true,
        parameters: obj({
            walletId: str("Wallet id executing the swap."),
            walletAddress: str("Wallet address (taker)."),
            sellToken: str("Sell token address (0x...)."),
            buyToken: str("Buy token address (0x...)."),
            sellAmount: str("Amount to sell in base units."),
            chain: str("Chain id (default configured)."),
            slippageBps: { type: "number", description: "Max slippage in basis points." },
            confirm: bool("Explicit confirmation."),
        }, ["walletId", "walletAddress", "sellToken", "buyToken", "sellAmount"]),
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
    },
    // --- Agent Stack (Circle CLI) — user-custody agent wallets --------------
    {
        name: "circle_agent_login_init",
        description: "Start Circle Agent Wallet authentication: send a one-time password (OTP) to an email; returns a request id.",
        parameters: obj({ email: str("Email to receive the OTP.") }, ["email"]),
        run: (kit, p) => kit.agentLoginInit(p.email),
    },
    {
        name: "circle_agent_login_complete",
        description: "Complete Circle Agent Wallet authentication with the request id and OTP. Provisions wallets on all chains.",
        parameters: obj({ requestId: str("Request id from login init."), otp: str("OTP code from the inbox.") }, ["requestId", "otp"]),
        run: (kit, p) => kit.agentLoginComplete(p.requestId, p.otp),
    },
    {
        name: "circle_agent_list_wallets",
        description: "List Circle agent wallets and addresses, optionally filtered by chain.",
        parameters: obj({ chain: str("Chain id, e.g. BASE, ARC-TESTNET.") }),
        run: (kit, p) => kit.agentListWallets(p.chain),
    },
    {
        name: "circle_agent_balance",
        description: "Check the on-chain balance of an agent wallet address.",
        parameters: obj({ address: str("Wallet address (0x...)."), chain: str("Chain id.") }, ["address"]),
        run: (kit, p) => kit.agentBalance(p.address, p.chain),
    },
    {
        name: "circle_agent_fund",
        description: "Fund an agent wallet. Testnet draws from the Circle faucet (omit amount/method). Mainnet crypto/fiat requires confirm=true.",
        optional: true,
        parameters: obj({
            address: str("Wallet address to fund (0x...)."),
            chain: str("Chain id (default configured chain)."),
            amount: str("Amount to fund (mainnet)."),
            method: { type: "string", enum: ["crypto", "fiat"], description: "Funding method (mainnet)." },
            token: str("Token to fund (default USDC)."),
            confirm: bool("Explicit confirmation for mainnet funding."),
        }, ["address"]),
        run: (kit, p) => kit.agentFund({
            address: p.address,
            chain: p.chain,
            amount: p.amount != null ? String(p.amount) : undefined,
            method: p.method,
            token: p.token,
            confirm: Boolean(p.confirm),
        }),
    },
    {
        name: "circle_agent_transfer",
        description: "Transfer USDC (or token) from an agent wallet via the Circle CLI. Mainnet/large transfers require confirm=true.",
        optional: true,
        parameters: obj({
            to: str("Recipient address (0x...)."),
            amount: str("Amount to transfer."),
            address: str("Source agent wallet address (0x...)."),
            chain: str("Chain id (default configured chain)."),
            token: str("Token to send (default USDC)."),
            confirm: bool("Explicit confirmation for mainnet/large transfers."),
        }, ["to", "amount", "address"]),
        run: (kit, p) => kit.agentTransfer({
            to: p.to,
            amount: String(p.amount),
            address: p.address,
            chain: p.chain,
            token: p.token,
            confirm: Boolean(p.confirm),
        }),
    },
    {
        name: "circle_agent_bridge_fee",
        description: "Estimate the CCTP bridge fee to move USDC to another chain.",
        parameters: obj({ toChain: str("Destination chain id."), fromChain: str("Source chain id (default configured).") }, ["toChain"]),
        run: (kit, p) => kit.agentBridgeFee(p.toChain, p.fromChain),
    },
    {
        name: "circle_agent_bridge",
        description: "Bridge USDC across chains via CCTP (burn on source, mint on destination). Mainnet/large amounts require confirm=true.",
        optional: true,
        parameters: obj({
            toChain: str("Destination chain id."),
            amount: str("USDC amount to bridge."),
            address: str("Source agent wallet address (0x...)."),
            fromChain: str("Source chain id (default configured)."),
            recipient: str("Optional recipient address on the destination chain."),
            confirm: bool("Explicit confirmation."),
        }, ["toChain", "amount", "address"]),
        run: (kit, p) => kit.agentBridge({
            toChain: p.toChain,
            amount: String(p.amount),
            address: p.address,
            fromChain: p.fromChain,
            recipient: p.recipient,
            confirm: Boolean(p.confirm),
        }),
    },
    {
        name: "circle_agent_bridge_status",
        description: "Check the status of an in-flight CCTP bridge by its burn transaction hash.",
        parameters: obj({ txHash: str("Burn transaction hash (0x...)."), fromChain: str("Source chain id.") }, ["txHash"]),
        run: (kit, p) => kit.agentBridgeStatus(p.txHash, p.fromChain),
    },
    {
        name: "circle_agent_swap_quote",
        description: "Get a token swap price quote from an agent wallet (no execution).",
        parameters: obj({
            sellToken: str("Token to sell, e.g. EURC."),
            sellAmount: str("Amount to sell."),
            buyToken: str("Token to buy, e.g. USDC."),
            chain: str("Chain id (default configured)."),
        }, ["sellToken", "sellAmount", "buyToken"]),
        run: (kit, p) => kit.agentSwapQuote({
            sellToken: p.sellToken,
            sellAmount: String(p.sellAmount),
            buyToken: p.buyToken,
            chain: p.chain,
        }),
    },
    {
        name: "circle_agent_swap",
        description: "Swap one token for another from an agent wallet with a buyMin stop-limit. Mainnet/large swaps require confirm=true.",
        optional: true,
        parameters: obj({
            sellToken: str("Token to sell."),
            sellAmount: str("Amount to sell."),
            buyToken: str("Token to buy."),
            buyMin: str("Minimum acceptable output (stop-limit)."),
            address: str("Agent wallet address (0x...)."),
            chain: str("Chain id (default configured)."),
            slippageBps: { type: "number", description: "Max slippage in basis points." },
            confirm: bool("Explicit confirmation."),
        }, ["sellToken", "sellAmount", "buyToken", "buyMin", "address"]),
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
    },
    {
        name: "circle_agent_contract_address",
        description: "Look up a Circle contract address (usdc, cctp, gateway, ...) for a chain.",
        parameters: obj({ name: str("Contract name, e.g. usdc, cctp, gateway."), chain: str("Chain id.") }, ["name"]),
        run: (kit, p) => kit.agentContractAddress(p.name, p.chain),
    },
    {
        name: "circle_agent_execute_contract",
        description: "Execute a write function on a smart contract from an agent wallet. Always requires confirm=true.",
        optional: true,
        parameters: obj({
            signature: str('ABI function signature, e.g. "approve(address,uint256)".'),
            params: { type: "array", description: "Function arguments in order.", items: {} },
            contract: str("Contract address (0x...)."),
            address: str("Agent wallet address (0x...)."),
            chain: str("Chain id (default configured)."),
            amount: str("Optional native token value to send with the call."),
            confirm: bool("Explicit confirmation (required)."),
        }, ["signature", "params", "contract", "address"]),
        run: (kit, p) => kit.agentExecuteContract({
            signature: p.signature,
            params: Array.isArray(p.params) ? p.params : [],
            contract: p.contract,
            address: p.address,
            chain: p.chain,
            amount: p.amount != null ? String(p.amount) : undefined,
            confirm: Boolean(p.confirm),
        }),
    },
];
/** Run a tool with consistent success/error text output for OpenClaw. */
export async function runTool(tool, params) {
    try {
        const result = await tool.run(kitFromEnv(), params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
    catch (e) {
        const message = e instanceof CircleAgentError
            ? `${e.code}: ${e.message}`
            : e instanceof Error
                ? e.message
                : String(e);
        return { content: [{ type: "text", text: `Error: ${message}` }] };
    }
}
//# sourceMappingURL=tools.js.map