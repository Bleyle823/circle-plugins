export type Network = "TESTNET" | "MAINNET";
export interface CircleAgentConfig {
    /** Circle API key (format: PREFIX:ID:SECRET). */
    apiKey: string;
    /** 32-byte hex entity secret (registered by the developer, consumed here). */
    entitySecret: string;
    /** Target network. Defaults to TESTNET. */
    network: Network;
    /** Default chain id (see chains.ts). */
    defaultChain: string;
    /** Optional existing wallet set to reuse. */
    walletSetId?: string;
    /** USDC amount above which transfers require explicit confirmation. */
    confirmThresholdUsdc: number;
    /** x402 buyer private key for gasless nanopayment signatures. */
    x402PrivateKey?: string;
    /** x402 chain (as understood by @circle-fin/x402-batching, e.g. "base-sepolia"). */
    x402Chain?: string;
    /** Circle CLI binary for Agent Stack ops (Agent Wallets). Defaults to "circle". */
    cliBin?: string;
    /** DEX aggregator base URL for SDK-native swaps (0x-compatible schema). */
    swapApiUrl?: string;
    /** DEX aggregator API key (e.g. 0x). */
    swapApiKey?: string;
    /** Circle App Kit key (from Circle Console) for SDK-native swaps. */
    kitKey?: string;
}
/**
 * Build config from an explicit object merged over environment variables.
 * Explicit values always win; env fills the gaps.
 */
export declare function resolveConfig(overrides?: Partial<CircleAgentConfig>, env?: Record<string, string | undefined>): CircleAgentConfig;
//# sourceMappingURL=config.d.ts.map