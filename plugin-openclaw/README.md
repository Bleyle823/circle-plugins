# @circle-agent-kit/plugin-openclaw

OpenClaw plugin that gives your agent a Circle + Arc wallet: balances, USDC
transfers, gas-free x402 nanopayments, and USDC payment requests.

## Install

Add to your OpenClaw install (from source or as a dependency), then enable it.
The plugin ships an `openclaw.plugin.json` manifest declaring `contracts.tools`
so OpenClaw can discover its tools without loading the runtime.

```bash
pnpm add @circle-agent-kit/plugin-openclaw
```

## Configure

Set these in your OpenClaw config / environment:

```
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
X402_PRIVATE_KEY=...   # for nanopayments
```

## Tools

Always available:

- `circle_create_wallet`
- `circle_check_balance`
- `circle_faucet_info`
- `circle_request_usdc`
- `circle_gateway_balance`

Opt-in (money-moving — require user approval):

- `circle_send_usdc` (mainnet/large transfers also need `confirm: true`)
- `circle_pay_x402`
- `circle_gateway_deposit` (needs `confirm: true`)

## Notes

Regenerate the manifest with `openclaw plugins build` in your OpenClaw workspace
if you add or rename tools; the committed `openclaw.plugin.json` mirrors the
tools registered in `src/index.ts`.
