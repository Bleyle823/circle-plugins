"""Circle Agent Kit plugin for Hermes Agent — wiring schemas to handlers."""

import logging

from . import schemas, tools

logger = logging.getLogger(__name__)

TOOLSET = "circle"


def _handle_circle_command(raw_args: str) -> str:
    """Slash command: /circle [status]  (in-session)."""
    arg = (raw_args or "").strip()
    if arg in ("", "status"):
        return tools.status_summary()
    if arg == "help":
        return (
            "Usage: /circle [status|help]. Circle wallet tools are available to the "
            "model. Dev-controlled: circle_create_wallet, circle_check_balance, "
            "circle_send_usdc, circle_request_usdc, circle_pay_x402, "
            "circle_gateway_deposit, circle_gateway_balance, circle_faucet_info, "
            "circle_execute_contract, circle_bridge_usdc, circle_swap_quote, circle_swap."
        )
    return f"Unknown /circle argument '{arg}'. Try /circle help."


def _cli_handler(args):
    """Handler for `hermes circle <subcommand>`."""
    sub = getattr(args, "circle_command", None)
    if sub == "status" or sub is None:
        print(tools.status_summary())
    else:
        print("Usage: hermes circle status")


def _setup_cli(subparser):
    subs = subparser.add_subparsers(dest="circle_command")
    subs.add_parser("status", help="Show Circle Agent Kit status")
    subparser.set_defaults(func=_cli_handler)


def register(ctx):
    """Register Circle tools, a /circle slash command, and a CLI subcommand."""
    tool_specs = [
        (schemas.CREATE_WALLET, tools.create_wallet),
        (schemas.CHECK_BALANCE, tools.check_balance),
        (schemas.FAUCET_INFO, tools.faucet_info),
        (schemas.SEND_USDC, tools.send_usdc),
        (schemas.REQUEST_USDC, tools.request_usdc),
        (schemas.PAY_X402, tools.pay_x402),
        (schemas.GATEWAY_DEPOSIT, tools.gateway_deposit),
        (schemas.GATEWAY_BALANCE, tools.gateway_balance),
        (schemas.EXECUTE_CONTRACT, tools.execute_contract),
        (schemas.BRIDGE_USDC, tools.bridge_usdc),
        (schemas.SWAP_QUOTE, tools.swap_quote),
        (schemas.SWAP, tools.swap),
        (schemas.SERVICES_SEARCH, tools.services_search),
        (schemas.SERVICES_INSPECT, tools.services_inspect),
    ]
    for schema, handler in tool_specs:
        ctx.register_tool(
            name=schema["name"],
            toolset=TOOLSET,
            schema=schema,
            handler=handler,
        )

    ctx.register_command(
        "circle",
        handler=_handle_circle_command,
        description="Show Circle Agent Kit status / help",
    )

    ctx.register_cli_command(
        name="circle",
        help="Manage Circle Agent Kit",
        setup_fn=_setup_cli,
        handler_fn=_cli_handler,
    )

    logger.info("circle-agent-kit registered %d tools", len(tool_specs))
