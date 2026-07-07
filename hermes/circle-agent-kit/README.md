# Circle Plugins — Hermes plugin

Gives Hermes Agent a Circle + Arc wallet: balances, USDC transfers, gas-free
x402 nanopayments, testnet faucet funding, and USDC payment requests.

Follows the [Hermes plugin guide](https://hermes-agent.nousresearch.com/docs/) layout:

```
~/.hermes/plugins/circle-plugins/
├── plugin.yaml          # manifest (tools, hooks, env requirements)
├── __init__.py          # register(ctx) — wiring + hooks + commands + skills
├── schemas.py           # tool schemas the LLM reads
├── tools.py             # handlers (args, **kwargs) -> JSON string
├── params.py            # x402 paywall helpers
├── README.md
└── skills/
    └── circle-wallets/
        └── SKILL.md     # bundled skill (skill_view("circle-plugins:circle-wallets"))
```

## Install (this Hermes setup)

1. Install the Python core into the Hermes venv:

```bash
/usr/local/lib/hermes-agent/venv/bin/pip install -e ~/.hermes/core-py[circle]
```

2. Plugin lives at `~/.hermes/plugins/circle-plugins/` (source: `~/.hermes/hermes/circle-agent-kit/`).

3. Enable it in `~/.hermes/config.yaml`:

```yaml
plugins:
  enabled:
    - circle-plugins
```

4. Set env in `~/.hermes/.env`: `CIRCLE_API_KEY`, `ENTITY_SECRET`.
   Optional: `X402_PRIVATE_KEY`, `CIRCLE_DEFAULT_CHAIN`, `CIRCLE_NETWORK`.

## What you get

- **Tools** (toolset `circle`, 15 tools) — gated by `check_fn` when credentials missing
- **Hook** — `post_tool_call` logs Circle tool invocations
- **Slash command** — `/circle status|help|log`
- **CLI** — `hermes circle status|log`
- **Bundled skill** — `skill_view("circle-plugins:circle-wallets")`

## Guardrails

Mainnet and large transfers require `confirm: true`. Handlers always return JSON
strings and never raise. The SDK client uses `lazy_singleton` for thread safety.
