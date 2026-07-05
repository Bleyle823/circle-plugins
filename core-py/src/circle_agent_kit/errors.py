"""Shared error contract mirroring the TypeScript core."""

from __future__ import annotations

from typing import Any, Literal

CircleAgentErrorCode = Literal[
    "CONFIG_MISSING",
    "VALIDATION",
    "CONFIRMATION_REQUIRED",
    "MAINNET_BLOCKED",
    "NOT_FOUND",
    "DEPENDENCY_MISSING",
    "TRANSACTION_FAILED",
    "UPSTREAM",
]


class CircleAgentError(Exception):
    """Consistent error type surfaced by the kit."""

    def __init__(self, code: CircleAgentErrorCode, message: str, details: Any = None):
        super().__init__(message)
        self.code = code
        self.details = details


def err(code: CircleAgentErrorCode, message: str, details: Any = None) -> CircleAgentError:
    return CircleAgentError(code, message, details)
