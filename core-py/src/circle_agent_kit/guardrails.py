"""Security guardrails — mirrors packages/core-ts/src/guardrails.ts."""

from __future__ import annotations

import re

from .chains import get_chain
from .config import CircleAgentConfig
from .errors import err

_EVM_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")


def assert_valid_address(address: str, chain_id: str) -> None:
    chain = get_chain(chain_id)
    if chain.chain_id is not None and not _EVM_ADDRESS.match(address or ""):
        raise err("VALIDATION", f'Invalid EVM address: "{address}".')
    if not address or len(address) < 20:
        raise err("VALIDATION", f'Invalid destination address: "{address}".')


def assert_positive_amount(amount) -> float:
    try:
        value = float(amount)
    except (TypeError, ValueError):
        value = float("nan")
    if not (value == value) or value <= 0:  # NaN check + positivity
        raise err("VALIDATION", f'Amount must be a positive number, got "{amount}".')
    return value


def assert_confirmed(
    config: CircleAgentConfig, action: str, amount_usdc: float | None, confirm: bool
) -> None:
    is_mainnet = config.network == "MAINNET"
    over_threshold = amount_usdc is not None and amount_usdc > config.confirm_threshold_usdc

    if (is_mainnet or over_threshold) and not confirm:
        reason = "on MAINNET" if is_mainnet else (
            f"above the {config.confirm_threshold_usdc} USDC confirmation threshold"
        )
        raise err(
            "MAINNET_BLOCKED" if is_mainnet else "CONFIRMATION_REQUIRED",
            f'"{action}" {reason} requires explicit confirmation. '
            "Re-run with confirm=True after verifying destination, amount, network, and token.",
        )
