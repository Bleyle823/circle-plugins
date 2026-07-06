"""Circle Agent Kit — unified Python SDK for Circle + Arc agent wallets."""

from .agent_cli import CircleAgentCli
from .chains import CCTP_V2, CHAINS, DEFAULT_CHAIN, ChainInfo, get_chain, list_chains
from .contracts import address_to_bytes32
from .config import CircleAgentConfig, resolve_config
from .errors import CircleAgentError, err
from .kit import CircleAgentKit
from .requests import create_payment_request, faucet_info, request_faucet, to_base_units

__all__ = [
    "CircleAgentKit",
    "CircleAgentCli",
    "CircleAgentConfig",
    "resolve_config",
    "CircleAgentError",
    "err",
    "CHAINS",
    "CCTP_V2",
    "DEFAULT_CHAIN",
    "ChainInfo",
    "address_to_bytes32",
    "get_chain",
    "list_chains",
    "create_payment_request",
    "faucet_info",
    "request_faucet",
    "to_base_units",
]

__version__ = "0.1.0"
