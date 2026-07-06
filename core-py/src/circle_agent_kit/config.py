"""Config resolution — mirrors packages/core-circle/src/config.ts."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from .chains import DEFAULT_CHAIN
from .errors import err


@dataclass
class CircleAgentConfig:
    api_key: str
    entity_secret: str
    network: str = "TESTNET"
    default_chain: str = DEFAULT_CHAIN
    wallet_set_id: Optional[str] = None
    confirm_threshold_usdc: float = 100.0
    x402_private_key: Optional[str] = None
    x402_chain: Optional[str] = None
    seller_address: Optional[str] = None
    cli_bin: Optional[str] = None
    swap_api_url: Optional[str] = None
    swap_api_key: Optional[str] = None
    kit_key: Optional[str] = None


def _num(value: Optional[str], fallback: float) -> float:
    if not value:
        return fallback
    try:
        return float(value)
    except ValueError:
        return fallback


def resolve_config(overrides: Optional[dict] = None, env: Optional[dict] = None) -> CircleAgentConfig:
    """Merge explicit overrides over environment variables (overrides win)."""
    overrides = overrides or {}
    env = env if env is not None else os.environ

    config = CircleAgentConfig(
        api_key=overrides.get("api_key") or env.get("CIRCLE_API_KEY", ""),
        entity_secret=overrides.get("entity_secret")
        or env.get("ENTITY_SECRET")
        or env.get("CIRCLE_ENTITY_SECRET")
        or "",
        network=overrides.get("network") or env.get("CIRCLE_NETWORK", "TESTNET"),
        default_chain=overrides.get("default_chain")
        or env.get("CIRCLE_DEFAULT_CHAIN", DEFAULT_CHAIN),
        wallet_set_id=overrides.get("wallet_set_id") or env.get("CIRCLE_WALLET_SET_ID") or None,
        confirm_threshold_usdc=overrides.get("confirm_threshold_usdc")
        or _num(env.get("CIRCLE_CONFIRM_THRESHOLD_USDC"), 100.0),
        x402_private_key=overrides.get("x402_private_key")
        or env.get("X402_PRIVATE_KEY")
        or env.get("CLIENT_PRIVATE_KEY")
        or None,
        x402_chain=overrides.get("x402_chain") or env.get("X402_CHAIN") or None,
        seller_address=overrides.get("seller_address") or env.get("SERVER_ADDRESS") or None,
        cli_bin=overrides.get("cli_bin") or env.get("CIRCLE_CLI_BIN") or None,
        swap_api_url=overrides.get("swap_api_url") or env.get("SWAP_API_URL") or None,
        swap_api_key=overrides.get("swap_api_key") or env.get("SWAP_API_KEY") or None,
        kit_key=overrides.get("kit_key") or env.get("CIRCLE_KIT_KEY") or env.get("KIT_KEY") or None,
    )

    has_x402 = bool(config.x402_private_key)
    needs_full_config = not has_x402 or config.api_key not in ("", "dummy")

    if needs_full_config:
        if not config.api_key or config.api_key == "dummy":
            raise err("CONFIG_MISSING", "CIRCLE_API_KEY is required (env or api_key override).")
        if not config.entity_secret or config.entity_secret == "dummy":
            raise err(
                "CONFIG_MISSING",
                "ENTITY_SECRET is required. Generate and register it yourself: "
                "https://developers.circle.com/wallets/dev-controlled/register-entity-secret",
            )
    return config
