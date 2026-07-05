"""Chain registry — mirrors packages/core-ts/src/chains.ts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .errors import err


@dataclass(frozen=True)
class ChainInfo:
    id: str
    name: str
    testnet: bool
    usdc_decimals: int
    usdc_is_gas: bool
    chain_id: Optional[int] = None
    usdc_address: Optional[str] = None
    rpc_url: Optional[str] = None
    explorer: Optional[str] = None
    cctp_domain: Optional[int] = None


CHAINS: dict[str, ChainInfo] = {
    "ARC-TESTNET": ChainInfo(
        id="ARC-TESTNET",
        name="Arc Testnet",
        chain_id=5042002,
        testnet=True,
        usdc_address="0x3600000000000000000000000000000000000000",
        usdc_decimals=6,
        rpc_url="https://rpc.testnet.arc.network",
        explorer="https://testnet.arcscan.app",
        usdc_is_gas=True,
        cctp_domain=26,
    ),
    "BASE-SEPOLIA": ChainInfo(
        id="BASE-SEPOLIA",
        name="Base Sepolia",
        chain_id=84532,
        testnet=True,
        usdc_address="0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        usdc_decimals=6,
        explorer="https://sepolia.basescan.org",
        usdc_is_gas=False,
        cctp_domain=6,
    ),
    "ARB-SEPOLIA": ChainInfo(
        id="ARB-SEPOLIA",
        name="Arbitrum Sepolia",
        chain_id=421614,
        testnet=True,
        usdc_address="0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
        usdc_decimals=6,
        explorer="https://sepolia.arbiscan.io",
        usdc_is_gas=False,
        cctp_domain=3,
    ),
    "MATIC-AMOY": ChainInfo(
        id="MATIC-AMOY",
        name="Polygon Amoy",
        chain_id=80002,
        testnet=True,
        usdc_address="0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
        usdc_decimals=6,
        explorer="https://amoy.polygonscan.com",
        usdc_is_gas=False,
        cctp_domain=7,
    ),
    "ETH-SEPOLIA": ChainInfo(
        id="ETH-SEPOLIA",
        name="Ethereum Sepolia",
        chain_id=11155111,
        testnet=True,
        usdc_address="0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
        usdc_decimals=6,
        explorer="https://sepolia.etherscan.io",
        usdc_is_gas=False,
        cctp_domain=0,
    ),
    "BASE-MAINNET": ChainInfo(
        id="BASE-MAINNET",
        name="Base",
        chain_id=8453,
        testnet=False,
        usdc_address="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        usdc_decimals=6,
        explorer="https://basescan.org",
        usdc_is_gas=False,
        cctp_domain=6,
    ),
}

DEFAULT_CHAIN = "ARC-TESTNET"

# CCTP v2 uses uniform contract addresses across supported EVM chains.
CCTP_V2 = {
    "token_messenger": "0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d",
    "message_transmitter": "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64",
    "attestation_api": {
        "testnet": "https://iris-api-sandbox.circle.com",
        "mainnet": "https://iris-api.circle.com",
    },
}


def list_chains() -> list[ChainInfo]:
    return list(CHAINS.values())


def get_chain(chain_id: str) -> ChainInfo:
    chain = CHAINS.get((chain_id or "").upper())
    if chain is None:
        raise err(
            "VALIDATION",
            f'Unknown chain "{chain_id}". Known chains: {", ".join(CHAINS)}',
        )
    return chain


ID_TO_APPKIT_CHAIN: dict[str, str] = {
    "ARC-TESTNET": "Arc_Testnet",
    "BASE-SEPOLIA": "Base_Sepolia",
    "ARB-SEPOLIA": "Arbitrum_Sepolia",
    "MATIC-AMOY": "Polygon_Amoy",
    "ETH-SEPOLIA": "Ethereum_Sepolia",
    "BASE-MAINNET": "Base",
}
