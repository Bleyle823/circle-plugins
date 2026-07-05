/**
 * Circle Agent Stack via the `circle` CLI (`@circle-fin/cli`).
 *
 * Agent Wallets are user-controlled MPC wallets that the agent operates through
 * the CLI (authenticate, fund, transfer, bridge, swap, execute contract). This
 * module shells out to the CLI and parses its JSON output. It is separate from
 * the developer-controlled-wallets SDK path used elsewhere in the kit.
 *
 * Install once (globally or in the project): `npm install -g @circle-fin/cli`.
 */
export interface AgentCliOptions {
    /** Override the CLI binary name/path. Defaults to `circle`. */
    bin?: string;
    /** Use testnet sessions/commands. */
    testnet?: boolean;
    /** Per-call timeout in ms. Defaults to 180000 (bridges can be slow). */
    timeoutMs?: number;
    /** Accept CLI Terms of Use on first run (sets CIRCLE_ACCEPT_TERMS=1). */
    acceptTerms?: boolean;
}
export interface CliResult<T = unknown> {
    /** Parsed `data` field from CLI JSON output, when present. */
    data?: T;
    /** Raw stdout. */
    stdout: string;
    /** Raw stderr. */
    stderr: string;
}
export declare class CircleAgentCli {
    private readonly bin;
    private readonly testnet;
    private readonly timeoutMs;
    private readonly acceptTerms;
    constructor(opts?: AgentCliOptions);
    /** Run a raw CLI invocation. Adds --testnet when configured. */
    run<T = unknown>(args: string[], addTestnet?: boolean): Promise<CliResult<T>>;
    /**
     * Non-interactive login step 1: send an OTP to `email`, returns a request id.
     * Complete with `loginComplete({ requestId, otp })`.
     */
    loginInit(email: string): Promise<{
        requestId?: string;
        raw: string;
    }>;
    /** Non-interactive login step 2: complete with request id + OTP. */
    loginComplete(requestId: string, otp: string): Promise<CliResult>;
    /** List agent wallets, optionally filtered by chain. */
    listWallets(chain?: string): Promise<CliResult>;
    /** Get an agent wallet's address for a chain. */
    getAddress(chain: string): Promise<string | undefined>;
    /** Check on-chain balance for a wallet address. */
    balance(address: string, chain: string): Promise<CliResult>;
    /**
     * Fund a wallet. On testnet, omit amount/method to draw from the Circle
     * faucet. On mainnet, use method "crypto" (QR/EIP-681) or "fiat" (onramp).
     */
    fund(params: {
        address: string;
        chain: string;
        amount?: string;
        method?: "crypto" | "fiat";
        token?: string;
    }): Promise<CliResult>;
    /** Transfer USDC (or --token) from the agent wallet to a recipient. */
    transfer(params: {
        to: string;
        amount: string;
        address: string;
        chain: string;
        token?: string;
    }): Promise<CliResult>;
    bridgeGetFee(toChain: string, fromChain: string): Promise<CliResult>;
    bridgeTransfer(params: {
        toChain: string;
        amount: string;
        address: string;
        fromChain: string;
        recipient?: string;
    }): Promise<CliResult>;
    bridgeStatus(txHash: string, fromChain: string): Promise<CliResult>;
    /**
     * Swap tokens. Pass `quote: true` for a price quote (no execution). To
     * execute, provide `buyMin` (stop-limit) and `address`.
     */
    swap(params: {
        sellToken: string;
        sellAmount: string;
        buyToken: string;
        buyMin?: string;
        address?: string;
        chain: string;
        quote?: boolean;
        slippageBps?: number;
    }): Promise<CliResult>;
    /** Look up a Circle contract address (usdc, cctp, gateway, ...). */
    contractAddress(name: string, chain: string): Promise<CliResult>;
    /**
     * Execute a write function on a contract from the agent wallet.
     * `signature` is the ABI function signature; `params` are its args.
     */
    execute(params: {
        signature: string;
        params: (string | number)[];
        contract: string;
        address: string;
        chain: string;
        amount?: string;
    }): Promise<CliResult>;
}
//# sourceMappingURL=agent-cli.d.ts.map