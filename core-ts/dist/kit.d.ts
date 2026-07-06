import { CircleWalletsClient } from "./client.js";
import { CircleAgentConfig } from "./config.js";
import { type ChainInfo } from "./chains.js";
import { CircleAgentCli, type CliResult } from "./agent-cli.js";
import * as contracts from "./contracts.js";
import type { FaucetResult, FeeEstimate, GatewayBalance, NanopaymentResult, PaymentRequest, TokenBalance, TransactionInfo, WalletInfo } from "./types.js";
/**
 * CircleAgentKit — the unified capability surface. Every agent-framework plugin
 * (Eliza, OpenClaw, Hermes) is a thin adapter over this class.
 */
export declare class CircleAgentKit {
    readonly config: CircleAgentConfig;
    private _client?;
    private _cli?;
    private constructor();
    /**
     * Build a kit from overrides + environment. Pass `client` to inject a mock
     * (used in tests / alternative transports).
     */
    static create(overrides?: Partial<CircleAgentConfig>, client?: CircleWalletsClient): CircleAgentKit;
    private client;
    private chainOr;
    private appKitChain;
    listChains(): ChainInfo[];
    getChain(id?: string): ChainInfo;
    createWalletSet(name?: string): Promise<{
        id: string;
        name?: string;
    }>;
    /**
     * Create an agent wallet. Reuses config.walletSetId when present, otherwise
     * creates a new wallet set first.
     */
    createWallet(params?: {
        chain?: string;
        accountType?: "EOA" | "SCA";
        walletSetId?: string;
    }): Promise<WalletInfo>;
    listWallets(params?: {
        walletSetId?: string;
        chain?: string;
    }): Promise<WalletInfo[]>;
    getAddress(walletId: string): Promise<string>;
    getBalance(walletId: string): Promise<TokenBalance[]>;
    getUsdcBalance(walletId: string): Promise<string>;
    estimateFee(params: {
        walletId: string;
        destinationAddress: string;
        amount: string;
        chain?: string;
    }): Promise<FeeEstimate>;
    /**
     * Send USDC. Enforces validation + mainnet/high-value confirmation guardrails.
     */
    sendUSDC(params: {
        walletId: string;
        destinationAddress: string;
        amount: string;
        chain?: string;
        feeLevel?: "LOW" | "MEDIUM" | "HIGH";
        confirm?: boolean;
        wait?: boolean;
    }): Promise<TransactionInfo>;
    getTransaction(id: string, chain?: string): Promise<TransactionInfo>;
    waitForTransaction(id: string, opts?: {
        chain?: string;
        intervalMs?: number;
        timeoutMs?: number;
    }): Promise<TransactionInfo>;
    accelerateTransaction(id: string): Promise<{
        id: string;
    }>;
    cancelTransaction(id: string): Promise<TransactionInfo>;
    gatewayDeposit(amount: string, confirm?: boolean): Promise<{
        amount: string;
        raw: unknown;
    }>;
    payX402(url: string, options?: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
    }): Promise<NanopaymentResult>;
    gatewayBalance(address?: string): Promise<GatewayBalance>;
    gatewayWithdraw(amount: string, confirm?: boolean): Promise<{
        amount: string;
        raw: unknown;
    }>;
    requirePayment(params: {
        sellerAddress: string;
        price?: string;
        chain?: string;
    }): Promise<unknown>;
    createPaymentRequest(params: {
        amount: string;
        destinationAddress: string;
        chain?: string;
        memo?: string;
        tokenAddress?: string;
    }): PaymentRequest;
    faucetInfo(chain?: string): {
        chain: string;
        testnet: boolean;
        faucetUrl?: string;
        note: string;
    };
    /**
     * Execute a write function on a smart contract. Always requires confirm
     * (arbitrary calls can move funds).
     */
    executeContract(params: {
        walletId: string;
        contractAddress: string;
        abiFunctionSignature?: string;
        abiParameters?: unknown[];
        callData?: string;
        amount?: string;
        chain?: string;
        feeLevel?: "LOW" | "MEDIUM" | "HIGH";
        confirm?: boolean;
        wait?: boolean;
    }): Promise<TransactionInfo>;
    /**
     * Bridge USDC across chains via CCTP v2. Needs a source wallet (on fromChain)
     * and a destination wallet (on toChain). Applies confirmation guardrails.
     */
    bridgeUSDC(params: {
        fromChain?: string;
        toChain: string;
        sourceWalletId: string;
        destWalletId: string;
        amount: string;
        mintRecipient?: string;
        waitForMint?: boolean;
        confirm?: boolean;
    }): Promise<contracts.BridgeResult>;
    /** Get a swap quote from the Circle App Kit (base-unit sellAmount). */
    swapQuote(params: {
        chain?: string;
        sellToken: string;
        buyToken: string;
        sellAmount: string;
        takerAddress: string;
        slippageBps?: number;
    }): Promise<contracts.SwapQuote>;
    /**
     * Swap one token for another from a wallet via the Circle App Kit.
     * `sellAmount` is in base units. Applies confirmation guardrails.
     */
    swap(params: {
        walletId: string;
        walletAddress: string;
        chain?: string;
        sellToken: string;
        buyToken: string;
        sellAmount: string;
        slippageBps?: number;
        feeLevel?: "LOW" | "MEDIUM" | "HIGH";
        confirm?: boolean;
    }): Promise<{
        quote: any;
        swapTxId: string;
    }>;
    /**
     * Self-serve testnet funding: request USDC (and native gas, when relevant)
     * from Circle's faucet for a wallet. Resolves `address` from `walletId` when
     * only an id is given.
     */
    requestFaucet(params?: {
        walletId?: string;
        address?: string;
        chain?: string;
        native?: boolean;
        usdc?: boolean;
        eurc?: boolean;
    }): Promise<FaucetResult>;
    /** Lazily construct the Circle CLI adapter (testnet-aware). */
    agentCli(): CircleAgentCli;
    /** Start email login: sends an OTP, returns a request id to complete with. */
    agentLoginInit(email: string): Promise<{
        requestId?: string;
        raw: string;
    }>;
    /** Complete email login with the request id and OTP from the inbox. */
    agentLoginComplete(requestId: string, otp: string): Promise<CliResult<unknown>>;
    /** List agent wallets (optionally by chain). */
    agentListWallets(chain?: string): Promise<CliResult>;
    /** Resolve the agent wallet address for a chain. */
    agentGetAddress(chain?: string): Promise<string | undefined>;
    /** On-chain balance for an agent wallet address. */
    agentBalance(address: string, chain?: string): Promise<CliResult>;
    /**
     * Fund an agent wallet. Testnet draws from the Circle faucet (omit
     * amount/method). Mainnet crypto/fiat funding requires confirm.
     */
    agentFund(params: {
        address: string;
        chain?: string;
        amount?: string;
        method?: "crypto" | "fiat";
        token?: string;
        confirm?: boolean;
    }): Promise<CliResult>;
    /** Transfer USDC (or token) from the agent wallet. Guardrails applied. */
    agentTransfer(params: {
        to: string;
        amount: string;
        address: string;
        chain?: string;
        token?: string;
        confirm?: boolean;
    }): Promise<CliResult>;
    /** Estimate the CCTP bridge fee from one chain to another. */
    agentBridgeFee(toChain: string, fromChain?: string): Promise<CliResult>;
    /** Bridge USDC across chains via CCTP. Guardrails applied. */
    agentBridge(params: {
        toChain: string;
        amount: string;
        address: string;
        fromChain?: string;
        recipient?: string;
        confirm?: boolean;
    }): Promise<CliResult>;
    /** Check the status of an in-flight bridge by burn tx hash. */
    agentBridgeStatus(txHash: string, fromChain?: string): Promise<CliResult>;
    /** Get a swap price quote (no execution). */
    agentSwapQuote(params: {
        sellToken: string;
        sellAmount: string;
        buyToken: string;
        chain?: string;
    }): Promise<CliResult>;
    /** Execute a token swap from the agent wallet. Guardrails applied. */
    agentSwap(params: {
        sellToken: string;
        sellAmount: string;
        buyToken: string;
        buyMin: string;
        address: string;
        chain?: string;
        slippageBps?: number;
        confirm?: boolean;
    }): Promise<CliResult>;
    /** Look up a Circle contract address (usdc, cctp, gateway, ...). */
    agentContractAddress(name: string, chain?: string): Promise<CliResult>;
    /** Search for available services in the Circle Agent Marketplace. */
    servicesSearch(params: {
        query?: string;
        category?: string;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<CliResult>;
    /** Inspect a service URL to see its price, schema, and requirements. */
    servicesInspect(params: {
        url: string;
        method?: string;
        data?: string;
        headers?: string[];
    }): Promise<CliResult>;
    /**
     * Execute a write function on a smart contract from the agent wallet.
     * Requires confirm (arbitrary contract calls can move funds).
     */
    agentExecuteContract(params: {
        signature: string;
        params: (string | number)[];
        contract: string;
        address: string;
        chain?: string;
        amount?: string;
        confirm?: boolean;
    }): Promise<CliResult>;
}
//# sourceMappingURL=kit.d.ts.map