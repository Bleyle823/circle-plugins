"""Payment requests + faucet info — mirrors packages/core-ts/src/requests.ts."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .chains import get_chain
from .guardrails import assert_positive_amount, assert_valid_address


def to_base_units(amount, decimals: int) -> str:
    """Convert a decimal string amount to integer base units (no float error)."""
    whole, _, frac = str(amount).partition(".")
    frac_padded = (frac + "0" * decimals)[:decimals]
    combined = f"{whole}{frac_padded}".lstrip("0")
    return combined or "0"


def create_payment_request(
    amount: str,
    chain: str,
    destination_address: str,
    memo: str | None = None,
    token_address: str | None = None,
) -> dict:
    assert_positive_amount(amount)
    assert_valid_address(destination_address, chain)

    info = get_chain(chain)
    token = token_address or info.usdc_address
    base_units = to_base_units(amount, info.usdc_decimals)

    if token and info.chain_id is not None:
        uri = (
            f"ethereum:{token}@{info.chain_id}/transfer"
            f"?address={destination_address}&uint256={base_units}"
        )
    else:
        uri = f"usdc:{destination_address}?amount={amount}&chain={info.id}"

    return {
        "id": str(uuid.uuid4()),
        "amount": amount,
        "chain": info.id,
        "destinationAddress": destination_address,
        "tokenAddress": token,
        "memo": memo,
        "uri": uri,
        "qrData": uri,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }


def faucet_info(chain: str) -> dict:
    info = get_chain(chain)
    return {
        "chain": info.id,
        "testnet": info.testnet,
        "faucetUrl": "https://faucet.circle.com" if info.testnet else None,
        "note": (
            f"Request testnet USDC for {info.name} at https://faucet.circle.com, "
            "then paste your wallet address."
            if info.testnet
            else f"{info.name} is a mainnet chain — fund from a real USDC source; no faucet."
        ),
    }
