/**
 * Chain registry for Circle Agent Kit.
 *
 * `id` values match Circle's blockchain identifiers used by the
 * developer-controlled-wallets SDK. Arc Testnet is the primary chain.
 */
export interface ChainInfo {
    /** Circle blockchain identifier (SDK `blockchain` value). */
    id: string;
    /** Human-friendly name. */
    name: string;
    /** EVM chain id, when applicable. */
    chainId?: number;
    /** Whether this is a testnet. */
    testnet: boolean;
    /** USDC ERC-20 contract address (6 decimals). */
    usdcAddress?: string;
    /** USDC token decimals (ERC-20 is always 6). */
    usdcDecimals: number;
    /** RPC endpoint (public). */
    rpcUrl?: string;
    /** Block explorer base URL. */
    explorer?: string;
    /**
     * True when the native gas asset IS USDC (Arc). On these chains, funding the
     * wallet with USDC also covers gas — there is no separate native token.
     */
    usdcIsGas: boolean;
    /** CCTP domain, when supported. */
    cctpDomain?: number;
}
export declare const CHAINS: Record<string, ChainInfo>;
export declare const DEFAULT_CHAIN = "ARC-TESTNET";
/**
 * CCTP v2 contract addresses. CCTP v2 deploys the same TokenMessengerV2 /
 * MessageTransmitterV2 addresses across all supported EVM chains, so these are
 * uniform. Override per-deployment via config if a chain differs.
 */
export declare const CCTP_V2: {
    readonly tokenMessenger: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d";
    readonly messageTransmitter: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64";
    /** Iris attestation API bases (v2). */
    readonly attestationApi: {
        readonly testnet: "https://iris-api-sandbox.circle.com";
        readonly mainnet: "https://iris-api.circle.com";
    };
};
export declare function listChains(): ChainInfo[];
export declare function getChain(id: string): ChainInfo;
export declare function isTestnetChain(id: string): boolean;
/** Map internal chain IDs to Circle App Kit chain names. */
export declare const ID_TO_APPKIT_CHAIN: Record<string, string>;
//# sourceMappingURL=chains.d.ts.map