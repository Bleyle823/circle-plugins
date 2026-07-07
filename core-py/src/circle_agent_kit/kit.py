"""CircleAgentKit (Python) — mirrors packages/core-circle/src/kit.ts.

The unified capability surface used by the Hermes plugin.
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Optional

from . import contracts as dc
from . import nanopayments as nano
from . import requests as req
from .agent_cli import CircleAgentCli
from .chains import CCTP_V2, ChainInfo, get_chain, list_chains
from .client import WalletsClient, create_wallets_client
from .config import CircleAgentConfig, resolve_config
from .errors import err
from .guardrails import assert_confirmed, assert_positive_amount, assert_valid_address

_TERMINAL = {"COMPLETE", "FAILED", "DENIED", "CANCELLED"}


def _get(d: Any, *path, default=None):
    cur = d
    for key in path:
        if isinstance(cur, dict):
            cur = cur.get(key)
        else:
            cur = getattr(cur, key, None)
        if cur is None:
            return default
    return cur if cur is not None else default


class CircleAgentKit:
    def __init__(self, config: CircleAgentConfig, client: Optional[WalletsClient] = None):
        self.config = config
        self._client = client
        self._cli: Optional[CircleAgentCli] = None

    @classmethod
    def create(
        cls, overrides: Optional[dict] = None, client: Optional[WalletsClient] = None
    ) -> "CircleAgentKit":
        return cls(resolve_config(overrides or {}), client)

    def _c(self) -> WalletsClient:
        if self._client is None:
            self._client = create_wallets_client(self.config)
        return self._client

    def _chain(self, chain: Optional[str]) -> str:
        return chain or self.config.default_chain

    def app_kit_chain(self, chain: Optional[str] = None) -> str:
        """Map internal chain id to Circle App Kit blockchain name."""
        cid = self._chain(chain).upper()
        mapped = ID_TO_APPKIT_CHAIN.get(cid)
        if not mapped:
            raise err("VALIDATION", f'Chain "{cid}" is not supported by App Kit (yet).')
        return mapped

    # --- Chains ---
    def list_chains(self) -> list[ChainInfo]:
        return list_chains()

    def get_chain(self, chain: Optional[str] = None) -> ChainInfo:
        return get_chain(self._chain(chain))

    # --- Wallets ---
    def create_wallet_set(self, name: str = "Circle Agent Kit") -> dict:
        res = self._c().create_wallet_set(name)
        wallet_set = _get(res, "data", "walletSet") or _get(res, "data") or {}
        if not wallet_set.get("id"):
            raise err("UPSTREAM", "Wallet set creation returned no id.", res)
        return {"id": wallet_set["id"], "name": wallet_set.get("name")}

    def create_wallet(
        self,
        chain: Optional[str] = None,
        account_type: str = "EOA",
        wallet_set_id: Optional[str] = None,
    ) -> dict:
        wsid = wallet_set_id or self.config.wallet_set_id
        if not wsid:
            wsid = self.create_wallet_set()["id"]
        res = self._c().create_wallets(
            wallet_set_id=wsid,
            blockchains=[get_chain(self._chain(chain)).id],
            count=1,
            account_type=account_type,
        )
        wallets = _get(res, "data", "wallets", default=[])
        if not wallets:
            raise err("UPSTREAM", "Wallet creation returned no wallets.", res)
        return self._map_wallet(wallets[0])

    def list_wallets(
        self, wallet_set_id: Optional[str] = None, chain: Optional[str] = None
    ) -> list[dict]:
        res = self._c().list_wallets(
            wallet_set_id=wallet_set_id or self.config.wallet_set_id,
            blockchain=get_chain(chain).id if chain else None,
        )
        return [self._map_wallet(w) for w in _get(res, "data", "wallets", default=[])]

    def get_address(self, wallet_id: str) -> str:
        res = self._c().get_wallet(wallet_id)
        addr = _get(res, "data", "wallet", "address") or _get(res, "data", "address")
        if not addr:
            raise err("NOT_FOUND", f'No wallet found for id "{wallet_id}".')
        return addr

    def get_balance(self, wallet_id: str) -> list[dict]:
        res = self._c().get_wallet_token_balance(wallet_id)
        out = []
        for b in _get(res, "data", "tokenBalances", default=[]):
            token = b.get("token", {}) if isinstance(b, dict) else {}
            out.append(
                {
                    "token": token.get("name") or token.get("symbol") or "UNKNOWN",
                    "symbol": token.get("symbol"),
                    "tokenAddress": token.get("tokenAddress"),
                    "decimals": token.get("decimals"),
                    "amount": b.get("amount"),
                }
            )
        return out

    def get_usdc_balance(self, wallet_id: str) -> str:
        for b in self.get_balance(wallet_id):
            if (b.get("symbol") or "").upper() == "USDC":
                return b.get("amount") or "0"
        return "0"

    @staticmethod
    def _map_wallet(w: dict) -> dict:
        return {
            "id": w.get("id"),
            "address": w.get("address"),
            "blockchain": w.get("blockchain"),
            "accountType": w.get("accountType"),
            "state": w.get("state"),
            "walletSetId": w.get("walletSetId"),
        }

    # --- Transfers ---
    def _resolve_usdc_token(self, wallet_id: str, chain: str) -> str:
        for b in self.get_balance(wallet_id):
            if (b.get("symbol") or "").upper() == "USDC" and b.get("tokenAddress"):
                return b["tokenAddress"]
        fallback = get_chain(chain).usdc_address
        if fallback:
            return fallback
        raise err("VALIDATION", f"Could not resolve USDC token for {wallet_id} on {chain}.")

    def estimate_fee(
        self,
        wallet_id: str,
        destination_address: str,
        amount: str,
        chain: Optional[str] = None,
        token_address: Optional[str] = None,
    ) -> dict:
        c = self._chain(chain)
        token = token_address or self._resolve_usdc_token(wallet_id, c)
        res = self._c().estimate_transfer_fee(
            wallet_id=wallet_id,
            token_address=token,
            destination_address=destination_address,
            amounts=[amount],
        )
        return _get(res, "data", default={})

    def send_usdc(
        self,
        wallet_id: str,
        destination_address: str,
        amount: str,
        chain: Optional[str] = None,
        fee_level: str = "MEDIUM",
        confirm: bool = False,
        wait: bool = False,
        token_address: Optional[str] = None,
    ) -> dict:
        c = self._chain(chain)
        amount_num = assert_positive_amount(amount)
        assert_valid_address(destination_address, c)
        assert_confirmed(self.config, "send_usdc", amount_num, confirm)

        token = token_address or self._resolve_usdc_token(wallet_id, c)
        res = self._c().create_transaction(
            wallet_id=wallet_id,
            token_address=token,
            destination_address=destination_address,
            amounts=[amount],
            fee_level=fee_level,
            idempotency_key=str(uuid.uuid4()),
            blockchain=c,
        )
        tx_id = _get(res, "data", "id")
        if not tx_id:
            raise err("UPSTREAM", "Transfer creation returned no transaction id.", res)
        tx = {"id": tx_id, "state": _get(res, "data", "state", default="INITIATED")}
        if wait:
            return self.wait_for_transaction(tx_id, chain=c)
        return tx

    def get_transaction(self, transaction_id: str, chain: Optional[str] = None) -> dict:
        res = self._c().get_transaction(transaction_id)
        tx = _get(res, "data", "transaction") or _get(res, "data") or {}
        if not tx:
            raise err("NOT_FOUND", f'No transaction found for id "{transaction_id}".')
        tx_hash = tx.get("txHash")
        info = get_chain(self._chain(chain))
        explorer = f"{info.explorer}/tx/{tx_hash}" if (tx_hash and info.explorer) else None
        return {
            "id": tx.get("id", transaction_id),
            "state": tx.get("state"),
            "txHash": tx_hash,
            "explorerUrl": explorer,
        }

    def wait_for_transaction(
        self,
        transaction_id: str,
        chain: Optional[str] = None,
        interval_s: float = 3.0,
        timeout_s: float = 120.0,
    ) -> dict:
        start = time.time()
        while True:
            tx = self.get_transaction(transaction_id, chain)
            if tx.get("state") in _TERMINAL:
                return tx
            if time.time() - start > timeout_s:
                raise err(
                    "TRANSACTION_FAILED",
                    f"Timed out waiting for {transaction_id} (last state {tx.get('state')}).",
                )
            time.sleep(interval_s)

    def accelerate_transaction(self, transaction_id: str) -> dict:
        res = self._c().accelerate_transaction(transaction_id)
        return {"id": _get(res, "data", "id", default=transaction_id)}

    def cancel_transaction(self, transaction_id: str) -> dict:
        res = self._c().cancel_transaction(transaction_id)
        return {"id": transaction_id, "state": _get(res, "data", "state", default="CANCELLED")}

    # --- Nanopayments (x402) ---
    def gateway_deposit(self, amount: str, confirm: bool = False) -> dict:
        assert_confirmed(self.config, "gateway_deposit", assert_positive_amount(amount), confirm)
        return nano.gateway_deposit(self.config, amount)

    def pay_x402(self, url: str, options: Optional[dict] = None) -> dict:
        return nano.pay_x402(self.config, url, options)

    def gateway_balance(self, address: Optional[str] = None) -> dict:
        return nano.gateway_balance(self.config, address)

    def gateway_withdraw(self, amount: str, confirm: bool = False) -> dict:
        assert_confirmed(self.config, "gateway_withdraw", assert_positive_amount(amount), confirm)
        return nano.gateway_withdraw(self.config, amount)

    # --- Requests ---
    def create_payment_request(
        self,
        amount: str,
        destination_address: str,
        chain: Optional[str] = None,
        memo: Optional[str] = None,
        token_address: Optional[str] = None,
    ) -> dict:
        return req.create_payment_request(
            amount=amount,
            chain=self._chain(chain),
            destination_address=destination_address,
            memo=memo,
            token_address=token_address,
        )

    def faucet_info(self, chain: Optional[str] = None) -> dict:
        return req.faucet_info(self._chain(chain))

    def request_faucet(
        self,
        wallet_id: Optional[str] = None,
        address: Optional[str] = None,
        chain: Optional[str] = None,
        native: Optional[bool] = None,
        usdc: Optional[bool] = None,
        eurc: Optional[bool] = None,
    ) -> dict:
        c = self._chain(chain)
        resolved = address or (self.get_address(wallet_id) if wallet_id else None)
        if not resolved:
            raise err(
                "VALIDATION",
                "request_faucet needs either a wallet_id (to look up its address) or an explicit address.",
            )
        return req.request_faucet(
            api_key=self.config.api_key,
            address=resolved,
            chain=c,
            native=native,
            usdc=usdc,
            eurc=eurc,
        )

    # --- Contracts / Bridge / Swap (SDK-native) ---
    # CLI Agent Stack's execute/bridge/swap using the same dev-controlled wallet.

    def _resolve_usdc_address(self, wallet_id: str, chain: str) -> str:
        for b in self.get_balance(wallet_id):
            if (b.get("symbol") or "").upper() == "USDC" and b.get("tokenAddress"):
                return b["tokenAddress"]
        fallback = get_chain(chain).usdc_address
        if fallback:
            return fallback
        raise err("VALIDATION", f"No USDC token address for {wallet_id} on {chain}.")

    def _execute_contract(
        self,
        wallet_id: str,
        contract_address: str,
        abi_function_signature: Optional[str] = None,
        abi_parameters: Optional[list] = None,
        call_data: Optional[str] = None,
        amount: Optional[str] = None,
        fee_level: str = "MEDIUM",
    ) -> dict:
        if not abi_function_signature and not call_data:
            raise err("VALIDATION", "execute_contract needs abi_function_signature or call_data.")
        res = self._c().create_contract_execution_transaction(
            wallet_id=wallet_id,
            contract_address=contract_address,
            abi_function_signature=abi_function_signature,
            abi_parameters=abi_parameters,
            call_data=call_data,
            amount=amount,
            fee_level=fee_level,
            idempotency_key=str(uuid.uuid4()),
        )
        tx_id = _get(res, "data", "id")
        if not tx_id:
            raise err("UPSTREAM", "Contract execution returned no transaction id.", res)
        return {"id": tx_id, "state": _get(res, "data", "state", default="INITIATED")}

    def execute_contract(
        self,
        wallet_id: str,
        contract_address: str,
        abi_function_signature: Optional[str] = None,
        abi_parameters: Optional[list] = None,
        call_data: Optional[str] = None,
        amount: Optional[str] = None,
        chain: Optional[str] = None,
        fee_level: str = "MEDIUM",
        confirm: bool = False,
        wait: bool = True,
    ) -> dict:
        c = self._chain(chain)
        assert_valid_address(contract_address, c)
        if not confirm:
            raise err(
                "CONFIRMATION_REQUIRED",
                '"execute_contract" can move funds via arbitrary contract calls and requires '
                "confirm=True after verifying the contract, function signature, and parameters.",
            )
        tx = self._execute_contract(
            wallet_id, contract_address, abi_function_signature, abi_parameters,
            call_data, amount, fee_level,
        )
        if wait:
            return self.wait_for_transaction(tx["id"], chain=c)
        return tx

    def get_bridge_attestation(self, source_chain: str, burn_tx_hash: str) -> dict:
        return dc.get_bridge_attestation(self.config, source_chain, burn_tx_hash)

    def bridge_usdc(
        self,
        to_chain: str,
        source_wallet_id: str,
        dest_wallet_id: str,
        amount: str,
        from_chain: Optional[str] = None,
        mint_recipient: Optional[str] = None,
        max_fee: str = "0",
        min_finality_threshold: int = 2000,
        fee_level: str = "MEDIUM",
        wait_for_mint: bool = True,
        confirm: bool = False,
    ) -> dict:
        fc = self._chain(from_chain)
        from_info = get_chain(fc)
        to_info = get_chain(to_chain)
        if to_info.cctp_domain is None:
            raise err("VALIDATION", f"Destination chain {to_chain} has no CCTP domain.")
        amount_num = assert_positive_amount(amount)
        assert_confirmed(self.config, "bridge_usdc", amount_num, confirm)

        token_messenger = CCTP_V2["token_messenger"]
        message_transmitter = CCTP_V2["message_transmitter"]
        usdc = self._resolve_usdc_address(source_wallet_id, fc)
        amount_base = req.to_base_units(amount, from_info.usdc_decimals)

        recipient = mint_recipient or self.get_address(dest_wallet_id)
        if not recipient:
            raise err("VALIDATION", "Could not resolve destination mint recipient address.")

        approve = self._execute_contract(
            source_wallet_id, usdc, "approve(address,uint256)",
            [token_messenger, amount_base], fee_level=fee_level,
        )
        self.wait_for_transaction(approve["id"], chain=fc)

        burn = self._execute_contract(
            source_wallet_id,
            token_messenger,
            "depositForBurn(uint256,uint32,bytes32,address,bytes32,uint256,uint32)",
            [
                amount_base,
                to_info.cctp_domain,
                dc.address_to_bytes32(recipient),
                usdc,
                "0x" + ("0" * 64),
                max_fee,
                min_finality_threshold,
            ],
            fee_level=fee_level,
        )
        burned = self.wait_for_transaction(burn["id"], chain=fc)

        result = {
            "fromChain": fc,
            "toChain": to_chain,
            "amount": amount,
            "burnTxId": burn["id"],
            "burnTxHash": burned.get("txHash"),
            "state": "BURNED",
        }
        if not wait_for_mint or not burned.get("txHash"):
            return result

        att = dc.get_bridge_attestation(self.config, fc, burned["txHash"])
        result["attestation"] = att.get("attestation")

        mint = self._execute_contract(
            dest_wallet_id,
            message_transmitter,
            "receiveMessage(bytes,bytes)",
            [att["message"], att["attestation"]],
            fee_level=fee_level,
        )
        minted = self.wait_for_transaction(mint["id"], chain=to_chain)
        result["mintTxId"] = mint["id"]
        result["mintTxHash"] = minted.get("txHash")
        result["state"] = "COMPLETE"
        return result

    def swap_quote(
        self,
        sell_token: str,
        buy_token: str,
        sell_amount: str,
        taker_address: str,
        chain: Optional[str] = None,
        slippage_bps: Optional[int] = None,
    ) -> dict:
        return dc.get_swap_quote(
            self.config,
            chain=self._chain(chain),
            sell_token=sell_token,
            buy_token=buy_token,
            sell_amount=sell_amount,
            taker_address=taker_address,
            slippage_bps=slippage_bps,
        )

    def swap(
        self,
        wallet_id: str,
        wallet_address: str,
        sell_token: str,
        buy_token: str,
        sell_amount: str,
        chain: Optional[str] = None,
        slippage_bps: Optional[int] = None,
        fee_level: str = "MEDIUM",
        quote: Optional[dict] = None,
        confirm: bool = False,
    ) -> dict:
        c = self._chain(chain)
        assert_confirmed(self.config, "swap", None, confirm)
        q = quote or dc.get_swap_quote(
            self.config,
            chain=c,
            sell_token=sell_token,
            buy_token=buy_token,
            sell_amount=sell_amount,
            taker_address=wallet_address,
            slippage_bps=slippage_bps,
        )
        approve_tx_id = None
        if q.get("allowanceTarget"):
            approve = self._execute_contract(
                wallet_id, sell_token, "approve(address,uint256)",
                [q["allowanceTarget"], sell_amount], fee_level=fee_level,
            )
            self.wait_for_transaction(approve["id"], chain=c)
            approve_tx_id = approve["id"]
        value = q.get("value")
        swap_tx = self._execute_contract(
            wallet_id,
            q["to"],
            call_data=q["data"],
            amount=value if value and value != "0" else None,
            fee_level=fee_level,
        )
        return {"quote": q, "approveTxId": approve_tx_id, "swapTxId": swap_tx["id"]}

    # --- Agent Stack (Circle CLI) ---
    # User-custody MPC agent wallets operated via the `circle` CLI. Separate
    # from the developer-controlled SDK methods above. See agent_cli.py.

    def agent_cli(self) -> CircleAgentCli:
        if self._cli is None:
            self._cli = CircleAgentCli(
                bin=self.config.cli_bin or "circle",
                testnet=self.config.network != "MAINNET",
            )
        return self._cli

    def agent_login_init(self, email: str) -> dict:
        return self.agent_cli().login_init(email)

    def agent_login_complete(self, request_id: str, otp: str) -> dict:
        return self.agent_cli().login_complete(request_id, otp)

    def agent_list_wallets(self, chain: Optional[str] = None) -> dict:
        return self.agent_cli().list_wallets(chain)

    def agent_get_address(self, chain: Optional[str] = None) -> Optional[str]:
        return self.agent_cli().get_address(self._chain(chain))

    def agent_balance(self, address: str, chain: Optional[str] = None) -> dict:
        return self.agent_cli().balance(address, self._chain(chain))

    def agent_fund(
        self,
        address: str,
        chain: Optional[str] = None,
        amount: Optional[str] = None,
        method: Optional[str] = None,
        token: Optional[str] = None,
        confirm: bool = False,
    ) -> dict:
        c = self._chain(chain)
        if self.config.network == "MAINNET":
            assert_confirmed(
                self.config,
                "agent_fund",
                float(amount) if amount else None,
                confirm,
            )
        return self.agent_cli().fund(address=address, chain=c, amount=amount, method=method, token=token)

    def agent_transfer(
        self,
        to: str,
        amount: str,
        address: str,
        chain: Optional[str] = None,
        token: Optional[str] = None,
        confirm: bool = False,
    ) -> dict:
        c = self._chain(chain)
        amount_num = assert_positive_amount(amount)
        assert_valid_address(to, c)
        assert_confirmed(self.config, "agent_transfer", amount_num, confirm)
        return self.agent_cli().transfer(to=to, amount=amount, address=address, chain=c, token=token)

    def agent_bridge_fee(self, to_chain: str, from_chain: Optional[str] = None) -> dict:
        return self.agent_cli().bridge_get_fee(to_chain, self._chain(from_chain))

    def agent_bridge(
        self,
        to_chain: str,
        amount: str,
        address: str,
        from_chain: Optional[str] = None,
        recipient: Optional[str] = None,
        confirm: bool = False,
    ) -> dict:
        fc = self._chain(from_chain)
        amount_num = assert_positive_amount(amount)
        assert_confirmed(self.config, "agent_bridge", amount_num, confirm)
        return self.agent_cli().bridge_transfer(
            to_chain=to_chain, amount=amount, address=address, from_chain=fc, recipient=recipient
        )

    def agent_bridge_status(self, tx_hash: str, from_chain: Optional[str] = None) -> dict:
        return self.agent_cli().bridge_status(tx_hash, self._chain(from_chain))

    def agent_swap_quote(
        self, sell_token: str, sell_amount: str, buy_token: str, chain: Optional[str] = None
    ) -> dict:
        return self.agent_cli().swap(
            sell_token=sell_token,
            sell_amount=sell_amount,
            buy_token=buy_token,
            chain=self._chain(chain),
            quote=True,
        )

    def agent_swap(
        self,
        sell_token: str,
        sell_amount: str,
        buy_token: str,
        buy_min: str,
        address: str,
        chain: Optional[str] = None,
        slippage_bps: Optional[int] = None,
        confirm: bool = False,
    ) -> dict:
        c = self._chain(chain)
        amount_num = assert_positive_amount(sell_amount)
        assert_confirmed(self.config, "agent_swap", amount_num, confirm)
        return self.agent_cli().swap(
            sell_token=sell_token,
            sell_amount=sell_amount,
            buy_token=buy_token,
            buy_min=buy_min,
            address=address,
            chain=c,
            quote=False,
            slippage_bps=slippage_bps,
        )

    def agent_contract_address(self, name: str, chain: Optional[str] = None) -> dict:
        return self.agent_cli().contract_address(name, self._chain(chain))

    def services_search(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        service_type: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> dict:
        return self.agent_cli().services_search(
            query=query,
            category=category,
            service_type=service_type,
            limit=limit,
            offset=offset,
        )

    def services_inspect(
        self,
        url: str,
        method: Optional[str] = None,
        data: Optional[str] = None,
        headers: Optional[list[str]] = None,
    ) -> dict:
        return self.agent_cli().services_inspect(
            url=url, method=method, data=data, headers=headers
        )

    def agent_execute_contract(
        self,
        signature: str,
        params: list,
        contract: str,
        address: str,
        chain: Optional[str] = None,
        amount: Optional[str] = None,
        confirm: bool = False,
    ) -> dict:
        c = self._chain(chain)
        assert_valid_address(contract, c)
        if not confirm:
            raise err(
                "CONFIRMATION_REQUIRED",
                '"agent_execute_contract" can move funds via arbitrary contract calls and '
                "requires explicit confirmation. Re-run with confirm=True after verifying the "
                "contract, function signature, and parameters.",
            )
        return self.agent_cli().execute(
            signature=signature,
            params=params or [],
            contract=contract,
            address=address,
            chain=c,
            amount=amount,
        )
