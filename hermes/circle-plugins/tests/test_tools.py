import json
import unittest
from unittest.mock import MagicMock

import sys
from types import ModuleType

mock_core = ModuleType("circle_agent_kit_core")
mock_core.CircleAgentKit = MagicMock()
mock_core.CircleAgentError = Exception
sys.modules["circle_agent_kit"] = mock_core

from tools import (
    create_wallet,
    check_balance,
    send_usdc,
    bridge_usdc,
    swap,
    services_search,
    services_inspect,
)

class TestHermesTools(unittest.TestCase):
    def setUp(self):
        self.mock_kit = mock_core.CircleAgentKit.create.return_value

    def test_create_wallet(self):
        self.mock_kit.create_wallet.return_value = {"id": "w_1", "address": "0x1"}
        res = json.loads(create_wallet({"chain": "ARC-TESTNET"}))
        self.assertEqual(res["id"], "w_1")
        self.mock_kit.create_wallet.assert_called_once()

    def test_check_balance(self):
        self.mock_kit.get_balance.return_value = [{"symbol": "USDC", "amount": "10.5"}]
        res = json.loads(check_balance({"wallet_id": "w_1"}))
        self.assertEqual(res[0]["amount"], "10.5")
        self.mock_kit.get_balance.assert_called_once_with("w_1")

    def test_send_usdc(self):
        self.mock_kit.send_usdc.return_value = {"id": "tx_1", "state": "COMPLETE"}
        res = json.loads(send_usdc({
            "wallet_id": "w_1",
            "destination_address": "0x2",
            "amount": "0.5"
        }))
        self.assertEqual(res["id"], "tx_1")
        self.mock_kit.send_usdc.assert_called_once()

    def test_bridge_usdc(self):
        self.mock_kit.bridge_usdc.return_value = {"state": "COMPLETE"}
        res = json.loads(bridge_usdc({
            "to_chain": "ARB",
            "source_wallet_id": "w_1",
            "dest_wallet_id": "w_2",
            "amount": "10"
        }))
        self.assertEqual(res["state"], "COMPLETE")
        self.mock_kit.bridge_usdc.assert_called_once()

    def test_swap(self):
        self.mock_kit.swap.return_value = {"swapTxId": "tx_swap", "quote": {"sellAmount": "10", "buyAmount": "9", "sellToken": "USDC", "buyToken": "EURC"}}
        res = json.loads(swap({
            "wallet_id": "w_1",
            "wallet_address": "0x1",
            "sell_token": "USDC",
            "buy_token": "EURC",
            "sell_amount": "10"
        }))
        self.assertEqual(res["swapTxId"], "tx_swap")
        self.mock_kit.swap.assert_called_once()

    def test_execute_contract(self):
        from tools import execute_contract
        self.mock_kit.execute_contract.return_value = {"id": "tx_exec", "state": "COMPLETE"}
        res = json.loads(execute_contract({
            "wallet_id": "w_1",
            "contract_address": "0xContract",
            "confirm": True
        }))
        self.assertEqual(res["id"], "tx_exec")
        self.mock_kit.execute_contract.assert_called_once()

    def test_swap_quote(self):
        from tools import swap_quote
        self.mock_kit.swap_quote.return_value = {"sellAmount": "10", "buyAmount": "9"}
        res = json.loads(swap_quote({
            "sell_token": "USDC",
            "buy_token": "EURC",
            "sell_amount": "10",
            "taker_address": "0x1"
        }))
        self.assertEqual(res["buyAmount"], "9")
        self.mock_kit.swap_quote.assert_called_once()

    def test_gateway_deposit(self):
        from tools import gateway_deposit
        self.mock_kit.gateway_deposit.return_value = {"amount": "5"}
        res = json.loads(gateway_deposit({"amount": "5", "confirm": True}))
        self.assertEqual(res["amount"], "5")
        self.mock_kit.gateway_deposit.assert_called_once()

    def test_gateway_balance(self):
        from tools import gateway_balance
        self.mock_kit.gateway_balance.return_value = {"available": "5"}
        res = json.loads(gateway_balance({}))
        self.assertEqual(res["available"], "5")
        self.mock_kit.gateway_balance.assert_called_once()

    def test_pay_x402(self):
        from tools import pay_x402
        self.mock_kit.pay_x402.return_value = {"url": "https://api"}
        res = json.loads(pay_x402({"url": "https://api"}))
        self.assertEqual(res["url"], "https://api")
        self.mock_kit.pay_x402.assert_called_once_with(
            "https://api",
            {"method": None, "body": None, "headers": None},
        )

    def test_request_faucet(self):
        from tools import request_faucet
        self.mock_kit.request_faucet.return_value = {"chain": "ARC-TESTNET", "address": "0x1"}
        res = json.loads(request_faucet({"address": "0x1", "chain": "ARC-TESTNET"}))
        self.assertEqual(res["address"], "0x1")
        self.mock_kit.request_faucet.assert_called_once()

    def test_request_usdc(self):
        from tools import request_usdc
        self.mock_kit.create_payment_request.return_value = {"amount": "1"}
        res = json.loads(request_usdc({"amount": "1", "destination_address": "0x1"}))
        self.assertEqual(res["amount"], "1")
        self.mock_kit.create_payment_request.assert_called_once()

    def test_faucet_info(self):
        from tools import faucet_info
        self.mock_kit.faucet_info.return_value = {"faucetUrl": "https://faucet"}
        res = json.loads(faucet_info({"chain": "ARC-TESTNET"}))
        self.assertEqual(res["faucetUrl"], "https://faucet")
        self.mock_kit.faucet_info.assert_called_once()

    def test_services_search(self):
        from tools import services_search
        self.mock_kit.services_search.return_value = {"data": {"services": [{"name": "S1"}]}}
        res = json.loads(services_search({"query": "domain"}))
        self.assertEqual(len(res["data"]["services"]), 1)
        self.mock_kit.services_search.assert_called_once()

    def test_services_inspect(self):
        from tools import services_inspect
        self.mock_kit.services_inspect.return_value = {"data": {"url": "https://api"}}
        res = json.loads(services_inspect({"url": "https://api"}))
        self.assertEqual(res["data"]["url"], "https://api")
        self.mock_kit.services_inspect.assert_called_once()

if __name__ == "__main__":
    unittest.main()
