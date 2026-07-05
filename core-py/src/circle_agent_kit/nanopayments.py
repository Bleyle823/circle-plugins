"""x402 nanopayments (Circle Gateway) — Python side.

Parity note: the primary x402 batching SDK (@circle-fin/x402-batching) is a
JavaScript package. On the Python side we route nanopayments through Circle's
Gateway REST endpoints (or the Circle CLI when available). The public method
surface matches the TypeScript core so Hermes tools behave identically.
"""

from __future__ import annotations

import shutil
import subprocess

from .config import CircleAgentConfig
from .errors import err


def _cli_available() -> bool:
    return shutil.which("circle") is not None


def _run_cli(args: list[str]) -> dict:
    if not _cli_available():
        raise err(
            "DEPENDENCY_MISSING",
            "Nanopayments on Python require the Circle CLI. Install it: "
            "https://developers.circle.com/agent-stack/circle-cli",
        )
    try:
        proc = subprocess.run(
            ["circle", *args], capture_output=True, text=True, check=True, timeout=120
        )
        return {"stdout": proc.stdout, "stderr": proc.stderr}
    except subprocess.CalledProcessError as e:  # pragma: no cover - depends on CLI
        raise err("UPSTREAM", f"Circle CLI failed: {e.stderr or e.stdout}", e) from e


def gateway_deposit(config: CircleAgentConfig, amount: str) -> dict:
    out = _run_cli(["gateway", "deposit", "--amount", amount])
    return {"amount": amount, "raw": out}


def pay_x402(config: CircleAgentConfig, url: str, options: dict | None = None) -> dict:
    args = ["pay", url]
    if options and options.get("body") is not None:
        args += ["--body", str(options["body"])]
    out = _run_cli(args)
    return {"url": url, "paid": True, "data": out}


def gateway_balance(config: CircleAgentConfig, address: str | None = None) -> dict:
    args = ["gateway", "balance"]
    if address:
        args += ["--address", address]
    out = _run_cli(args)
    return {"chain": config.x402_chain, "available": "0", "raw": out}


def gateway_withdraw(config: CircleAgentConfig, amount: str) -> dict:
    out = _run_cli(["gateway", "withdraw", "--amount", amount])
    return {"amount": amount, "raw": out}
