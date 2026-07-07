"""Circle wallets client protocol + real-SDK adapter.

The kit talks to a small structural interface (`WalletsClient`) so it stays
testable: tests inject a mock, production uses `create_wallets_client` which
adapts the official `circle-developer-controlled-wallets` Python SDK.
"""

from __future__ import annotations

import json
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
        from circle.web3.developer_controlled_wallets.api import (  # noqa: PLC0415
            transactions_api,
            wallets_api,
        )
        self._wallets_api = wallets_api.WalletsApi(sdk_client)
        self._tx_api = transactions_api.TransactionsApi(sdk_client)

    @staticmethod
    def _dump(resp: Any) -> dict:
        # SDK responses are pydantic-like; normalize to plain dict.
        for attr in ("to_dict", "model_dump", "dict"):
            fn = getattr(resp, attr, None)
            if callable(fn):
                return fn()
        return resp if isinstance(resp, dict) else {"data": resp}

    def create_wallet_set(self, name: str) -> dict:
        return self._dump(self._wallets_api.create_wallet_set(
            create_wallet_set_request={"name": name}
        ))

    def create_wallets(self, wallet_set_id, blockchains, count, account_type) -> dict:
        return self._dump(
            self._wallets_api.create_wallet(
                create_wallet_request={
                    "walletSetId": wallet_set_id,
                    "blockchains": blockchains,
                    "count": count,
                    "accountType": account_type,
                }
            )
        )

    def list_wallets(self, wallet_set_id, blockchain) -> dict:
        return self._dump(self._wallets_api.get_wallets(
            wallet_set_id=wallet_set_id, blockchain=blockchain
        ))

    def get_wallet(self, wallet_id) -> dict:
        return self._dump(self._wallets_api.get_wallet(id=wallet_id))

    def get_wallet_token_balance(self, wallet_id) -> dict:
        return self._dump(self._wallets_api.list_wallet_balance(id=wallet_id))

    def create_transaction(
            self,
            wallet_id,
            token_address,
            destination_address,
            amounts,
            fee_level,
            idempotency_key,
            blockchain=None,
        ) -> dict:
            from circle.web3.developer_controlled_wallets.api.transactions_api import (  # noqa: PLC0415
                CreateTransferTransactionForDeveloperRequest,
            )

            bc = None
            if blockchain:
                from circle.web3.developer_controlled_wallets.models.create_transfer_transaction_for_developer_request_blockchain import (  # noqa: PLC0415, E501
                    CreateTransferTransactionForDeveloperRequestBlockchain,
                )
                bc = CreateTransferTransactionForDeveloperRequestBlockchain.from_json(
                    json.dumps(blockchain)
                )

            req = CreateTransferTransactionForDeveloperRequest(
                wallet_id=wallet_id,
                token_address=token_address or None,
                destination_address=destination_address,
                amounts=amounts,
                fee_level=fee_level,
                idempotency_key=idempotency_key,
                blockchain=bc,
            )
            return self._dump(
                self._tx_api.create_developer_transaction_transfer(
                    create_transfer_transaction_for_developer_request=req,
                )
            )

    def get_transaction(self, transaction_id) -> dict:
        return self._dump(self._tx_api.get_transaction(id=transaction_id))

    def estimate_transfer_fee(self, wallet_id, token_address, destination_address, amounts) -> dict:
        return self._dump(
            self._tx_api.estimate_transfer_fee(
                estimate_transfer_fee_request={
                    "walletId": wallet_id,
                    "tokenAddress": token_address,
                    "destinationAddress": destination_address,
                    "amounts": amounts,
                }
            )
        )

    def accelerate_transaction(self, transaction_id) -> dict:
        return self._dump(
            self._tx_api.accelerate_transaction(
                accelerate_transaction_request={
                    "idempotencyKey": str(uuid.uuid4()),
                },
                id=transaction_id,
            )
        )

    def cancel_transaction(self, transaction_id) -> dict:
        return self._dump(
            self._tx_api.cancel_transaction(
                cancel_transaction_request={
                    "idempotencyKey": str(uuid.uuid4()),
                },
                id=transaction_id,
            )
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
        body = {
            "walletId": wallet_id,
            "contractAddress": contract_address,
            "fee": {"type": "level", "config": {"feeLevel": fee_level}},
            "idempotencyKey": idempotency_key,
        }
        if abi_function_signature is not None:
            body["abiFunctionSignature"] = abi_function_signature
        if abi_parameters is not None:
            body["abiParameters"] = abi_parameters
        if call_data is not None:
            body["callData"] = call_data
        if amount is not None:
            body["amount"] = amount
        return self._dump(self._tx_api.create_contract_execution_transaction(
            create_contract_execution_transaction_request=body
        ))


def create_wallets_client(config: CircleAgentConfig) -> WalletsClient:
    try:
        from circle.web3 import utils  # type: ignore
    except Exception as e:  # noqa: BLE001
        raise err(
            "DEPENDENCY_MISSING",
            "Install the Circle SDK: pip install 'circle-agent-kit[circle]' "
            "(circle-developer-controlled-wallets).",
            e,
        ) from e

    sdk_client = utils.init_developer_controlled_wallets_client(
        api_key=config.api_key, entity_secret=config.entity_secret
    )
    return _SdkAdapter(sdk_client)
