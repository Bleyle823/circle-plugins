# Circle Plugins — Hermes plugin

Gives Hermes Agent a Circle + Arc wallet: balances, USDC transfers, gas-free
x402 nanopayments, testnet faucet funding, and USDC payment requests.

## Install

1. Install the Python core (shared logic):

```bash
pip install -e packages/core-py            # from the circle-agent-kit repo
pip install -e "packages/core-py[circle]"  # + official Circle SDK for live calls
```

2. Copy this plugin into your Hermes plugins dir:

```bash
cp -r plugins/hermes/circle-agent-kit ~/.hermes/plugins/circle-plugins
```

3. Enable it (plugins are disabled by default). In `~/.hermes/config.yaml`:

```yaml
plugins:
  enabled:
    - circle-plugins
```

4. Set env: `CIRCLE_API_KEY`, `ENTITY_SECRET` (and `X402_PRIVATE_KEY` for nanopayments).
   Optional: `X402_PAYWALL_URL` or `X402_PAYWALL_PORT` for the default local paywall.

## What you get

- **Tools** (toolset `circle`): `circle_create_wallet`, `circle_check_balance`,
  `circle_faucet_info`, `circle_request_faucet`, `circle_send_usdc`, `circle_request_usdc`,
  `circle_pay_x402`, `circle_gateway_deposit`, `circle_gateway_balance`.
- **Slash command**: `/circle status` (in-session).
- **CLI command**: `hermes circle status`.

## Guardrails

Mainnet and large transfers require `confirm: true`. Balances come from Circle's
token-balance endpoint. Nanopayments route through the Circle CLI on Python
(`circle gateway ...`) — install it from the Circle Agent Stack if you use them.
