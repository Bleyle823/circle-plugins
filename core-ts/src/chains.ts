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

export const CHAINS: Record<string, ChainInfo> = {
  "ARC-TESTNET": {
    id: "ARC-TESTNET",
    name: "Arc Testnet",
    chainId: 5042002,
    testnet: true,
    usdcAddress: "0x3600000000000000000000000000000000000000",
    usdcDecimals: 6,
    rpcUrl: "https://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    usdcIsGas: true,
    cctpDomain: 26,
  },
  "BASE-SEPOLIA": {
    id: "BASE-SEPOLIA",
    name: "Base Sepolia",
    chainId: 84532,
    testnet: true,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    usdcDecimals: 6,
    explorer: "https://sepolia.basescan.org",
    usdcIsGas: false,
    cctpDomain: 6,
  },
  "ARB-SEPOLIA": {
    id: "ARB-SEPOLIA",
    name: "Arbitrum Sepolia",
    chainId: 421614,
    testnet: true,
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    usdcDecimals: 6,
    explorer: "https://sepolia.arbiscan.io",
    usdcIsGas: false,
    cctpDomain: 3,
  },
  "MATIC-AMOY": {
    id: "MATIC-AMOY",
    name: "Polygon Amoy",
    chainId: 80002,
    testnet: true,
    usdcAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    usdcDecimals: 6,
    explorer: "https://amoy.polygonscan.com",
    usdcIsGas: false,
    cctpDomain: 7,
  },
  "ETH-SEPOLIA": {
    id: "ETH-SEPOLIA",
    name: "Ethereum Sepolia",
    chainId: 11155111,
    testnet: true,
    usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    usdcDecimals: 6,
    explorer: "https://sepolia.etherscan.io",
    usdcIsGas: false,
    cctpDomain: 0,
  },
  "BASE-MAINNET": {
    id: "BASE-MAINNET",
    name: "Base",
    chainId: 8453,
    testnet: false,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdcDecimals: 6,
    explorer: "https://basescan.org",
    usdcIsGas: false,
    cctpDomain: 6,
  },
};

export const DEFAULT_CHAIN = "ARC-TESTNET";

/**
 * CCTP v2 contract addresses. CCTP v2 deploys the same TokenMessengerV2 /
 * MessageTransmitterV2 addresses across all supported EVM chains, so these are
 * uniform. Override per-deployment via config if a chain differs.
 */
export const CCTP_V2 = {
  tokenMessenger: "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
  messageTransmitter: "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
  /** Iris attestation API bases (v2). */
  attestationApi: {
    testnet: "https://iris-api-sandbox.circle.com",
    mainnet: "https://iris-api.circle.com",
  },
} as const;

export function listChains(): ChainInfo[] {
  return Object.values(CHAINS);
}

export function getChain(id: string): ChainInfo {
  const chain = CHAINS[id?.toUpperCase?.() ?? id];
  if (!chain) {
    throw new Error(
      `Unknown chain "${id}". Known chains: ${Object.keys(CHAINS).join(", ")}`
    );
  }
  return chain;
}

export function isTestnetChain(id: string): boolean {
  return getChain(id).testnet;
}

/** Map internal chain IDs to Circle App Kit chain names. */
export const ID_TO_APPKIT_CHAIN: Record<string, string> = {
  "ARC-TESTNET": "Arc_Testnet",
  "BASE-SEPOLIA": "Base_Sepolia",
  "ARB-SEPOLIA": "Arbitrum_Sepolia",
  "MATIC-AMOY": "Polygon_Amoy",
  "ETH-SEPOLIA": "Ethereum_Sepolia",
  "BASE-MAINNET": "Base",
};
