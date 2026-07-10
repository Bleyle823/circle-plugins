import { describe, expect, it, vi } from "vitest";
import type { IAgentRuntime, Memory } from "@elizaos/core";
import { allActions } from "../src/actions.js";
import { CircleService } from "../src/service.js";
import { CircleAgentKit } from "@circle-plugins/core";

// Mock the core kit
const mockKit = {
  createWallet: vi.fn().mockResolvedValue({ id: "w_1", address: "0x1", blockchain: "ARC-TESTNET" }),
  getBalance: vi.fn().mockResolvedValue([{ symbol: "USDC", amount: "10.5" }]),
  sendUSDC: vi.fn().mockResolvedValue({ id: "tx_1", state: "COMPLETE" }),
  createPaymentRequest: vi.fn().mockReturnValue({ amount: "1", chain: "ARC-TESTNET", uri: "ethereum:..." }),
  payX402: vi.fn().mockResolvedValue({ url: "https://api.example.com", amount: "0.01" }),
  gatewayDeposit: vi.fn().mockResolvedValue({ amount: "5" }),
  gatewayBalance: vi.fn().mockResolvedValue({ available: "5" }),
  executeContract: vi.fn().mockResolvedValue({ id: "tx_exec", state: "COMPLETE" }),
  bridgeUSDC: vi.fn().mockResolvedValue({ state: "COMPLETE", amount: "10", fromChain: "BASE", toChain: "ARB", burnTxHash: "0x1", mintTxHash: "0x2" }),
  swapQuote: vi.fn().mockResolvedValue({ sellAmount: "10", buyAmount: "9", sellToken: "USDC", buyToken: "EURC" }),
  swap: vi.fn().mockResolvedValue({ swapTxId: "tx_swap", quote: { sellAmount: "10", buyAmount: "9", sellToken: "USDC", buyToken: "EURC" } }),
  servicesSearch: vi.fn().mockResolvedValue({ data: { services: [{ name: "Domain Search", url: "https://api.example.com/domain", price: "$0.30" }] } }),
  servicesInspect: vi.fn().mockResolvedValue({ data: { name: "Domain Search", url: "https://api.example.com/domain", price: "$0.30", method: "POST", schema: {} } }),
};

// Mock Runtime
const mockRuntime = {
  getService: vi.fn().mockReturnValue({ kit: mockKit }),
  getSetting: vi.fn().mockReturnValue("test"),
} as unknown as IAgentRuntime;

describe("Eliza Plugin Actions", () => {
  it("CIRCLE_CREATE_WALLET creates a wallet", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_CREATE_WALLET")!;
    const message: Memory = { content: { text: "create a wallet" } } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.createWallet).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Created wallet w_1")
    }));
  });

  it("CIRCLE_CHECK_BALANCE checks balance", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_CHECK_BALANCE")!;
    const message: Memory = { content: { text: "check balance for w_1", params: { walletId: "w_1" } } } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.getBalance).toHaveBeenCalledWith("w_1");
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Balance: 10.5 USDC")
    }));
  });

  it("CIRCLE_SEND_USDC sends USDC", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_SEND_USDC")!;
    const message: Memory = { 
      content: { 
        text: "send 0.5 USDC to 0x123", 
        params: { walletId: "w_1", destinationAddress: "0x" + "1".repeat(40), amount: "0.5" } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.sendUSDC).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Sent 0.5 USDC")
    }));
  });

  it.skip("CIRCLE_BRIDGE_USDC bridges USDC", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_BRIDGE_USDC")!;
    const message: Memory = { 
      content: { 
        text: "bridge 10 USDC from w_1 to w_2", 
        params: { toChain: "ARB", sourceWalletId: "w_1", destWalletId: "w_2", amount: "10", confirm: true } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.bridgeUSDC).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Bridged 10 USDC")
    }));
  });

  it.skip("CIRCLE_SWAP executes a swap", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_SWAP")!;
    const message: Memory = { 
      content: { 
        text: "swap 10 USDC for EURC", 
        params: { walletId: "w_1", walletAddress: "0x1", sellToken: "USDC", buyToken: "EURC", sellAmount: "10", confirm: true } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.swap).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Swap submitted")
    }));
  });

  it("CIRCLE_REQUEST_USDC creates a payment request", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_REQUEST_USDC")!;
    const message: Memory = { 
      content: { 
        text: "request 1 USDC", 
        params: { amount: "1", destinationAddress: "0x1" } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.createPaymentRequest).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Payment request for 1 USDC")
    }));
  });

  it("CIRCLE_PAY_X402 pays via nanopayment", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_PAY_X402")!;
    const message: Memory = { 
      content: { 
        text: "pay https://api.example.com", 
        params: { url: "https://api.example.com" } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.payX402).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Paid https://api.example.com")
    }));
  });

  it("CIRCLE_GATEWAY_DEPOSIT deposits to gateway", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_GATEWAY_DEPOSIT")!;
    const message: Memory = { 
      content: { 
        text: "deposit 5 USDC to gateway", 
        params: { amount: "5", confirm: true } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.gatewayDeposit).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Deposited 5 USDC")
    }));
  });

  it("CIRCLE_GATEWAY_BALANCE checks gateway balance", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_GATEWAY_BALANCE")!;
    const message: Memory = { content: { text: "check gateway balance" } } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.gatewayBalance).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Gateway balance: 5 USDC")
    }));
  });

  it.skip("CIRCLE_EXECUTE_CONTRACT executes contract", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_EXECUTE_CONTRACT")!;
    const message: Memory = { 
      content: { 
        text: "execute contract 0xContract", 
        params: { walletId: "w_1", contractAddress: "0xContract", confirm: true } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.executeContract).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Contract execution tx_exec")
    }));
  });

  it.skip("CIRCLE_SWAP_QUOTE gets a swap quote", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_SWAP_QUOTE")!;
    const message: Memory = { 
      content: { 
        text: "quote swap 10 USDC to EURC", 
        params: { sellToken: "USDC", buyToken: "EURC", sellAmount: "10", takerAddress: "0x1" } 
      } 
    } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.swapQuote).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Quote: 10 USDC -> 9 EURC")
    }));
  });

  it.skip("CIRCLE_SERVICES_SEARCH searches marketplace", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_SERVICES_SEARCH")!;
    const message: Memory = { content: { text: "search for domains", params: { query: "domain" } } } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.servicesSearch).toHaveBeenCalledWith(expect.objectContaining({ query: "domain" }));
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Found 1 services")
    }));
  });

  it.skip("CIRCLE_SERVICES_INSPECT inspects a service", async () => {
    const action = allActions.find(a => a.name === "CIRCLE_SERVICES_INSPECT")!;
    const message: Memory = { content: { text: "inspect https://api.example.com/domain", params: { url: "https://api.example.com/domain" } } } as any;
    const callback = vi.fn();
    
    await action.handler(mockRuntime, message, {}, {}, callback);
    
    expect(mockKit.servicesInspect).toHaveBeenCalledWith(expect.objectContaining({ url: "https://api.example.com/domain" }));
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Service: Domain Search")
    }));
  });
});
