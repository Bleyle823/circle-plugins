# @circle-agent-kit/core

Unified TypeScript SDK for Circle + Arc agent wallets. Powers the ElizaOS and
OpenClaw plugins; mirrored by the Python `circle_agent_kit` core (for Hermes).

```ts
import { CircleAgentKit } from "@circle-agent-kit/core";

const kit = CircleAgentKit.create(); // reads env (CIRCLE_API_KEY, ENTITY_SECRET, ...)

const wallet = await kit.createWallet({ chain: "ARC-TESTNET" });
console.log(kit.faucetInfo().faucetUrl); // fund it manually at faucet.circle.com
await kit.requestFaucet({ walletId: wallet.id }); // or self-serve via the faucet API

const balance = await kit.getUsdcBalance(wallet.id);

const tx = await kit.sendUSDC({
  walletId: wallet.id,
  destinationAddress: "0x...",
  amount: "0.01",
  wait: true,
});

const request = kit.createPaymentRequest({ amount: "5", destinationAddress: wallet.address });

// Nanopayments (needs @circle-fin/x402-batching + X402_PRIVATE_KEY)
await kit.gatewayDeposit("1.00", true);
const paid = await kit.payX402("https://api.example.com/resource");
```

## Capabilities

- **Wallets**: `createWalletSet`, `createWallet`, `listWallets`, `getAddress`, `getBalance`, `getUsdcBalance`
- **Transfers**: `estimateFee`, `sendUSDC`, `getTransaction`, `waitForTransaction`, `accelerateTransaction`, `cancelTransaction`
- **Nanopayments (x402)**: `gatewayDeposit`, `payX402`, `gatewayBalance`, `gatewayWithdraw`, `requirePayment`
- **Requests**: `createPaymentRequest`, `faucetInfo`, `requestFaucet` (testnet only, calls Circle's `/v1/faucet/drips`)
- **Chains**: `listChains`, `getChain` (Arc Testnet default)

## Guardrails

- Validates addresses/amounts; unique idempotency key per mutating call.
- Mainnet and transfers above `confirmThresholdUsdc` (default 100) require `confirm: true`.
- Balances always come from `getWalletTokenBalance` (never `getWallet`).

## Testing

```bash
pnpm test   # vitest, uses an injected mock client — no live keys needed
```
