"""Tool schemas — what the Hermes model reads to decide when to call each tool."""

CREATE_WALLET = {
    "name": "circle_create_wallet",
    "description": (
        "Create a new Circle developer-controlled agent wallet. Use when the user "
        "wants a fresh onchain wallet to hold or move USDC. Defaults to Arc Testnet."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "chain": {"type": "string", "description": "Chain id, e.g. ARC-TESTNET, BASE-SEPOLIA."},
            "account_type": {"type": "string", "enum": ["EOA", "SCA"], "description": "Default EOA."},
        },
    },
}

CHECK_BALANCE = {
    "name": "circle_check_balance",
    "description": "Get token balances (including USDC) for an agent wallet id.",
    "parameters": {
        "type": "object",
        "properties": {"wallet_id": {"type": "string", "description": "Wallet id to inspect."}},
        "required": ["wallet_id"],
    },
}

FAUCET_INFO = {
    "name": "circle_faucet_info",
    "description": "Get testnet faucet guidance for funding a wallet with USDC.",
    "parameters": {
        "type": "object",
        "properties": {"chain": {"type": "string", "description": "Chain id (default configured)."}},
    },
}

SEND_USDC = {
    "name": "circle_send_usdc",
    "description": (
        "Send USDC from an agent wallet to a destination address. Mainnet or large "
        "transfers require confirm=true. Always confirm destination and amount first."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "wallet_id": {"type": "string", "description": "Source wallet id."},
            "destination_address": {"type": "string", "description": "Recipient 0x address."},
            "amount": {"type": "string", "description": "USDC amount, e.g. '0.01'."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "confirm": {"type": "boolean", "description": "Confirm mainnet/large transfer."},
            "wait": {"type": "boolean", "description": "Wait for terminal state (default true)."},
        },
        "required": ["wallet_id", "destination_address", "amount"],
    },
}

REQUEST_USDC = {
    "name": "circle_request_usdc",
    "description": "Create a USDC payment request (invoice + EIP-681 payment URI/QR) to receive funds.",
    "parameters": {
        "type": "object",
        "properties": {
            "amount": {"type": "string", "description": "USDC amount requested."},
            "destination_address": {"type": "string", "description": "Address to receive payment."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "memo": {"type": "string", "description": "Optional note."},
        },
        "required": ["amount", "destination_address"],
    },
}

PAY_X402 = {
    "name": "circle_pay_x402",
    "description": (
        "Pay for an x402-compatible resource with a gas-free USDC nanopayment via "
        "Circle Gateway. Omit url to use the default local paywall (/risk-profile)."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "URL of the x402-compatible resource (default: local paywall).",
            },
            "method": {"type": "string", "description": "HTTP method (default GET)."},
            "body": {"type": "string", "description": "Optional request body."},
            "headers": {"type": "object", "description": "Optional request headers."},
        },
    },
}

REQUEST_FAUCET = {
    "name": "circle_request_faucet",
    "description": (
        "Request free testnet USDC (and native gas when needed) from the Circle faucet API. "
        "Testnet only — falls back to CIRCLE_WALLET_ID when wallet_id is omitted."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "wallet_id": {"type": "string", "description": "Wallet id to fund."},
            "address": {"type": "string", "description": "Wallet address to fund (alternative)."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "native": {"type": "boolean", "description": "Request native gas."},
            "usdc": {"type": "boolean", "description": "Request USDC (default true)."},
            "eurc": {"type": "boolean", "description": "Request EURC (default false)."},
        },
    },
}

GATEWAY_DEPOSIT = {
    "name": "circle_gateway_deposit",
    "description": "Deposit USDC into the Circle Gateway balance to fund nanopayments. Requires confirm=true.",
    "parameters": {
        "type": "object",
        "properties": {
            "amount": {"type": "string", "description": "USDC amount to deposit."},
            "confirm": {"type": "boolean", "description": "Explicit confirmation."},
        },
        "required": ["amount"],
    },
}

GATEWAY_BALANCE = {
    "name": "circle_gateway_balance",
    "description": "Check the Circle Gateway (nanopayments) USDC balance.",
    "parameters": {
        "type": "object",
        "properties": {"address": {"type": "string", "description": "Optional address to query."}},
    },
}

# --- Contracts / Bridge / Swap (SDK-native, dev-controlled wallet) -----------

EXECUTE_CONTRACT = {
    "name": "circle_execute_contract",
    "description": (
        "Execute a write function on a smart contract from a dev-controlled wallet "
        "(SDK-native). Always requires confirm=true."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "wallet_id": {"type": "string", "description": "Wallet id executing the call."},
            "contract_address": {"type": "string", "description": "Target contract (0x...)."},
            "abi_function_signature": {"type": "string", "description": 'e.g. "approve(address,uint256)".'},
            "abi_parameters": {"type": "array", "description": "Function args in order.", "items": {}},
            "call_data": {"type": "string", "description": "Raw calldata (alternative to signature)."},
            "amount": {"type": "string", "description": "Optional native value to send."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "confirm": {"type": "boolean", "description": "Explicit confirmation (required)."},
            "wait": {"type": "boolean", "description": "Wait for terminal state (default true)."},
        },
        "required": ["wallet_id", "contract_address"],
    },
}

BRIDGE_USDC = {
    "name": "circle_bridge_usdc",
    "description": (
        "Bridge USDC across chains via CCTP v2 using dev-controlled wallets "
        "(approve -> burn -> attest -> mint). Mainnet/large amounts require confirm=true."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "to_chain": {"type": "string", "description": "Destination chain id."},
            "source_wallet_id": {"type": "string", "description": "Source wallet id (on from_chain)."},
            "dest_wallet_id": {"type": "string", "description": "Destination wallet id (on to_chain)."},
            "amount": {"type": "string", "description": "USDC amount to bridge."},
            "from_chain": {"type": "string", "description": "Source chain id (default configured)."},
            "mint_recipient": {"type": "string", "description": "Optional mint recipient address."},
            "wait_for_mint": {"type": "boolean", "description": "Wait and mint (default true)."},
            "confirm": {"type": "boolean", "description": "Explicit confirmation."},
        },
        "required": ["to_chain", "source_wallet_id", "dest_wallet_id", "amount"],
    },
}

SWAP_QUOTE = {
    "name": "circle_swap_quote",
    "description": "Get a DEX swap quote (SDK-native, via configured aggregator). sell_amount in base units.",
    "parameters": {
        "type": "object",
        "properties": {
            "sell_token": {"type": "string", "description": "Sell token address (0x...)."},
            "buy_token": {"type": "string", "description": "Buy token address (0x...)."},
            "sell_amount": {"type": "string", "description": "Amount to sell in base units."},
            "taker_address": {"type": "string", "description": "Wallet address executing the swap."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "slippage_bps": {"type": "number", "description": "Max slippage in basis points."},
        },
        "required": ["sell_token", "buy_token", "sell_amount", "taker_address"],
    },
}

SWAP = {
    "name": "circle_swap",
    "description": (
        "Swap one token for another from a dev-controlled wallet (SDK-native, via configured "
        "DEX aggregator). sell_amount is base units. Mainnet/large swaps require confirm=true."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "wallet_id": {"type": "string", "description": "Wallet id executing the swap."},
            "wallet_address": {"type": "string", "description": "Wallet address (taker)."},
            "sell_token": {"type": "string", "description": "Sell token address (0x...)."},
            "buy_token": {"type": "string", "description": "Buy token address (0x...)."},
            "sell_amount": {"type": "string", "description": "Amount to sell in base units."},
            "chain": {"type": "string", "description": "Chain id (default configured)."},
            "slippage_bps": {"type": "number", "description": "Max slippage in basis points."},
            "confirm": {"type": "boolean", "description": "Explicit confirmation."},
        },
        "required": ["wallet_id", "wallet_address", "sell_token", "buy_token", "sell_amount"],
    },
}

SERVICES_SEARCH = {
    "name": "circle_services_search",
    "description": (
        "Search for available paid services in the Circle Agent Marketplace. "
        "Use to find APIs for domain search, crypto prices, research, etc."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search keyword."},
            "category": {"type": "string", "description": "Filter by category."},
            "service_type": {"type": "string", "description": "Filter by type."},
            "limit": {"type": "integer", "description": "Max results."},
            "offset": {"type": "integer", "description": "Pagination offset."},
        },
    },
}

SERVICES_INSPECT = {
    "name": "circle_services_inspect",
    "description": "Inspect a service URL to see its price, schema, and requirements.",
    "parameters": {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Service URL to inspect."},
            "method": {"type": "string", "description": "HTTP method override."},
            "data": {"type": "string", "description": "JSON request body override."},
            "headers": {"type": "array", "items": {"type": "string"}, "description": "Custom headers."},
        },
        "required": ["url"],
    },
}
