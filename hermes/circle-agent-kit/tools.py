"""Tool handlers — what runs when the Hermes model calls a Circle tool.

Each handler wraps the shared ``circle_agent_kit`` Python core. Handlers follow
the Hermes plugin contract: ``(args: dict, **kwargs) -> str`` returning JSON.
"""

from __future__ import annotations

import json
import os
from typing import Any, Callable

from plugins.plugin_utils import lazy_singleton

try:
    from .params import resolve_paywall_url
except ImportError:
    from params import resolve_paywall_url

try:
    from circle_agent_kit import CircleAgentKit, CircleAgentError
except Exception as exc:  # noqa: BLE001 - surface a clear install hint
    CircleAgentKit = None  # type: ignore
    CircleAgentError = Exception  # type: ignore
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None


@lazy_singleton
def _get_kit():
    if _IMPORT_ERROR is not None:
        raise RuntimeError(
            "circle_agent_kit is not installed. Install the Python core into the "
            "Hermes venv: pip install -e ~/.hermes/core-py[circle]"
        )
    return CircleAgentKit.create()


def is_available() -> bool:
    """Gate tool visibility when the core package or credentials are missing."""
    if _IMPORT_ERROR is not None:
        return False
    if not os.getenv("CIRCLE_API_KEY", "").strip():
        return False
    if not os.getenv("ENTITY_SECRET", "").strip():
        return False
    return True


def _error_json(message: str, *, code: str = "ERROR", **extra: Any) -> str:
    payload = {"error": message, "code": code, **extra}
    return json.dumps(payload)


def _wrap(fn: Callable[[Any, dict], Any]):
    """Run a handler, returning a JSON string result."""

    def handler(args: dict | None = None, **kwargs) -> str:
        del kwargs  # forward-compatible; unused today
        args = args or {}
        try:
            return json.dumps(fn(_get_kit(), args), default=str, indent=2)
        except CircleAgentError as e:  # type: ignore[misc]
            return _error_json(str(e), code=getattr(e, "code", "ERROR"))
        except Exception as e:  # noqa: BLE001
            return _error_json(str(e))

    return handler


create_wallet = _wrap(
    lambda kit, a: kit.create_wallet(chain=a.get("chain"), account_type=a.get("account_type", "EOA"))
)

check_balance = _wrap(lambda kit, a: kit.get_balance(a["wallet_id"]))

faucet_info = _wrap(lambda kit, a: kit.faucet_info(a.get("chain")))

send_usdc = _wrap(
    lambda kit, a: kit.send_usdc(
        wallet_id=a["wallet_id"],
        destination_address=a["destination_address"],
        amount=str(a["amount"]),
        chain=a.get("chain"),
        confirm=bool(a.get("confirm", False)),
        wait=a.get("wait", True) is not False,
    )
)

request_usdc = _wrap(
    lambda kit, a: kit.create_payment_request(
        amount=str(a["amount"]),
        destination_address=a["destination_address"],
        chain=a.get("chain"),
        memo=a.get("memo"),
    )
)

pay_x402 = _wrap(
    lambda kit, a: kit.pay_x402(
        resolve_paywall_url(a.get("url")),
        {
            "method": a.get("method"),
            "body": a.get("body"),
            "headers": a.get("headers"),
        },
    )
)

request_faucet = _wrap(
    lambda kit, a: kit.request_faucet(
        wallet_id=a.get("wallet_id") or os.getenv("CIRCLE_WALLET_ID"),
        address=a.get("address"),
        chain=a.get("chain"),
        native=a.get("native"),
        usdc=a.get("usdc"),
        eurc=a.get("eurc"),
    )
)

gateway_deposit = _wrap(
    lambda kit, a: kit.gateway_deposit(str(a["amount"]), confirm=bool(a.get("confirm", False)))
)

gateway_balance = _wrap(lambda kit, a: kit.gateway_balance(a.get("address")))

execute_contract = _wrap(
    lambda kit, a: kit.execute_contract(
        wallet_id=a["wallet_id"],
        contract_address=a["contract_address"],
        abi_function_signature=a.get("abi_function_signature"),
        abi_parameters=a.get("abi_parameters"),
        call_data=a.get("call_data"),
        amount=str(a["amount"]) if a.get("amount") is not None else None,
        chain=a.get("chain"),
        confirm=bool(a.get("confirm", False)),
        wait=a.get("wait", True) is not False,
    )
)

bridge_usdc = _wrap(
    lambda kit, a: kit.bridge_usdc(
        to_chain=a["to_chain"],
        source_wallet_id=a["source_wallet_id"],
        dest_wallet_id=a["dest_wallet_id"],
        amount=str(a["amount"]),
        from_chain=a.get("from_chain"),
        mint_recipient=a.get("mint_recipient"),
        wait_for_mint=a.get("wait_for_mint", True) is not False,
        confirm=bool(a.get("confirm", False)),
    )
)

swap_quote = _wrap(
    lambda kit, a: kit.swap_quote(
        sell_token=a["sell_token"],
        buy_token=a["buy_token"],
        sell_amount=str(a["sell_amount"]),
        taker_address=a["taker_address"],
        chain=a.get("chain"),
        slippage_bps=int(a["slippage_bps"]) if a.get("slippage_bps") is not None else None,
    )
)

swap = _wrap(
    lambda kit, a: kit.swap(
        wallet_id=a["wallet_id"],
        wallet_address=a["wallet_address"],
        sell_token=a["sell_token"],
        buy_token=a["buy_token"],
        sell_amount=str(a["sell_amount"]),
        chain=a.get("chain"),
        slippage_bps=int(a["slippage_bps"]) if a.get("slippage_bps") is not None else None,
        confirm=bool(a.get("confirm", False)),
    )
)

services_search = _wrap(
    lambda kit, a: kit.services_search(
        query=a.get("query"),
        category=a.get("category"),
        service_type=a.get("service_type"),
        limit=int(a["limit"]) if a.get("limit") is not None else None,
        offset=int(a["offset"]) if a.get("offset") is not None else None,
    )
)

services_inspect = _wrap(
    lambda kit, a: kit.services_inspect(
        url=a["url"],
        method=a.get("method"),
        data=a.get("data"),
        headers=a.get("headers"),
    )
)


def status_summary() -> str:
    """Human-readable status for the /circle slash command and CLI."""
    if _IMPORT_ERROR is not None:
        return (
            "circle-plugins: core not installed. Run: "
            "pip install -e ~/.hermes/core-py[circle]"
        )
    if not is_available():
        return "circle-plugins: set CIRCLE_API_KEY and ENTITY_SECRET in ~/.hermes/.env"
    try:
        kit = _get_kit()
        chain = kit.get_chain()
        return (
            f"circle-plugins ready. Network={kit.config.network}, "
            f"default chain={chain.name} ({chain.id}). "
            f"Faucet: {kit.faucet_info().get('faucetUrl') or 'n/a (mainnet)'}."
        )
    except Exception as e:  # noqa: BLE001
        return f"circle-plugins not ready: {e}"
