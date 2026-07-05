import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { err } from "./errors.js";

const execFileAsync = promisify(execFile);

/**
 * Circle Agent Stack via the `circle` CLI (`@circle-fin/cli`).
 *
 * Agent Wallets are user-controlled MPC wallets that the agent operates through
 * the CLI (authenticate, fund, transfer, bridge, swap, execute contract). This
 * module shells out to the CLI and parses its JSON output. It is separate from
 * the developer-controlled-wallets SDK path used elsewhere in the kit.
 *
 * Install once (globally or in the project): `npm install -g @circle-fin/cli`.
 */

export interface AgentCliOptions {
  /** Override the CLI binary name/path. Defaults to `circle`. */
  bin?: string;
  /** Use testnet sessions/commands. */
  testnet?: boolean;
  /** Per-call timeout in ms. Defaults to 180000 (bridges can be slow). */
  timeoutMs?: number;
  /** Accept CLI Terms of Use on first run (sets CIRCLE_ACCEPT_TERMS=1). */
  acceptTerms?: boolean;
}

export interface CliResult<T = unknown> {
  /** Parsed `data` field from CLI JSON output, when present. */
  data?: T;
  /** Raw stdout. */
  stdout: string;
  /** Raw stderr. */
  stderr: string;
}

function tryParseJson(stdout: string): any | undefined {
  const trimmed = stdout.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Some commands print a leading log line then JSON; grab the last {...} block.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

export class CircleAgentCli {
  private readonly bin: string;
  private readonly testnet: boolean;
  private readonly timeoutMs: number;
  private readonly acceptTerms: boolean;

  constructor(opts: AgentCliOptions = {}) {
    this.bin = opts.bin ?? "circle";
    this.testnet = Boolean(opts.testnet);
    this.timeoutMs = opts.timeoutMs ?? 180000;
    this.acceptTerms = opts.acceptTerms ?? true;
  }

  /** Run a raw CLI invocation. Adds --testnet when configured. */
  async run<T = unknown>(args: string[], addTestnet = false): Promise<CliResult<T>> {
    const finalArgs = addTestnet && this.testnet ? [...args, "--testnet"] : args;
    const env = { ...process.env };
    if (this.acceptTerms) env.CIRCLE_ACCEPT_TERMS = "1";

    try {
      const { stdout, stderr } = await execFileAsync(this.bin, finalArgs, {
        timeout: this.timeoutMs,
        env,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 10,
      });
      const parsed = tryParseJson(stdout);
      return { data: parsed?.data ?? parsed, stdout, stderr };
    } catch (e: any) {
      if (e?.code === "ENOENT") {
        throw err(
          "DEPENDENCY_MISSING",
          `Circle CLI ("${this.bin}") not found. Install it: npm install -g @circle-fin/cli`
        );
      }
      const detail = e?.stderr || e?.stdout || e?.message || String(e);
      throw err("UPSTREAM", `Circle CLI failed: ${detail}`, e);
    }
  }

  // --- Authentication ----------------------------------------------------

  /**
   * Non-interactive login step 1: send an OTP to `email`, returns a request id.
   * Complete with `loginComplete({ requestId, otp })`.
   */
  async loginInit(email: string): Promise<{ requestId?: string; raw: string }> {
    const res = await this.run(["wallet", "login", email, "--init"], true);
    // Request id may come back as JSON or plain text; capture both.
    const requestId =
      (res.data as any)?.requestId ??
      (res.data as any)?.request ??
      res.stdout.match(/request(?:\s*id)?[:\s]+([A-Za-z0-9-]+)/i)?.[1];
    return { requestId, raw: res.stdout };
  }

  /** Non-interactive login step 2: complete with request id + OTP. */
  async loginComplete(requestId: string, otp: string): Promise<CliResult> {
    return this.run(["wallet", "login", "--request", requestId, "--otp", otp]);
  }

  // --- Wallets -----------------------------------------------------------

  /** List agent wallets, optionally filtered by chain. */
  async listWallets(chain?: string): Promise<CliResult> {
    const args = ["wallet", "list", "--type", "agent"];
    if (chain) args.push("--chain", chain);
    return this.run(args);
  }

  /** Get an agent wallet's address for a chain. */
  async getAddress(chain: string): Promise<string | undefined> {
    const res = await this.listWallets(chain);
    const data: any = res.data;
    const list = Array.isArray(data) ? data : data?.wallets ?? [];
    return list[0]?.address ?? list[0]?.walletAddress;
  }

  /** Check on-chain balance for a wallet address. */
  async balance(address: string, chain: string): Promise<CliResult> {
    return this.run(["wallet", "balance", "--address", address, "--chain", chain]);
  }

  // --- Funding -----------------------------------------------------------

  /**
   * Fund a wallet. On testnet, omit amount/method to draw from the Circle
   * faucet. On mainnet, use method "crypto" (QR/EIP-681) or "fiat" (onramp).
   */
  async fund(params: {
    address: string;
    chain: string;
    amount?: string;
    method?: "crypto" | "fiat";
    token?: string;
  }): Promise<CliResult> {
    const args = ["wallet", "fund", "--address", params.address, "--chain", params.chain];
    if (params.amount) args.push("--amount", params.amount);
    if (params.method) args.push("--method", params.method);
    if (params.token) args.push("--token", params.token);
    // Print URLs instead of opening a browser (agent context).
    if (params.method === "fiat") args.push("--no-open");
    return this.run(args);
  }

  // --- Transfer ----------------------------------------------------------

  /** Transfer USDC (or --token) from the agent wallet to a recipient. */
  async transfer(params: {
    to: string;
    amount: string;
    address: string;
    chain: string;
    token?: string;
  }): Promise<CliResult> {
    const args = [
      "wallet",
      "transfer",
      params.to,
      "--amount",
      params.amount,
      "--address",
      params.address,
      "--chain",
      params.chain,
    ];
    if (params.token) args.push("--token", params.token);
    return this.run(args);
  }

  // --- Bridge (CCTP) -----------------------------------------------------

  async bridgeGetFee(toChain: string, fromChain: string): Promise<CliResult> {
    return this.run(["bridge", "get-fee", toChain, "--chain", fromChain]);
  }

  async bridgeTransfer(params: {
    toChain: string;
    amount: string;
    address: string;
    fromChain: string;
    recipient?: string;
  }): Promise<CliResult> {
    const args = [
      "bridge",
      "transfer",
      params.toChain,
      "--amount",
      params.amount,
      "--address",
      params.address,
      "--chain",
      params.fromChain,
    ];
    if (params.recipient) args.push("--recipient", params.recipient);
    return this.run(args);
  }

  async bridgeStatus(txHash: string, fromChain: string): Promise<CliResult> {
    return this.run(["bridge", "status", txHash, "--chain", fromChain]);
  }

  // --- Swap --------------------------------------------------------------

  /**
   * Swap tokens. Pass `quote: true` for a price quote (no execution). To
   * execute, provide `buyMin` (stop-limit) and `address`.
   */
  async swap(params: {
    sellToken: string;
    sellAmount: string;
    buyToken: string;
    buyMin?: string;
    address?: string;
    chain: string;
    quote?: boolean;
    slippageBps?: number;
  }): Promise<CliResult> {
    const args = ["wallet", "swap", params.sellToken, params.sellAmount, params.buyToken];
    if (params.quote) {
      args.push("--chain", params.chain, "--quote");
    } else {
      if (!params.buyMin) {
        throw err("VALIDATION", "swap execution requires buyMin (stop-limit).");
      }
      if (!params.address) {
        throw err("VALIDATION", "swap execution requires the wallet address.");
      }
      args.push(params.buyMin, "--address", params.address, "--chain", params.chain);
      if (params.slippageBps != null) args.push("--slippage-bps", String(params.slippageBps));
    }
    return this.run(args);
  }

  // --- Contracts ---------------------------------------------------------

  /** Look up a Circle contract address (usdc, cctp, gateway, ...). */
  async contractAddress(name: string, chain: string): Promise<CliResult> {
    return this.run(["contract", "address", name, "--chain", chain]);
  }

  /**
   * Execute a write function on a contract from the agent wallet.
   * `signature` is the ABI function signature; `params` are its args.
   */
  async execute(params: {
    signature: string;
    params: (string | number)[];
    contract: string;
    address: string;
    chain: string;
    amount?: string;
  }): Promise<CliResult> {
    const args = [
      "wallet",
      "execute",
      params.signature,
      ...params.params.map((p) => String(p)),
      "--contract",
      params.contract,
      "--address",
      params.address,
      "--chain",
      params.chain,
    ];
    if (params.amount) args.push("--amount", params.amount);
    return this.run(args);
  }

  // --- Services ----------------------------------------------------------

  /** Search for available services in the Circle Agent Marketplace. */
  async servicesSearch(params: {
    query?: string;
    category?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<CliResult> {
    const args = ["services", "search"];
    if (params.query) args.push(params.query);
    if (params.category) args.push("--category", params.category);
    if (params.type) args.push("--type", params.type);
    if (params.limit) args.push("--limit", String(params.limit));
    if (params.offset) args.push("--offset", String(params.offset));
    return this.run(args);
  }

  /** Inspect a service URL to see its price, schema, and requirements. */
  async servicesInspect(params: {
    url: string;
    method?: string;
    data?: string;
    headers?: string[];
  }): Promise<CliResult> {
    const args = ["services", "inspect", params.url];
    if (params.method) args.push("--method", params.method);
    if (params.data) args.push("--data", params.data);
    if (params.headers) {
      for (const h of params.headers) {
        args.push("--header", h);
      }
    }
    return this.run(args);
  }
}
