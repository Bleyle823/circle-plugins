"""Payment requests + faucet — mirrors packages/core-circle/src/requests.ts."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

import requests

from .chains import get_chain
from .errors import err
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


FAUCET_URL = "https://api.circle.com/v1/faucet/drips"


def request_faucet(
    api_key: str,
    address: str,
    chain: str,
    native: Optional[bool] = None,
    usdc: Optional[bool] = None,
    eurc: Optional[bool] = None,
) -> dict:
    """Request free testnet tokens from Circle's faucet API. Testnet only."""
    info = get_chain(chain)
    if not info.testnet:
        raise err(
            "MAINNET_BLOCKED",
            f"{info.name} is a mainnet chain — the Circle faucet only dispenses testnet tokens. "
            "Fund it from a real USDC source instead.",
        )
    assert_valid_address(address, chain)

    wants_native = native if native is not None else not info.usdc_is_gas
    wants_usdc = True if usdc is None else usdc
    wants_eurc = bool(eurc)

    try:
        res = requests.post(
            FAUCET_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "address": address,
                "blockchain": info.id,
                "native": wants_native,
                "usdc": wants_usdc,
                "eurc": wants_eurc,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise err("UPSTREAM", "Failed to reach the Circle faucet API.", exc) from exc

    if not res.ok:
        if res.status_code == 403:
            raise err(
                "UPSTREAM",
                "Circle rejected the faucet API request (403 Forbidden) for this account. "
                "The /v1/faucet/drips API requires faucet access enabled on your account. "
                f"Request testnet tokens manually at https://faucet.circle.com for {address} instead.",
            )
        message = f"Faucet request failed with status {res.status_code}."
        try:
            body = res.json()
            if isinstance(body, dict) and body.get("message"):
                message = f"Faucet request failed: {body['message']}"
        except ValueError:
            pass
        raise err("UPSTREAM", message)

    requested_list = [
        wants_native and "native gas",
        wants_usdc and "USDC",
        wants_eurc and "EURC",
    ]
    requested_list = [x for x in requested_list if x]

    return {
        "chain": info.id,
        "address": address,
        "requested": {"native": wants_native, "usdc": wants_usdc, "eurc": wants_eurc},
        "note": (
            f"Requested {' + '.join(requested_list)} from the Circle faucet for {address} "
            f"on {info.name}. Funds usually arrive within a minute — check the balance shortly."
        ),
    }
