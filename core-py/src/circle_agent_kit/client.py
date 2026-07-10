"""Circle wallets client protocol + real-SDK adapter.

The kit talks to a small structural interface (`WalletsClient`) so it stays
testable: tests inject a mock, production uses `create_wallets_client` which
adapts the official `circle-developer-controlled-wallets` Python SDK.
"""

from __future__ import annotations

import uuid
from typing import Any, Protocol

from .config import CircleAgentConfig
from .errors import err


class WalletsClient(Protocol):
    def create_wallet_set(self, name: str) -> dict: ...
    def create_wallets(
        self, wallet_set_id: str, blockchains: list[str], count: int, account_type: str
    ) -> dict: ...
    def list_wallets(self, wallet_set_id: str | None, blockchain: str | None) -> dict: ...
    def get_wallet(self, wallet_id: str) -> dict: ...
    def get_wallet_token_balance(self, wallet_id: str) -> dict: ...
    def create_transaction(
        self,
        wallet_id: str,
        token_address: str,
        destination_address: str,
        amounts: list[str],
        fee_level: str,
        idempotency_key: str,
    ) -> dict: ...
    def get_transaction(self, transaction_id: str) -> dict: ...
    def estimate_transfer_fee(
        self, wallet_id: str, token_address: str, destination_address: str, amounts: list[str]
    ) -> dict: ...
    def accelerate_transaction(self, transaction_id: str) -> dict: ...
    def cancel_transaction(self, transaction_id: str) -> dict: ...
    def create_contract_execution_transaction(
        self,
        wallet_id: str,
        contract_address: str,
        abi_function_signature: str | None,
        abi_parameters: list | None,
        call_data: str | None,
        amount: str | None,
        fee_level: str,
        idempotency_key: str,
    ) -> dict: ...


class _SdkAdapter:
    """Adapts the official Circle Python SDK to the WalletsClient protocol."""

    def __init__(self, sdk_client: Any):
        self._c = sdk_client

    @staticmethod
    def _dump(resp: Any) -> dict:
        # SDK responses are pydantic-like; normalize to plain dict.
        for attr in ("to_dict", "model_dump", "dict"):
            fn = getattr(resp, attr, None)
            if callable(fn):
                return fn()
        return resp if isinstance(resp, dict) else {"data": resp}

    def create_wallet_set(self, name: str) -> dict:
        return self._dump(self._c.create_wallet_set(name=name))

    def create_wallets(self, wallet_set_id, blockchains, count, account_type) -> dict:
        return self._dump(
            self._c.create_wallets(
                wallet_set_id=wallet_set_id,
                blockchains=blockchains,
                count=count,
                account_type=account_type,
            )
        )

    def list_wallets(self, wallet_set_id, blockchain) -> dict:
        return self._dump(self._c.list_wallets(wallet_set_id=wallet_set_id, blockchain=blockchain))

    def get_wallet(self, wallet_id) -> dict:
        return self._dump(self._c.get_wallet(id=wallet_id))

    def get_wallet_token_balance(self, wallet_id) -> dict:
        return self._dump(self._c.get_wallet_token_balance(id=wallet_id))

    def create_transaction(
        self, wallet_id, token_address, destination_address, amounts, fee_level, idempotency_key
    ) -> dict:
        return self._dump(
            self._c.create_transaction(
                wallet_id=wallet_id,
                token_address=token_address,
                destination_address=destination_address,
                amounts=amounts,
                fee={"type": "level", "config": {"feeLevel": fee_level}},
                idempotency_key=idempotency_key,
            )
        )

    def get_transaction(self, transaction_id) -> dict:
        return self._dump(self._c.get_transaction(id=transaction_id))

    def estimate_transfer_fee(self, wallet_id, token_address, destination_address, amounts) -> dict:
        return self._dump(
            self._c.estimate_transfer_fee(
                wallet_id=wallet_id,
                token_address=token_address,
                destination_address=destination_address,
                amounts=amounts,
            )
        )

    def accelerate_transaction(self, transaction_id) -> dict:
        return self._dump(
            self._c.accelerate_transaction(id=transaction_id, idempotency_key=str(uuid.uuid4()))
        )

    def cancel_transaction(self, transaction_id) -> dict:
        return self._dump(
            self._c.cancel_transaction(id=transaction_id, idempotency_key=str(uuid.uuid4()))
        )

    def create_contract_execution_transaction(
        self,
        wallet_id,
        contract_address,
        abi_function_signature,
        abi_parameters,
        call_data,
        amount,
        fee_level,
        idempotency_key,
    ) -> dict:
        kwargs: dict = {
            "wallet_id": wallet_id,
            "contract_address": contract_address,
            "fee": {"type": "level", "config": {"feeLevel": fee_level}},
            "idempotency_key": idempotency_key,
        }
        if abi_function_signature is not None:
            kwargs["abi_function_signature"] = abi_function_signature
        if abi_parameters is not None:
            kwargs["abi_parameters"] = abi_parameters
        if call_data is not None:
            kwargs["call_data"] = call_data
        if amount is not None:
            kwargs["amount"] = amount
        return self._dump(self._c.create_contract_execution_transaction(**kwargs))


def create_wallets_client(config: CircleAgentConfig) -> WalletsClient:
    try:
        from circle.web3 import utils  # type: ignore
    except Exception as e:  # noqa: BLE001
        raise err(
            "DEPENDENCY_MISSING",
            "Install the Circle SDK: pip install 'circle-plugins[circle]' "
            "(circle-developer-controlled-wallets).",
            e,
        ) from e

    sdk_client = utils.init_developer_controlled_wallets_client(
        api_key=config.api_key, entity_secret=config.entity_secret
    )
    return _SdkAdapter(sdk_client)
