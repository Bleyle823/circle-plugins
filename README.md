# Circle Plugins

A unified **agent-wallet SDK** for Circle + Arc, plus ready-to-use plugins for three
agent frameworks: **ElizaOS**, **OpenClaw**, and **Hermes Agent**.

One capability surface wraps Circle's Agent Stack so any agent can:

- Create and manage **developer-controlled agent wallets**
- Check balances and **send USDC**
- Make **x402 nanopayments** — gas-free, sub-cent, batched via Circle Gateway
- **Request USDC** (payment requests / invoices + testnet faucet API)
- Operate on **Arc Testnet** (USDC-as-gas) and other EVM chains
- Drive Circle **Agent Wallets** (user-custody MPC) via the Circle CLI:
  **authenticate, fund, transfer, bridge (CCTP), swap, execute contract**

## Why two cores?

Eliza and OpenClaw are TypeScript; Hermes is Python. So the kit ships a TypeScript
core (`@circle-plugins/core`) and a mirrored Python core (`circle_agent_kit`) that
expose the **same named capabilities and config contract**. The framework plugins are
thin adapters over their language's core.

```
packages/
  core-circle/     @circle-plugins/core           (TS unified SDK)
  plugin-circle/   @circle-plugins/plugin-eliza
  plugin-openclaw/ @circle-plugins/plugin-openclaw
  core-py/         circle_agent_kit               (Python unified SDK)
plugins/
  hermes/circle-agent-kit/                          (Hermes plugin)
examples/          per-framework runnable examples
```

## Capability surface (identical across TS + Python)

| Area | Methods |
|------|---------|
| Wallets | `createWalletSet`, `createWallet`, `listWallets`, `getAddress`, `getBalance` |
| Transfers | `estimateFee`, `sendUSDC`, `getTransaction`, `waitForTransaction`, `accelerateTransaction`, `cancelTransaction` |
| Nanopayments (x402) | `gatewayDeposit`, `payX402`, `gatewayBalance`, `gatewayWithdraw`, `requirePayment` (seller) |
| Requests | `createPaymentRequest`, `faucetInfo`, `requestFaucet` |
| Contracts / Bridge / Swap (SDK) | `executeContract`, `bridgeUSDC` (CCTP v2), `getBridgeAttestation`, `swapQuote`, `swap` |
| Agent Stack (CLI) | `agentLoginInit`/`agentLoginComplete`, `agentListWallets`, `agentBalance`, `agentFund`, `agentTransfer`, `agentBridgeFee`/`agentBridge`/`agentBridgeStatus`, `agentSwapQuote`/`agentSwap`, `agentContractAddress`, `agentExecuteContract` |
| Chains | Arc Testnet + multi-chain registry (`listChains`, `getChain`) |

### SDK-native contract execution, bridge, and swap

These give you the CLI Agent Stack's execute/bridge/swap **without the CLI**,
using the same developer-controlled wallet as the rest of the kit:

- **`executeContract`** — arbitrary contract writes via Circle's
  `createContractExecutionTransaction` (`abiFunctionSignature` + `abiParameters`,
  or raw `callData`). Always requires `confirm`.
- **`bridgeUSDC`** — full CCTP v2 flow (approve → `depositForBurn` → poll Circle's
  attestation API → `receiveMessage`). Needs a source wallet on `fromChain` and a
  destination wallet on `toChain`. Standard (non-fast) transfer by default.
- **`swap`** — Circle has no first-party SDK swap, so this uses a configured DEX
  aggregator (0x-compatible: set `SWAP_API_URL` + `SWAP_API_KEY`) for the quote and
  calldata, then executes it via contract execution. Aggregators are mainnet-only;
  on testnets use the CLI swap (`agentSwap`) which routes through Circle's service.

Two custody models coexist: the SDK path (`executeContract`/`bridgeUSDC`/`swap`)
runs on app-custody dev-controlled wallets; the `agent*` path runs on user-custody
MPC wallets via the CLI. Pick whichever matches your deployment.

### Agent Stack (Circle CLI)

The `agent*` methods drive Circle **Agent Wallets** — user-custody 2-of-2 MPC
wallets operated through the [Circle CLI](https://developers.circle.com/agent-stack/agent-wallets)
rather than the developer-controlled SDK. They shell out to the `circle` binary,
so install it once and authenticate:

```bash
npm install -g @circle-fin/cli
# then, from an agent action: agentLoginInit(email) -> agentLoginComplete(requestId, otp)
```

Money-moving Agent Stack ops (`agentFund` on mainnet, `agentTransfer`,
`agentBridge`, `agentSwap`) apply the same confirm-threshold guardrails.
`agentExecuteContract` always requires `confirm: true`. Set `CIRCLE_CLI_BIN` to
override the binary path.

## Setup

1. `cp .env.example .env` and fill in `CIRCLE_API_KEY` + `ENTITY_SECRET`.
2. Register your entity secret yourself (the kit never does this for you):
   https://developers.circle.com/wallets/dev-controlled/register-entity-secret
3. Fund your wallet from the testnet faucet: https://faucet.circle.com
4. Install + build:

```bash
pnpm install
pnpm build
```

For Python (Hermes):

```bash
cd packages/core-py
pip install -e .
```

## Security

- Never hardcode/commit secrets. `.env*`, `*.pem`, and `*-recovery-file.json` are gitignored.
- Defaults to **TESTNET**. Mainnet, message signing, and transfers above the confirm
  threshold require explicit confirmation (`confirm: true`).
- Every mutating call uses a unique idempotency key; transfers poll to a terminal state.

See per-package READMEs for framework-specific install and usage.

---

This project uses Circle's official SDKs and follows the guidance in the Circle
developer skills. It is provided "as is"; review the
[Circle Developer Terms](https://console.circle.com/legal/developer-terms).
