"""Circle Plugins for Hermes — registration, hooks, slash/CLI commands, skills."""

from __future__ import annotations

import logging
from pathlib import Path

try:
    from . import schemas, tools
except ImportError:
    import schemas, tools

logger = logging.getLogger(__name__)

TOOLSET = "circle"
_PLUGIN_DIR = Path(__file__).parent

# Lightweight audit trail for Circle tool calls (last 100).
_call_log: list[dict] = []


def _on_post_tool_call(tool_name, args, result, task_id, **kwargs):
    """Hook: log Circle tool invocations for debugging."""
    del args, result, kwargs
    if not str(tool_name).startswith("circle_"):
        return
    _call_log.append({"tool": tool_name, "session": task_id})
    if len(_call_log) > 100:
        _call_log.pop(0)
    logger.debug("Circle tool called: %s (session %s)", tool_name, task_id)


def _handle_circle_command(raw_args: str) -> str:
    """Slash command: /circle [status|help|log]."""
    arg = (raw_args or "").strip().lower()
    if arg in ("", "status"):
        return tools.status_summary()
    if arg == "help":
        return (
            "Usage: /circle [status|help|log]. Circle wallet tools are available to the "
            "model when CIRCLE_API_KEY and ENTITY_SECRET are set. Tools: "
            "circle_create_wallet, circle_check_balance, circle_send_usdc, "
            "circle_request_usdc, circle_pay_x402, circle_gateway_deposit, "
            "circle_gateway_balance, circle_faucet_info, circle_request_faucet, "
            "circle_execute_contract, circle_bridge_usdc, circle_swap_quote, circle_swap, "
            "circle_services_search, circle_services_inspect. "
            "Load skill_view('circle-plugins:circle-wallets') for workflows."
        )
    if arg == "log":
        if not _call_log:
            return "No Circle tool calls recorded this session."
        lines = [f"- {e['tool']} (session {e['session']})" for e in _call_log[-10:]]
        return "Recent Circle tool calls:\n" + "\n".join(lines)
    return f"Unknown /circle argument '{arg}'. Try /circle help."


def _cli_handler(args):
    """Handler for ``hermes circle <subcommand>``."""
    sub = getattr(args, "circle_command", None)
    if sub == "status" or sub is None:
        print(tools.status_summary())
    elif sub == "log":
        if not _call_log:
            print("No Circle tool calls recorded.")
        else:
            for entry in _call_log[-20:]:
                print(f"{entry['tool']}\t{entry['session']}")
    else:
        print("Usage: hermes circle <status|log>")


def _setup_cli(subparser):
    subs = subparser.add_subparsers(dest="circle_command")
    subs.add_parser("status", help="Show Circle plugin status")
    subs.add_parser("log", help="Show recent Circle tool call log")
    subparser.set_defaults(func=_cli_handler)


def _register_skills(ctx) -> None:
    skills_dir = _PLUGIN_DIR / "skills"
    if not skills_dir.is_dir():
        return
    for child in sorted(skills_dir.iterdir()):
        skill_md = child / "SKILL.md"
        if child.is_dir() and skill_md.exists():
            ctx.register_skill(child.name, skill_md)


def register(ctx):
    """Wire schemas to handlers and register hooks, commands, and skills."""
    tool_specs = [
        (schemas.CREATE_WALLET, tools.create_wallet),
        (schemas.CHECK_BALANCE, tools.check_balance),
        (schemas.FAUCET_INFO, tools.faucet_info),
        (schemas.REQUEST_FAUCET, tools.request_faucet),
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
            check_fn=tools.is_available,
            emoji="⭕",
        )

    ctx.register_hook("post_tool_call", _on_post_tool_call)

    ctx.register_command(
        "circle",
        handler=_handle_circle_command,
        description="Circle wallet status, help, and tool-call log",
        args_hint="[status|help|log]",
    )

    ctx.register_cli_command(
        name="circle",
        help="Manage Circle Plugins",
        setup_fn=_setup_cli,
        handler_fn=_cli_handler,
    )

    _register_skills(ctx)

    logger.info("circle-plugins registered %d tools", len(tool_specs))
