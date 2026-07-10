"""Paywall URL helpers — aligned with @circle-plugins/plugin-eliza."""

from __future__ import annotations

import os
import re


def default_paywall_url() -> str:
    return os.getenv(
        "X402_PAYWALL_URL",
        f"http://localhost:{os.getenv('X402_PAYWALL_PORT', '4021')}/risk-profile",
    )


def normalize_paywall_url(url: str) -> str:
    trimmed = re.sub(r"[),.]+$", "", url)
    if "api.example.com" in trimmed:
        return default_paywall_url()
    if re.search(r"localhost(?::\d+)?/?$", trimmed, re.I) or re.search(
        r"127\.0\.0\.1(?::\d+)?/?$", trimmed, re.I
    ):
        return re.sub(r"/?$", "/risk-profile", trimmed)
    if trimmed.endswith("/risk-profile"):
        return trimmed
    if re.search(r"localhost:\d+/[^/]+$", trimmed, re.I) and not trimmed.endswith("/risk-profile"):
        return default_paywall_url()
    return trimmed


def resolve_paywall_url(url: str | None = None) -> str:
    return normalize_paywall_url((url or "").strip() or default_paywall_url())
