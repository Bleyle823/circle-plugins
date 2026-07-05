import { describe, expect, it } from "vitest";
import { CircleAgentKit, createPaymentRequest, toBaseUnits } from "../src/index.js";
import type { CircleWalletsClient } from "../src/index.js";

const baseConfig = {
  apiKey: "TEST:1:secret",
  entitySecret: "a".repeat(64),
  network: "TESTNET" as const,
};

/** A mock Circle client that records calls and returns canned responses. */
function mockClient(overrides: Partial<CircleWalletsClient> = {}): CircleWalletsClient {
  return {
    createWalletSet: async () => ({ data: { walletSet: { id: "ws_1", name: "x" } } }),
    createWallets: async () => ({
      data: { wallets: [{ id: "w_1", address: "0x" + "1".repeat(40), blockchain: "ARC-TESTNET" }] },
    }),
    listWallets: async () => ({ data: { wallets: [] } }),
    getWallet: async () => ({ data: { wallet: { address: "0x" + "2".repeat(40) } } }),
    getWalletTokenBalance: async () => ({
      data: {
        tokenBalances: [
          { token: { symbol: "USDC", tokenAddress: "0x" + "3".repeat(40), decimals: 6 }, amount: "10.5" },
        ],
      },
    }),
    createTransaction: async () => ({ data: { id: "tx_1", state: "INITIATED" } }),
    getTransaction: async () => ({ data: { transaction: { id: "tx_1", state: "COMPLETE", txHash: "0xabc" } } }),
    estimateTransferFee: async () => ({ data: { low: {}, medium: {}, high: {} } }),
    accelerateTransaction: async () => ({ data: { id: "tx_1" } }),
    cancelTransaction: async () => ({ data: { state: "CANCELLED" } }),
    appKit: {
      send: async () => ({ state: "success", txHash: "tx_1", explorerUrl: "https://explorer/tx/tx_1" }),
      bridge: async () => ({
        state: "success",
        steps: [
          { name: "burn", txHash: "tx_burn" },
          { name: "mint", txHash: "tx_mint" },
        ],
      }),
      swap: async () => ({ txHash: "tx_swap", amountOut: "9" }),
      estimateSwap: async () => ({ estimatedOutput: { amount: "9" } }),
    },
    adapter: {},
    ...overrides,
  };
}

describe("toBaseUnits", () => {
  it("converts decimal USDC to 6-decimal base units", () => {
    expect(toBaseUnits("1", 6)).toBe("1000000");
    expect(toBaseUnits("0.01", 6)).toBe("10000");
    expect(toBaseUnits("10.5", 6)).toBe("10500000");
    expect(toBaseUnits("0", 6)).toBe("0");
  });
});

describe("createPaymentRequest", () => {
  it("builds an EIP-681 URI on Arc Testnet", () => {
    const req = createPaymentRequest({
      amount: "2.5",
      chain: "ARC-TESTNET",
      destinationAddress: "0x" + "4".repeat(40),
    });
    expect(req.uri).toContain("ethereum:");
    expect(req.uri).toContain("@5042002");
    expect(req.uri).toContain("uint256=2500000");
    expect(req.chain).toBe("ARC-TESTNET");
  });

  it("rejects invalid address", () => {
    expect(() =>
      createPaymentRequest({ amount: "1", chain: "ARC-TESTNET", destinationAddress: "nope" })
    ).toThrow();
  });
});

describe("CircleAgentKit wallets + transfers", () => {
  it("creates a wallet using an auto-created wallet set", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const wallet = await kit.createWallet();
    expect(wallet.id).toBe("w_1");
    expect(wallet.blockchain).toBe("ARC-TESTNET");
  });

  it("reads the USDC balance from token balances", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    expect(await kit.getUsdcBalance("w_1")).toBe("10.5");
  });

  it("sends USDC on testnet without confirmation", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const tx = await kit.sendUSDC({
      walletId: "w_1",
      destinationAddress: "0x" + "5".repeat(40),
      amount: "0.01",
    });
    expect(tx.id).toBe("tx_1");
  });

  it("blocks large transfers without confirm", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    await expect(
      kit.sendUSDC({
        walletId: "w_1",
        destinationAddress: "0x" + "5".repeat(40),
        amount: "500",
      })
    ).rejects.toThrow(/confirmation/i);
  });

  it("allows large transfers when confirmed", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const tx = await kit.sendUSDC({
      walletId: "w_1",
      destinationAddress: "0x" + "5".repeat(40),
      amount: "500",
      confirm: true,
    });
    expect(tx.id).toBe("tx_1");
  });

  it("blocks any mainnet transfer without confirm", async () => {
    const kit = CircleAgentKit.create(
      { ...baseConfig, network: "MAINNET", defaultChain: "BASE-MAINNET" },
      mockClient()
    );
    await expect(
      kit.sendUSDC({ walletId: "w_1", destinationAddress: "0x" + "5".repeat(40), amount: "0.01" })
    ).rejects.toThrow(/MAINNET|confirmation/i);
  });

  it("waits for a transaction to reach terminal state", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const tx = await kit.waitForTransaction("tx_1", { intervalMs: 1, timeoutMs: 1000 });
    expect(tx.state).toBe("COMPLETE");
    expect(tx.explorerUrl).toContain("arcscan");
  });

  it("bridges USDC via App Kit", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const res = await kit.bridgeUSDC({
      toChain: "BASE-MAINNET",
      sourceWalletId: "w_1",
      destWalletId: "w_2",
      amount: "1.0",
      confirm: true,
    });
    expect(res.state).toBe("COMPLETE");
  });

  it("swaps tokens via App Kit", async () => {
    const kit = CircleAgentKit.create(baseConfig, mockClient());
    const res = await kit.swap({
      walletId: "w_1",
      walletAddress: "0x" + "1".repeat(40),
      sellToken: "USDC",
      buyToken: "EURC",
      sellAmount: "1000000",
      confirm: true,
    });
    expect(res.swapTxId).toBe("tx_swap");
  });
});
