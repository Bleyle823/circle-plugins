"""Mocked-client tests for the Python core (mirror of the TS vitest suite)."""

import pytest

from circle_agent_kit import CircleAgentKit, create_payment_request, to_base_units


BASE_CONFIG = {
    "api_key": "TEST:1:secret",
    "entity_secret": "a" * 64,
    "network": "TESTNET",
}


class MockClient:
    def create_wallet_set(self, name):
        return {"data": {"walletSet": {"id": "ws_1", "name": name}}}

    def create_wallets(self, wallet_set_id, blockchains, count, account_type):
        return {"data": {"wallets": [{"id": "w_1", "address": "0x" + "1" * 40, "blockchain": blockchains[0]}]}}

    def list_wallets(self, wallet_set_id, blockchain):
        return {"data": {"wallets": []}}

    def get_wallet(self, wallet_id):
        return {"data": {"wallet": {"address": "0x" + "2" * 40}}}

    def get_wallet_token_balance(self, wallet_id):
        return {
            "data": {
                "tokenBalances": [
                    {"token": {"symbol": "USDC", "tokenAddress": "0x" + "3" * 40, "decimals": 6}, "amount": "10.5"}
                ]
            }
        }

    def create_transaction(self, wallet_id, token_address, destination_address, amounts, fee_level, idempotency_key):
        return {"data": {"id": "tx_1", "state": "INITIATED"}}

    def get_transaction(self, transaction_id):
        return {"data": {"transaction": {"id": "tx_1", "state": "COMPLETE", "txHash": "0xabc"}}}

    def estimate_transfer_fee(self, wallet_id, token_address, destination_address, amounts):
        return {"data": {"low": {}, "medium": {}, "high": {}}}

    def accelerate_transaction(self, transaction_id):
        return {"data": {"id": "tx_1"}}

    def cancel_transaction(self, transaction_id):
        return {"data": {"state": "CANCELLED"}}


def kit():
    return CircleAgentKit.create(BASE_CONFIG, MockClient())


def test_to_base_units():
    assert to_base_units("1", 6) == "1000000"
    assert to_base_units("0.01", 6) == "10000"
    assert to_base_units("10.5", 6) == "10500000"
    assert to_base_units("0", 6) == "0"


def test_create_payment_request_arc():
    r = create_payment_request("2.5", "ARC-TESTNET", "0x" + "4" * 40)
    assert "ethereum:" in r["uri"]
    assert "@5042002" in r["uri"]
    assert "uint256=2500000" in r["uri"]


def test_create_payment_request_invalid_address():
    with pytest.raises(Exception):
        create_payment_request("1", "ARC-TESTNET", "nope")


def test_create_wallet():
    w = kit().create_wallet()
    assert w["id"] == "w_1"
    assert w["blockchain"] == "ARC-TESTNET"


def test_usdc_balance():
    assert kit().get_usdc_balance("w_1") == "10.5"


def test_send_small_ok():
    tx = kit().send_usdc("w_1", "0x" + "5" * 40, "0.01")
    assert tx["id"] == "tx_1"


def test_send_large_blocked():
    with pytest.raises(Exception, match="confirmation"):
        kit().send_usdc("w_1", "0x" + "5" * 40, "500")


def test_send_large_confirmed():
    tx = kit().send_usdc("w_1", "0x" + "5" * 40, "500", confirm=True)
    assert tx["id"] == "tx_1"


def test_mainnet_blocked():
    k = CircleAgentKit.create(
        {**BASE_CONFIG, "network": "MAINNET", "default_chain": "BASE-MAINNET"}, MockClient()
    )
    with pytest.raises(Exception):
        k.send_usdc("w_1", "0x" + "5" * 40, "0.01")


def test_wait_for_transaction():
    tx = kit().wait_for_transaction("tx_1", interval_s=0.001, timeout_s=1)
    assert tx["state"] == "COMPLETE"
    assert "arcscan" in tx["explorerUrl"]
