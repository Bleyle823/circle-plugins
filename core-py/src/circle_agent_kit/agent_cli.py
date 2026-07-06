"""Circle Agent Stack via the `circle` CLI — mirrors packages/core-circle/src/agent-cli.ts.

Agent Wallets are user-controlled MPC wallets operated through the Circle CLI
(authenticate, fund, transfer, bridge, swap, execute contract). This module
shells out to the CLI and parses its JSON output. Separate from the
developer-controlled-wallets SDK path used elsewhere in the kit.

Install once: `npm install -g @circle-fin/cli`.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from typing import Any, Optional

from .errors import err


def _try_parse_json(stdout: str) -> Any:
    trimmed = (stdout or "").strip()
    if not trimmed:
        return None
    try:
        return json.loads(trimmed)
    except Exception:
        start = trimmed.find("{")
        end = trimmed.rfind("}")
        if start != -1 and end > start:
            try:
                return json.loads(trimmed[start : end + 1])
            except Exception:
                return None
        return None


class CircleAgentCli:
    def __init__(
        self,
        bin: str = "circle",
        testnet: bool = False,
        timeout_s: float = 180.0,
        accept_terms: bool = True,
    ):
        self.bin = bin
        self.testnet = testnet
        self.timeout_s = timeout_s
        self.accept_terms = accept_terms

    def run(self, args: list[str], add_testnet: bool = False) -> dict:
        final_args = args + (["--testnet"] if add_testnet and self.testnet else [])
        if shutil.which(self.bin) is None:
            raise err(
                "DEPENDENCY_MISSING",
                f'Circle CLI ("{self.bin}") not found. Install it: npm install -g @circle-fin/cli',
            )
        env = dict(os.environ)
        if self.accept_terms:
            env["CIRCLE_ACCEPT_TERMS"] = "1"
        try:
            proc = subprocess.run(
                [self.bin, *final_args],
                capture_output=True,
                text=True,
                timeout=self.timeout_s,
                env=env,
            )
        except subprocess.TimeoutExpired as exc:  # noqa: F841
            raise err("UPSTREAM", f"Circle CLI timed out: {' '.join(final_args)}")
        if proc.returncode != 0:
            detail = (proc.stderr or proc.stdout or "").strip()
            raise err("UPSTREAM", f"Circle CLI failed: {detail}")
        parsed = _try_parse_json(proc.stdout)
        data = parsed.get("data") if isinstance(parsed, dict) and "data" in parsed else parsed
        return {"data": data, "stdout": proc.stdout, "stderr": proc.stderr}

    # --- Authentication ---
    def login_init(self, email: str) -> dict:
        res = self.run(["wallet", "login", email, "--init"], add_testnet=True)
        data = res.get("data") or {}
        request_id = None
        if isinstance(data, dict):
            request_id = data.get("requestId") or data.get("request")
        if not request_id:
            m = re.search(r"request(?:\s*id)?[:\s]+([A-Za-z0-9-]+)", res.get("stdout", ""), re.I)
            request_id = m.group(1) if m else None
        return {"requestId": request_id, "raw": res.get("stdout", "")}

    def login_complete(self, request_id: str, otp: str) -> dict:
        return self.run(["wallet", "login", "--request", request_id, "--otp", otp])

    # --- Wallets ---
    def list_wallets(self, chain: Optional[str] = None) -> dict:
        args = ["wallet", "list", "--type", "agent"]
        if chain:
            args += ["--chain", chain]
        return self.run(args)

    def get_address(self, chain: str) -> Optional[str]:
        res = self.list_wallets(chain)
        data = res.get("data")
        wallets = data if isinstance(data, list) else (data or {}).get("wallets", [])
        if wallets:
            return wallets[0].get("address") or wallets[0].get("walletAddress")
        return None

    def balance(self, address: str, chain: str) -> dict:
        return self.run(["wallet", "balance", "--address", address, "--chain", chain])

    # --- Funding ---
    def fund(
        self,
        address: str,
        chain: str,
        amount: Optional[str] = None,
        method: Optional[str] = None,
        token: Optional[str] = None,
    ) -> dict:
        args = ["wallet", "fund", "--address", address, "--chain", chain]
        if amount:
            args += ["--amount", amount]
        if method:
            args += ["--method", method]
        if token:
            args += ["--token", token]
        if method == "fiat":
            args += ["--no-open"]
        return self.run(args)

    # --- Transfer ---
    def transfer(
        self, to: str, amount: str, address: str, chain: str, token: Optional[str] = None
    ) -> dict:
        args = [
            "wallet",
            "transfer",
            to,
            "--amount",
            amount,
            "--address",
            address,
            "--chain",
            chain,
        ]
        if token:
            args += ["--token", token]
        return self.run(args)

    # --- Bridge (CCTP) ---
    def bridge_get_fee(self, to_chain: str, from_chain: str) -> dict:
        return self.run(["bridge", "get-fee", to_chain, "--chain", from_chain])

    def bridge_transfer(
        self,
        to_chain: str,
        amount: str,
        address: str,
        from_chain: str,
        recipient: Optional[str] = None,
    ) -> dict:
        args = [
            "bridge",
            "transfer",
            to_chain,
            "--amount",
            amount,
            "--address",
            address,
            "--chain",
            from_chain,
        ]
        if recipient:
            args += ["--recipient", recipient]
        return self.run(args)

    def bridge_status(self, tx_hash: str, from_chain: str) -> dict:
        return self.run(["bridge", "status", tx_hash, "--chain", from_chain])

    # --- Swap ---
    def swap(
        self,
        sell_token: str,
        sell_amount: str,
        buy_token: str,
        chain: str,
        buy_min: Optional[str] = None,
        address: Optional[str] = None,
        quote: bool = False,
        slippage_bps: Optional[int] = None,
    ) -> dict:
        args = ["wallet", "swap", sell_token, sell_amount, buy_token]
        if quote:
            args += ["--chain", chain, "--quote"]
        else:
            if not buy_min:
                raise err("VALIDATION", "swap execution requires buy_min (stop-limit).")
            if not address:
                raise err("VALIDATION", "swap execution requires the wallet address.")
            args += [buy_min, "--address", address, "--chain", chain]
            if slippage_bps is not None:
                args += ["--slippage-bps", str(slippage_bps)]
        return self.run(args)

    # --- Contracts ---
    def contract_address(self, name: str, chain: str) -> dict:
        return self.run(["contract", "address", name, "--chain", chain])

    def execute(
        self,
        signature: str,
        params: list,
        contract: str,
        address: str,
        chain: str,
        amount: Optional[str] = None,
    ) -> dict:
        args = [
            "wallet",
            "execute",
            signature,
            *[str(p) for p in params],
            "--contract",
            contract,
            "--address",
            address,
            "--chain",
            chain,
        ]
        if amount:
            args += ["--amount", amount]
        return self.run(args)

    # --- Services ---
    def services_search(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        service_type: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> dict:
        args = ["services", "search"]
        if query:
            args.append(query)
        if category:
            args += ["--category", category]
        if service_type:
            args += ["--type", service_type]
        if limit:
            args += ["--limit", str(limit)]
        if offset:
            args += ["--offset", str(offset)]
        return self.run(args)

    def services_inspect(
        self,
        url: str,
        method: Optional[str] = None,
        data: Optional[str] = None,
        headers: Optional[list[str]] = None,
    ) -> dict:
        args = ["services", "inspect", url]
        if method:
            args += ["--method", method]
        if data:
            args += ["--data", data]
        if headers:
            for h in headers:
                args += ["--header", h]
        return self.run(args)
