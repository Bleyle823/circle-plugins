"""SDK-native contract execution, CCTP bridge, and swap.

Mirrors packages/core-ts/src/contracts.ts. Built on the developer-controlled
wallet the rest of the kit uses — no Circle CLI or separate session required.
"""

from __future__ import annotations

import time
import urllib.parse
import urllib.request
import json
import uuid
from typing import Any, Optional

from .chains import CCTP_V2, get_chain
from .errors import err
from .requests import to_base_units


def address_to_bytes32(address: str) -> str:
    clean = (address or "").replace("0x", "").lower()
    if len(clean) != 40:
        raise err("VALIDATION", f'Invalid EVM address: "{address}".')
    return "0x" + ("0" * 24) + clean


def _http_get_json(url: str) -> Optional[dict]:
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:  # noqa: S310
            if resp.status != 200:
                return None
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None


def _http_get_quote(url: str, headers: dict) -> dict:
    req = urllib.request.Request(url, headers=headers)  # noqa: S310
    with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
        body = resp.read().decode("utf-8")
        if resp.status != 200:
            raise err("UPSTREAM", f"Swap quote failed ({resp.status}): {body}")
        return json.loads(body)


def get_bridge_attestation(
    config,
    source_chain: str,
    burn_tx_hash: str,
    interval_s: float = 5.0,
    timeout_s: float = 300.0,
) -> dict:
    domain = get_chain(source_chain).cctp_domain
    if domain is None:
        raise err("VALIDATION", f"Chain {source_chain} has no CCTP domain.")
    base = (
        CCTP_V2["attestation_api"]["mainnet"]
        if config.network == "MAINNET"
        else CCTP_V2["attestation_api"]["testnet"]
    )
    url = f"{base}/v2/messages/{domain}?transactionHash={burn_tx_hash}"
    start = time.time()
    while True:
        body = _http_get_json(url)
        if body:
            msg = (body.get("messages") or [{}])[0]
            if msg.get("status") == "complete" and msg.get("attestation") and msg.get("message"):
                return {
                    "status": "complete",
                    "message": msg["message"],
                    "attestation": msg["attestation"],
                }
        if time.time() - start > timeout_s:
            raise err(
                "TRANSACTION_FAILED",
                f"Timed out waiting for CCTP attestation of {burn_tx_hash}.",
            )
        time.sleep(interval_s)


def get_swap_quote(
    config,
    chain: str,
    sell_token: str,
    buy_token: str,
    sell_amount: str,
    taker_address: str,
    slippage_bps: Optional[int] = None,
) -> dict:
    if not config.swap_api_url:
        raise err(
            "CONFIG_MISSING",
            "Swap requires a DEX aggregator. Set SWAP_API_URL (0x-compatible) and SWAP_API_KEY, "
            "or use the Agent Stack CLI swap (agent_swap) which uses Circle's hosted router.",
        )
    chain_id = get_chain(chain).chain_id
    params = {
        "chainId": str(chain_id or ""),
        "sellToken": sell_token,
        "buyToken": buy_token,
        "sellAmount": sell_amount,
        "taker": taker_address,
    }
    if slippage_bps is not None:
        params["slippageBps"] = str(slippage_bps)
    qs = urllib.parse.urlencode(params)
    headers = {"0x-version": "v2"}
    if config.swap_api_key:
        headers["0x-api-key"] = config.swap_api_key
    q = _http_get_quote(f"{config.swap_api_url}/swap/allowance-holder/quote?{qs}", headers)
    tx = q.get("transaction") or q
    return {
        "sellToken": sell_token,
        "buyToken": buy_token,
        "sellAmount": sell_amount,
        "buyAmount": q.get("buyAmount"),
        "allowanceTarget": q.get("allowanceTarget")
        or (q.get("issues", {}).get("allowance") or {}).get("spender")
        or tx.get("to"),
        "to": tx.get("to"),
        "data": tx.get("data"),
        "value": tx.get("value") or "0",
    }
