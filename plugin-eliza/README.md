# @circle-agent-kit/plugin-eliza

ElizaOS plugin that gives your agent a Circle + Arc wallet: check balances, send
USDC, make gas-free x402 nanopayments, and create USDC payment requests.

## Install

```bash
pnpm add @circle-agent-kit/plugin-eliza @elizaos/core
```

## Configure

Set environment (or character `settings`):

```
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
CIRCLE_WALLET_ID=...        # active wallet for the provider (optional)
X402_PRIVATE_KEY=...        # for nanopayments
```

Register the plugin:

```ts
import { circlePlugin } from "@circle-agent-kit/plugin-eliza";

const runtime = new AgentRuntime({
  character,
  plugins: [circlePlugin],
});
```

## Components

- **Service** `CircleService` — owns one `CircleAgentKit` for the agent.
- **Provider** `CIRCLE_WALLET` — injects wallet address, USDC balance, and action
  routing hints into context (uses `addHeader`, `position: 50`).
- **Actions** — built with the `makeAction` factory in `shared.ts`, so each returns
  a proper ElizaOS `ActionResult` (`success`/`text`/`data`/`error`) and a consistent
  callback (`{ text, content: { success, result } }`). Params are resolved from the
  handler `options`, `message.content.params`, or extracted from chat text:
  - `CIRCLE_CREATE_WALLET`
  - `CIRCLE_CHECK_BALANCE`
  - `CIRCLE_SEND_USDC` (mainnet / large transfers need `confirm: true`)
  - `CIRCLE_REQUEST_USDC`
  - `CIRCLE_PAY_X402`
  - `CIRCLE_GATEWAY_DEPOSIT` (needs `confirm: true`)
  - `CIRCLE_GATEWAY_BALANCE`

Actions accept structured params via the handler `options` or extract them from
the chat message (amount, `0x...` address, URL).
