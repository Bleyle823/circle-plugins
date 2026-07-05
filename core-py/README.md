# circle_agent_kit (Python)

Python mirror of `@circle-agent-kit/core`. Powers the Hermes Agent plugin and
exposes the same capability surface (snake_case method names).

```python
from circle_agent_kit import CircleAgentKit

kit = CircleAgentKit.create()  # reads env: CIRCLE_API_KEY, ENTITY_SECRET, ...

wallet = kit.create_wallet(chain="ARC-TESTNET")
print(kit.faucet_info()["faucetUrl"])       # fund at faucet.circle.com

balance = kit.get_usdc_balance(wallet["id"])
tx = kit.send_usdc(wallet["id"], "0x...", "0.01", wait=True)
request = kit.create_payment_request("5", wallet["address"])
```

## Install

```bash
pip install -e .            # core only
pip install -e ".[circle]"  # + official Circle SDK for live calls
pip install -e ".[dev]"     # + pytest / ruff
```

## Parity notes

- Method surface matches the TS core (wallets, transfers, requests, nanopayments).
- **Nanopayments**: the `@circle-fin/x402-batching` SDK is JS-only, so on Python
  nanopayments route through the Circle CLI (`circle gateway ...`, `circle pay ...`).
  The tool surface for Hermes is identical regardless of transport.

## Test

```bash
pytest        # uses an injected mock client — no live keys needed
```
