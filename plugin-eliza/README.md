# @circle-agent-kit/plugin-eliza

ElizaOS plugin for Circle + Arc agent wallets: USDC transfers, x402 nanopayments, and payment requests.

## Install

```bash
pnpm add @circle-agent-kit/plugin-eliza @elizaos/core
```

## Configure

Set environment (or character `settings`):

```
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=arcTestnet
CLIENT_PRIVATE_KEY=...      # for nanopayments (buyer)
SERVER_ADDRESS=...          # for paywalled server (seller)
```

Register the plugin:

```ts
import { circlePlugin } from "@circle-agent-kit/plugin-eliza";

const runtime = new AgentRuntime({
  character,
  plugins: [circlePlugin],
});
```

## Actions

- **CIRCLE_CREATE_WALLET** — Create a new Circle developer-controlled agent wallet.
- **CIRCLE_CHECK_BALANCE** — Check USDC (and other token) balances for an agent wallet.
- **CIRCLE_SEND_USDC** — Send USDC from an agent wallet to a destination address.
- **CIRCLE_REQUEST_USDC** — Create a USDC payment request (invoice + EIP-681 URI).
- **CIRCLE_PAY_X402** — Pay for an x402-compatible resource with a gas-free USDC nanopayment via Circle Gateway.
- **CIRCLE_GATEWAY_DEPOSIT** — Deposit USDC into the Circle Gateway balance to fund future x402 nanopayments.
- **CIRCLE_GATEWAY_BALANCE** — Check the Circle Gateway (nanopayments) USDC balance.
- **CIRCLE_REQUEST_FAUCET** — Request free testnet USDC/gas from the Circle faucet.

## Service

- **CircleService** — owns the `CircleAgentKit` for the agent.

## Paywalled Server

The plugin includes a utility to start a paywalled Express server:

```ts
import { CircleService } from "@circle-agent-kit/plugin-eliza";
import { startPaywalledServer } from "@circle-agent-kit/plugin-eliza/server";

const service = runtime.getService(CircleService.serviceType);
await startPaywalledServer(service.kit, 4021);
```
