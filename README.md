# Circle Plugins

Give AI agents a wallet on **Arc** and Circle. One shared SDK, three ready-made plugins:

| Framework | Folder | Package name (future) |
|-----------|--------|------------------------|
| **ElizaOS** | `plugin-eliza/` | `@circle-agent-kit/plugin-eliza` |
| **OpenClaw** | `plugin-openclaw/` | `@circle-plugins/plugin-openclaw` |
| **Hermes** | `hermes/circle-agent-kit/` | copy into `~/.hermes/plugins/` |

Shared cores (same capabilities, different languages):

| Core | Folder | Package name (future) |
|------|--------|------------------------|
| TypeScript | `core-ts/` | `@circle-agent-kit/core` |
| Python | `core-py/` | `circle-agent-kit` (PyPI) |

Agents can create wallets, send USDC, pay for APIs with **x402 nanopayments**, bridge/swap/execute contracts, and use Circle **Agent Wallets** via the Circle CLI.

---

## Repo layout

```
circle-plugins/
├── core-ts/              # TypeScript SDK (Eliza + OpenClaw)
├── core-py/              # Python SDK (Hermes)
├── plugin-eliza/         # ElizaOS plugin
├── plugin-openclaw/      # OpenClaw plugin
├── hermes/
│   └── circle-agent-kit/ # Hermes plugin
└── landing/              # Marketing site (optional)
```

---

## Prerequisites

- **Node.js 20+** and **npm** or **pnpm**
- **Python 3.9+** (Hermes only)
- A [Circle developer account](https://console.circle.com)
- **ElizaOS** project ([elizaos.ai](https://elizaos.ai)) — for Eliza steps below
- **OpenClaw** install — for OpenClaw steps below
- **Hermes Agent** — for Hermes steps below
- Optional: **Circle CLI** for Agent Stack / MPC wallet tools — `npm install -g @circle-fin/cli`

---

## One-time Circle setup

Do this once before running any plugin.

1. Create an API key in the [Circle Console](https://console.circle.com).
2. Generate a 32-byte hex **entity secret** and [register it with Circle](https://developers.circle.com/wallets/dev-controlled/register-entity-secret). The kit never registers it for you.
3. Copy env vars into a `.env` file (in your agent project, or export them in your shell):

```bash
CIRCLE_API_KEY=TEST_API_KEY:your-id:your-secret
ENTITY_SECRET=your-32-byte-hex-secret
CIRCLE_NETWORK=TESTNET
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
```

4. After creating a wallet, fund it via [faucet.circle.com](https://faucet.circle.com) or ask the agent to run **`requestFaucet`** / **`circle_request_faucet`**.

### Optional env vars

| Variable | Purpose |
|----------|---------|
| `CIRCLE_WALLET_SET_ID` | Reuse an existing wallet set |
| `CIRCLE_WALLET_ID` | Default wallet for balance/send actions |
| `X402_PRIVATE_KEY` or `CLIENT_PRIVATE_KEY` | Buyer key for x402 nanopayments |
| `X402_CHAIN` | x402 chain (e.g. `arcTestnet`, `base-sepolia`) |
| `SERVER_ADDRESS` / `SERVER_PRIVATE_KEY` | Seller paywall (Eliza auto-starts server when set) |
| `X402_PAYWALL_URL` | Default paywall URL for `circle_pay_x402` |
| `CIRCLE_CLI_BIN` | Path to `circle` CLI (default: `circle`) |
| `SWAP_API_URL` / `SWAP_API_KEY` | DEX aggregator for SDK-native swaps (mainnet) |
| `CIRCLE_KIT_KEY` | Circle App Kit key for swaps |

---

## Local install (before npm / PyPI)

Packages are **not published yet**. Each plugin depends on a core via `workspace:*`, which only works inside a pnpm monorepo. Until publish, **build the core and wire it in locally**.

You can use either approach:

### Option A — `file:` link (recommended for development)

Point the plugin at the sibling core folder (no copy):

**Eliza** — edit `plugin-eliza/package.json`:

```json
"@circle-agent-kit/core": "file:../core-ts"
```

**OpenClaw** — the plugin imports `@circle-plugins/core`, but the built package is named `@circle-agent-kit/core`. Use the copy steps in Option B for OpenClaw, or vendoring below.

**Hermes** — install the Python core editable (no copy needed):

```bash
cd core-py
pip install -e ".[circle]"
```

### Option B — Copy core folders (self-contained plugins)

Use this when you want to zip a plugin, open a PR, or match the pre-publish layout.

#### TypeScript core → Eliza

```bash
# From repo root (bash)
rm -rf plugin-eliza/vendor/core-ts
cp -r core-ts plugin-eliza/vendor/core-ts
cd core-ts && npm install && npm run build && cd ..
```

Edit `plugin-eliza/package.json`:

```json
"@circle-agent-kit/core": "file:./vendor/core-ts"
```

Then:

```bash
cd plugin-eliza
npm install
npm run build
```

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force plugin-eliza\vendor\core-ts -ErrorAction SilentlyContinue
Copy-Item -Recurse core-ts plugin-eliza\vendor\core-ts
cd core-ts; npm install; npm run build; cd ..
# then edit package.json and run npm install + npm run build in plugin-eliza
```

#### TypeScript core → OpenClaw (rename package on copy)

OpenClaw imports `@circle-plugins/core`. Copy the core and rename the package in the copy:

```bash
rm -rf plugin-openclaw/vendor/core-ts
cp -r core-ts plugin-openclaw/vendor/core-ts
```

Edit `plugin-openclaw/vendor/core-ts/package.json` — change the `"name"` field to:

```json
"name": "@circle-plugins/core"
```

Build the vendored core, then wire the plugin:

```bash
cd plugin-openclaw/vendor/core-ts
npm install
npm run build
cd ../..
```

Edit `plugin-openclaw/package.json`:

```json
"@circle-plugins/core": "file:./vendor/core-ts"
```

Then:

```bash
cd plugin-openclaw
npm install
npm run build
```

#### Python core → Hermes

Either editable install (Option A) **or** copy into the plugin tree:

```bash
rm -rf hermes/circle-agent-kit/vendor/core-py
cp -r core-py hermes/circle-agent-kit/vendor/core-py
pip install -e hermes/circle-agent-kit/vendor/core-py[circle]
```

> **After npm / PyPI publish**, replace local `file:` / copy steps with:
> `npm install @circle-agent-kit/core @circle-agent-kit/plugin-eliza` and
> `pip install circle-agent-kit`.

---

## Build the cores (do this first)

```bash
# TypeScript core
cd core-ts
npm install
npm run build
cd ..

# Python core (Hermes)
cd core-py
pip install -e ".[circle]"
cd ..
```

Run tests (optional, no live keys needed):

```bash
cd core-ts && npm test && cd ..
cd core-py && pytest && cd ..
```

---

## Run on ElizaOS

### Step 1 — Build plugin + core

Follow [Local install](#local-install-before-npm--pypi) for `plugin-eliza` (Option A or B).

### Step 2 — Add plugin to your Eliza project

From your Eliza app directory:

```bash
npm install /absolute/path/to/circle-plugins/plugin-eliza
# or: npm link — see npm link docs
```

Also install the x402 peer dependency if you use nanopayments:

```bash
npm install @circle-fin/x402-batching
```

### Step 3 — Configure environment

Add to your Eliza `.env`:

```bash
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
X402_PRIVATE_KEY=...          # optional — nanopayments
SERVER_ADDRESS=...            # optional — seller paywall
```

### Step 4 — Register the plugin

In your agent entry or character config:

```ts
import { circlePlugin } from "@circle-agent-kit/plugin-eliza";

// AgentRuntime / character plugins array:
plugins: [circlePlugin],
// or in character JSON: "plugins": ["@circle-agent-kit/plugin-eliza"]
```

### Step 5 — Start Eliza

Use your project’s usual start command, for example:

```bash
elizaos start
# or: bun run start / npm run dev
```

### Step 6 — Try it in chat

Example prompts:

- *“Create a new agent wallet on Arc.”*
- *“Check my USDC balance.”*
- *“Request testnet funds from the faucet.”*
- *“Send 0.01 USDC to 0x…”* (needs a funded wallet; mainnet/large amounts need confirmation)

### Eliza actions

| Action | What it does |
|--------|----------------|
| `CIRCLE_CREATE_WALLET` | Create dev-controlled wallet |
| `CIRCLE_CHECK_BALANCE` | Token balances |
| `CIRCLE_SEND_USDC` | Send USDC |
| `CIRCLE_REQUEST_USDC` | Payment request / invoice URI |
| `CIRCLE_PAY_X402` | Pay for x402 resource |
| `CIRCLE_GATEWAY_DEPOSIT` | Fund Gateway for nanopayments |
| `CIRCLE_GATEWAY_BALANCE` | Gateway balance |
| `CIRCLE_REQUEST_FAUCET` | Programmatic testnet faucet |

See `plugin-eliza/README.md` for the paywalled Express server.

---

## Run on OpenClaw

### Step 1 — Build plugin + core

Follow [Local install](#local-install-before-npm--pypi) for `plugin-openclaw` (**Option B** — copy + rename to `@circle-plugins/core`).

### Step 2 — Install the plugin

From your OpenClaw workspace:

```bash
openclaw plugins install /absolute/path/to/circle-plugins/plugin-openclaw
```

Or copy the built folder into your OpenClaw extensions/plugins directory (layout depends on your OpenClaw version).

### Step 3 — Configure environment

Set in OpenClaw config or shell:

```bash
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
X402_PRIVATE_KEY=...
X402_PAYWALL_URL=http://localhost:4021/risk-profile   # optional default for pay_x402
```

The plugin manifest `openclaw.plugin.json` lists all supported config keys.

### Step 4 — Enable the plugin

```bash
openclaw plugins enable circle-plugins
# plugin id in openclaw.plugin.json
```

Restart OpenClaw if required.

### Step 5 — Approve money-moving tools

Safe tools (wallet create, balance, faucet info) are always on. These require **explicit user opt-in** in OpenClaw:

- `circle_send_usdc`
- `circle_pay_x402`
- `circle_gateway_deposit`
- `circle_execute_contract`, `circle_bridge_usdc`, `circle_swap`
- `circle_agent_*` transfer/bridge/swap/execute tools

Mainnet or large transfers also need `confirm: true` in the tool call.

### Step 6 — Try it

Ask your agent, for example:

- *“Create a Circle wallet on Arc testnet.”*
- *“What’s my gateway balance?”*
- *“Pay for the x402 resource at …”*

Full tool list: `plugin-openclaw/README.md` and `openclaw.plugin.json`.

---

## Run on Hermes Agent

### Step 1 — Install the Python core

From repo root:

```bash
cd core-py
pip install -e ".[circle]"
cd ..
```

Or use the [copy steps](#python-core--hermes) under Option B.

Hermes nanopayments use the **Circle CLI** on Python (`circle gateway …`, `circle pay …`). Install if needed:

```bash
npm install -g @circle-fin/cli
```

### Step 2 — Copy the Hermes plugin

```bash
# bash / macOS / Linux
mkdir -p ~/.hermes/plugins
cp -r hermes/circle-agent-kit ~/.hermes/plugins/circle-plugins
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.hermes\plugins"
Copy-Item -Recurse hermes\circle-agent-kit "$env:USERPROFILE\.hermes\plugins\circle-plugins"
```

### Step 3 — Enable in Hermes config

Edit `~/.hermes/config.yaml`:

```yaml
plugins:
  enabled:
    - circle-plugins
```

### Step 4 — Set environment

Export or add to your shell profile:

```bash
export CIRCLE_API_KEY=...
export ENTITY_SECRET=...
export CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
export X402_PRIVATE_KEY=...    # optional
```

### Step 5 — Verify and chat

```bash
hermes circle status
hermes chat
```

In chat:

- `/circle status` — plugin + env check
- `/circle help` — list tools
- Ask naturally: *“Create a wallet and check my balance.”*

### Hermes tools (toolset `circle`)

`circle_create_wallet`, `circle_check_balance`, `circle_send_usdc`, `circle_request_usdc`, `circle_pay_x402`, `circle_gateway_deposit`, `circle_gateway_balance`, `circle_faucet_info`, `circle_request_faucet`, `circle_execute_contract`, `circle_bridge_usdc`, `circle_swap_quote`, `circle_swap`, `circle_services_search`, `circle_services_inspect`.

---

## Circle CLI (Agent Stack) — optional

For **user-custody MPC Agent Wallets** (separate from dev-controlled SDK wallets):

```bash
npm install -g @circle-fin/cli
```

Typical flow via agent tools / SDK:

1. `agentLoginInit(email)` → OTP sent  
2. `agentLoginComplete(requestId, otp)` → wallets provisioned  
3. `agentFund` / `agentTransfer` / `agentBridge` / `agentSwap` / `agentExecuteContract`

Set `CIRCLE_CLI_BIN` if the binary is not on your `PATH`.

---

## What the SDK can do

| Area | Examples |
|------|----------|
| Wallets | `createWallet`, `getBalance`, `listWallets` |
| Transfers | `sendUSDC`, `estimateFee`, `waitForTransaction` |
| x402 | `payX402`, `gatewayDeposit`, `requirePayment` |
| Requests | `createPaymentRequest`, `requestFaucet` |
| DeFi (SDK) | `executeContract`, `bridgeUSDC`, `swap` |
| Agent CLI | `agentLogin*`, `agentTransfer`, `agentBridge`, … |
| Chains | Arc Testnet default + multi-chain registry |

Two wallet models:

- **Dev-controlled** (SDK) — app-owned agent treasury  
- **Agent Wallets** (CLI) — user-owned MPC wallets  

---

## Security

- Never commit `.env`, `*.pem`, or recovery files.
- Defaults to **TESTNET**. Mainnet and transfers above the confirm threshold (default **100 USDC**) require `confirm: true`.
- Contract execution always requires explicit confirmation.
- Mutating calls use unique idempotency keys; transfers can poll to a terminal state.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `workspace:*` install fails | Use [local install](#local-install-before-npm--pypi) — `file:` path or copy core |
| OpenClaw cannot find `@circle-plugins/core` | Copy core + rename package (OpenClaw Option B) |
| Hermes `circle_agent_kit not installed` | `pip install -e core-py[circle]` from repo root |
| Wallet actions fail | Check `CIRCLE_API_KEY` + `ENTITY_SECRET`; entity secret must be registered |
| Nanopayments fail | Set `X402_PRIVATE_KEY`; on Python/Hermes install Circle CLI |
| Empty balance | Fund via faucet or `circle_request_faucet` |

---

## Per-package docs

- `core-ts/README.md` — TypeScript SDK API  
- `core-py/README.md` — Python SDK API  
- `plugin-eliza/README.md` — Eliza actions + paywall server  
- `plugin-openclaw/README.md` — OpenClaw tools  
- `hermes/circle-agent-kit/README.md` — Hermes plugin details  

---

This project uses Circle’s official SDKs. Provided **as is** — review the [Circle Developer Terms](https://console.circle.com/legal/developer-terms).
