---
name: circle-wallets
description: >
  Operate Circle developer-controlled agent wallets inside Hermes via the
  circle-plugins toolset. Covers wallet creation, testnet faucet funding,
  balance checks, USDC transfers, payment requests, x402 nanopayments, and
  gateway operations on Arc Testnet by default.
---

## Overview

The `circle-plugins` Hermes plugin exposes a `circle` toolset backed by
`circle_agent_kit`. Use these tools when the user wants onchain USDC wallet
operations without leaving the agent session.

## Prerequisites

Set in `~/.hermes/.env`:

- `CIRCLE_API_KEY` — from [Circle Console](https://console.circle.com)
- `ENTITY_SECRET` — 32-byte hex secret you generate and register yourself

Register the entity secret:
https://developers.circle.com/wallets/dev-controlled/register-entity-secret

Optional:

- `CIRCLE_NETWORK=TESTNET` (default)
- `CIRCLE_DEFAULT_CHAIN=ARC-TESTNET`
- `X402_PRIVATE_KEY` for x402 nanopayments

Check readiness: `/circle status` or `hermes circle status`.

## Typical workflows

### 1. Create a wallet

Call `circle_create_wallet` with optional `chain` (default Arc Testnet) and
`account_type` (`EOA` or `SCA`). Store the returned `id` and `address`.

### 2. Fund on testnet

1. `circle_faucet_info` — get faucet URL and guidance.
2. `circle_request_faucet` — API drip to wallet `address` or `wallet_id`.

### 3. Check balance

`circle_check_balance` with the wallet `wallet_id`.

### 4. Send USDC

`circle_send_usdc` with `wallet_id`, `destination_address`, `amount`.
Mainnet or large transfers require `confirm: true` — always confirm with the
user before setting `confirm`.

### 5. Request USDC (payment link)

`circle_request_usdc` with `amount`, `destination_address`, optional `memo`.

### 6. Pay an x402 paywall

`circle_pay_x402` with `url` (or rely on `X402_PAYWALL_URL` / port env).
Requires `X402_PRIVATE_KEY`.

### 7. Gateway / bridge / swap (advanced)

- `circle_gateway_deposit`, `circle_gateway_balance`
- `circle_bridge_usdc`, `circle_swap_quote`, `circle_swap`
- `circle_execute_contract` for contract calls

## Rules

- Never log or echo `CIRCLE_API_KEY`, `ENTITY_SECRET`, or `X402_PRIVATE_KEY`.
- Always confirm destination address and amount before `circle_send_usdc` with
  `confirm: true`.
- Prefer testnet (`ARC-TESTNET`) unless the user explicitly requests mainnet.
- If tools are missing, verify the plugin is enabled in `config.yaml` under
  `plugins.enabled` and credentials are set.
