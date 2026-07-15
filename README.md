# Circle Plugins

Give AI agents a wallet on **Arc** and Circle. One shared SDK, three ready-made plugins:

| Framework | Folder | Package |
|-----------|--------|---------|
| **ElizaOS** | `plugin-eliza/` | `@circle-plugins/plugin-eliza` |
| **OpenClaw** | `plugin-openclaw/` | `@circle-plugins/plugin-openclaw` |
| **Hermes** | `hermes/circle-plugins/` | copy into `~/.hermes/plugins/` |

Shared cores (same capabilities, different languages):

| Core | Folder | Package |
|------|--------|---------|
| TypeScript | `core-ts/` | [`@circle-plugins/core`](https://www.npmjs.com/package/@circle-plugins/core) |
| Python | `core-py/` | `circle-plugins` (PyPI) |

Agents can create wallets, send USDC, pay for APIs with **x402 nanopayments**, bridge/swap/execute contracts, and use Circle **Agent Wallets** via the Circle CLI.

---

## Quick install

The TypeScript core is published on npm. Plugins depend on `@circle-plugins/core@0.1.0`.

```bash
# TypeScript SDK
npm install @circle-plugins/core@0.1.0

# ElizaOS plugin (uses published core)
npm install @circle-plugins/plugin-eliza @circle-plugins/core@0.1.0

# OpenClaw plugin (uses published core)
pnpm add @circle-plugins/plugin-openclaw @circle-plugins/core@0.1.0

# Python core (Hermes)
pip install circle-plugins[circle]
```

For Hermes, copy the plugin into your Hermes plugins directory:

```bash
cp -r hermes/circle-plugins ~/.hermes/plugins/circle-plugins
```

**Windows (PowerShell):**

```powershell
Copy-Item -Recurse hermes\circle-plugins "$env:USERPROFILE\.hermes\plugins\circle-plugins"
```

---

## Repo layout

```
circle-plugins/
├── core-ts/              # TypeScript SDK (Eliza + OpenClaw)
├── core-py/              # Python SDK (Hermes)
├── plugin-eliza/         # ElizaOS plugin (8 actions)
├── plugin-openclaw/      # OpenClaw plugin (26 tools)
├── hermes/
│   └── circle-plugins/   # Hermes plugin (15 tools)
├── eliza-town-main/      # Full Arc + Eliza Town demo (includes eliza-server)
├── arc-town example/     # Earlier Arc Town upload (UI/Convex slice)
└── landing/              # Marketing site
```

### Eliza Town demo (`eliza-town-main/`)

Pixel-art town powered by [ElizaOS](https://elizaos.ai) + [Convex](https://convex.dev), wired to the Circle plugin so agents can hold wallets on Arc. Prefer this folder for local development (it includes `eliza-server/`). See `eliza-town-main/README.md` for setup.

```bash
cd eliza-town-main
cp .env.example .env          # then fill Circle + LLM keys (never commit .env)
npm install
npm run setup                 # sync env into Convex / Eliza server
npm run dev
```

Secrets and local notes stay out of git: `.env`, `.env.local`, `eliza-server/.env`, `ASSETS_LICENSES.md`, and `ARCHITECTURE.md` are gitignored.

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

## Local development (this repo)

Use this when contributing to or building from source instead of npm/PyPI.

### TypeScript core

```bash
cd core-ts
npm install
npm run build
npm test
```

### Plugins (link to local core)

Plugins in this repo pin `@circle-plugins/core@0.1.0` from npm. To develop core and plugins together, temporarily point at the sibling folder:

```json
"@circle-plugins/core": "file:../core-ts"
```

Then rebuild:

```bash
cd plugin-eliza && npm install && npm run build
cd plugin-openclaw && npm install && npm run build
```

### Python core

```bash
cd core-py
pip install -e ".[circle]"
pytest
```

### Vendoring (self-contained plugin folders)

Use when you need a plugin folder that bundles its own core copy (e.g. for zipping or PRs).

**Eliza / OpenClaw** — copy `core-ts` into `vendor/core-ts`, set `"@circle-plugins/core": "file:./vendor/core-ts"`, then `npm install && npm run build`.

**Hermes** — copy `core-py` into `hermes/circle-plugins/vendor/core-py`, then `pip install -e hermes/circle-plugins/vendor/core-py[circle]`.

---

## Run on ElizaOS

### Step 1 — Install

From your Eliza app directory:

```bash
npm install @circle-plugins/plugin-eliza @circle-plugins/core@0.1.0
```

Or install from this repo:

```bash
npm install /absolute/path/to/circle-plugins/plugin-eliza
```

Also install the x402 peer dependency if you use nanopayments:

```bash
npm install @circle-fin/x402-batching
```

### Step 2 — Configure environment

Add to your Eliza `.env`:

```bash
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
X402_PRIVATE_KEY=...          # optional — nanopayments
SERVER_ADDRESS=...            # optional — seller paywall
```

### Step 3 — Register the plugin

In your agent entry or character config:

```ts
import { circlePlugin } from "@circle-plugins/plugin-eliza";

// AgentRuntime / character plugins array:
plugins: [circlePlugin],
// or in character JSON: "plugins": ["@circle-plugins/plugin-eliza"]
```

### Step 4 — Start Eliza

Use your project's usual start command, for example:

```bash
elizaos start
# or: bun run start / npm run dev
```

### Step 5 — Try it in chat

Example prompts:

- *"Create a new agent wallet on Arc."*
- *"Check my USDC balance."*
- *"Request testnet funds from the faucet."*
- *"Send 0.01 USDC to 0x…"* (needs a funded wallet; mainnet/large amounts need confirmation)

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

### Step 1 — Install

From your OpenClaw workspace:

```bash
pnpm add @circle-plugins/plugin-openclaw @circle-plugins/core@0.1.0
```

Or install from this repo:

```bash
openclaw plugins install /absolute/path/to/circle-plugins/plugin-openclaw
```

### Step 2 — Configure environment

Set in OpenClaw config or shell:

```bash
CIRCLE_API_KEY=...
ENTITY_SECRET=...
CIRCLE_DEFAULT_CHAIN=ARC-TESTNET
X402_PRIVATE_KEY=...
X402_PAYWALL_URL=http://localhost:4021/risk-profile   # optional default for pay_x402
```

The plugin manifest `openclaw.plugin.json` lists all supported config keys.

### Step 3 — Enable the plugin

```bash
openclaw plugins enable circle-plugins
# plugin id in openclaw.plugin.json
```

Restart OpenClaw if required.

### Step 4 — Approve money-moving tools

Safe tools (wallet create, balance, faucet info) are always on. These require **explicit user opt-in** in OpenClaw:

- `circle_send_usdc`
- `circle_pay_x402`
- `circle_gateway_deposit`
- `circle_execute_contract`, `circle_bridge_usdc`, `circle_swap`
- `circle_agent_*` transfer/bridge/swap/execute tools

Mainnet or large transfers also need `confirm: true` in the tool call.

### Step 5 — Try it

Ask your agent, for example:

- *"Create a Circle wallet on Arc testnet."*
- *"What's my gateway balance?"*
- *"Pay for the x402 resource at …"*

Full tool list: `plugin-openclaw/README.md` and `openclaw.plugin.json`.

---

## Run on Hermes Agent

### Step 1 — Install the Python core

```bash
pip install circle-plugins[circle]
```

For local development from this repo:

```bash
cd core-py
pip install -e ".[circle]"
```

Hermes nanopayments use the **Circle CLI** on Python (`circle gateway …`, `circle pay …`). Install if needed:

```bash
npm install -g @circle-fin/cli
```

### Step 2 — Copy the Hermes plugin

```bash
# bash / macOS / Linux
mkdir -p ~/.hermes/plugins
cp -r hermes/circle-plugins ~/.hermes/plugins/circle-plugins
```

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.hermes\plugins"
Copy-Item -Recurse hermes\circle-plugins "$env:USERPROFILE\.hermes\plugins\circle-plugins"
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
- Ask naturally: *"Create a wallet and check my balance."*

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

### TypeScript SDK example

```ts
import { CircleAgentKit } from "@circle-plugins/core";

const kit = CircleAgentKit.create();
const wallet = await kit.createWallet({ chain: "ARC-TESTNET" });
await kit.sendUSDC({
  walletId: wallet.id,
  destinationAddress: "0x...",
  amount: "0.01",
});
```

---

## Security

- Never commit `.env`, `.env.local`, `*.pem`, or recovery files (root `.gitignore` blocks them).
- Local `ASSETS_LICENSES.md` / `ARCHITECTURE.md` notes are also gitignored — keep licensing attributions in package READMEs if they must ship.
- Defaults to **TESTNET**. Mainnet and transfers above the confirm threshold (default **100 USDC**) require `confirm: true`.
- Contract execution always requires explicit confirmation.
- Mutating calls use unique idempotency keys; transfers can poll to a terminal state.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Scope not found` on `npm publish` | Create the `@circle-plugins` org at [npmjs.com/org/create](https://www.npmjs.com/org/create) |
| Cannot resolve `@circle-plugins/core` | Run `npm install @circle-plugins/core@0.1.0` in your app or plugin folder |
| OpenClaw cannot find `@circle-plugins/core` | `pnpm add @circle-plugins/core@0.1.0` then rebuild the plugin |
| Hermes `circle_agent_kit not installed` | `pip install circle-plugins[circle]` or `pip install -e core-py[circle]` from repo root |
| Wallet actions fail | Check `CIRCLE_API_KEY` + `ENTITY_SECRET`; entity secret must be registered |
| Nanopayments fail | Set `X402_PRIVATE_KEY`; on Python/Hermes install Circle CLI |
| Empty balance | Fund via faucet or `circle_request_faucet` |

---

## Per-package docs

- `core-ts/README.md` — TypeScript SDK API  
- `core-py/README.md` — Python SDK API  
- `plugin-eliza/README.md` — Eliza actions + paywall server  
- `plugin-openclaw/README.md` — OpenClaw tools  
- `hermes/circle-plugins/README.md` — Hermes plugin details  

---

This project uses Circle's official SDKs. Provided **as is** — review the [Circle Developer Terms](https://console.circle.com/legal/developer-terms).
