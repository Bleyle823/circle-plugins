import {
  CircleWalletsClient,
  createWalletsClient,
} from "./client.js";
import {
  CircleAgentConfig,
  resolveConfig,
} from "./config.js";
import { getChain, listChains, type ChainInfo, ID_TO_APPKIT_CHAIN } from "./chains.js";
import { assertConfirmed, assertPositiveAmount, assertValidAddress } from "./guardrails.js";
import { err } from "./errors.js";
import { CircleAgentCli, type CliResult } from "./agent-cli.js";
import * as wallets from "./wallets.js";
import * as transfers from "./transfers.js";
import * as nano from "./nanopayments.js";
import * as contracts from "./contracts.js";
import { createPaymentRequest, faucetInfo, requestFaucet } from "./requests.js";
import type {
  FaucetResult,
  FeeEstimate,
  GatewayBalance,
  NanopaymentResult,
  PaymentRequest,
  TokenBalance,
  TransactionInfo,
  WalletInfo,
} from "./types.js";

/**
 * CircleAgentKit — the unified capability surface. Every agent-framework plugin
 * (Eliza, OpenClaw, Hermes) is a thin adapter over this class.
 */
export class CircleAgentKit {
  readonly config: CircleAgentConfig;
  private _client?: CircleWalletsClient;
  private _cli?: CircleAgentCli;

  private constructor(config: CircleAgentConfig, client?: CircleWalletsClient) {
    this.config = config;
    this._client = client;
  }

  /**
   * Build a kit from overrides + environment. Pass `client` to inject a mock
   * (used in tests / alternative transports).
   */
  static create(
    overrides: Partial<CircleAgentConfig> = {},
    client?: CircleWalletsClient
  ): CircleAgentKit {
    return new CircleAgentKit(resolveConfig(overrides), client);
  }

  private async client(): Promise<CircleWalletsClient> {
    if (!this._client) this._client = await createWalletsClient(this.config);
    return this._client;
  }

  private chainOr(chain?: string): string {
    return chain ?? this.config.defaultChain;
  }

  private appKitChain(chain?: string): any {
    const id = this.chainOr(chain).toUpperCase();
    const mapped = ID_TO_APPKIT_CHAIN[id];
    if (!mapped) {
      throw err("VALIDATION", `Chain "${id}" is not supported by App Kit (yet).`);
    }
    return mapped;
  }

  // --- Chains ------------------------------------------------------------
  listChains(): ChainInfo[] {
    return listChains();
  }
  getChain(id?: string): ChainInfo {
    return getChain(this.chainOr(id));
  }

  // --- Wallets -----------------------------------------------------------
  async createWalletSet(name?: string) {
    return wallets.createWalletSet(await this.client(), name);
  }

  /**
   * Create an agent wallet. Reuses config.walletSetId when present, otherwise
   * creates a new wallet set first.
   */
  async createWallet(params: {
    chain?: string;
    accountType?: "EOA" | "SCA";
    walletSetId?: string;
  } = {}): Promise<WalletInfo> {
    const client = await this.client();
    let walletSetId = params.walletSetId ?? this.config.walletSetId;
    if (!walletSetId) {
      walletSetId = (await wallets.createWalletSet(client)).id;
    }
    const created = await wallets.createWallet(client, {
      walletSetId,
      chain: this.chainOr(params.chain),
      accountType: params.accountType,
    });
    return created[0];
  }

  async listWallets(params: { walletSetId?: string; chain?: string } = {}) {
    return wallets.listWallets(await this.client(), {
      walletSetId: params.walletSetId ?? this.config.walletSetId,
      chain: params.chain,
    });
  }

  async getAddress(walletId: string): Promise<string> {
    return wallets.getAddress(await this.client(), walletId);
  }

  async getBalance(walletId: string): Promise<TokenBalance[]> {
    return wallets.getBalance(await this.client(), walletId);
  }

  async getUsdcBalance(walletId: string): Promise<string> {
    return wallets.getUsdcBalance(await this.client(), walletId);
  }

  // --- Transfers ---------------------------------------------------------
  async estimateFee(params: {
    walletId: string;
    destinationAddress: string;
    amount: string;
    chain?: string;
  }): Promise<FeeEstimate> {
    return transfers.estimateFee(await this.client(), {
      ...params,
      chain: this.chainOr(params.chain),
    });
  }

  /**
   * Send USDC. Enforces validation + mainnet/high-value confirmation guardrails.
   */
  async sendUSDC(params: {
    walletId: string;
    destinationAddress: string;
    amount: string;
    chain?: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
    confirm?: boolean;
    wait?: boolean;
  }): Promise<TransactionInfo> {
    const chainId = this.chainOr(params.chain);
    const amountNum = assertPositiveAmount(params.amount);
    assertValidAddress(params.destinationAddress, chainId);
    assertConfirmed(this.config, "sendUSDC", amountNum, { confirm: params.confirm });

    const client = await this.client();
    const address = await this.getAddress(params.walletId);

    const step = await client.appKit.send({
      from: {
        adapter: client.adapter,
        chain: this.appKitChain(chainId),
        address,
      },
      to: params.destinationAddress,
      amount: params.amount,
      token: "USDC",
    });

    return {
      id: step.txHash ? `tx:${step.txHash}` : "pending",
      state: step.state === "success" ? "COMPLETE" : step.state.toUpperCase(),
      txHash: step.txHash,
      explorerUrl: step.explorerUrl,
    };
  }

  async getTransaction(id: string, chain?: string): Promise<TransactionInfo> {
    return transfers.getTransaction(await this.client(), id, this.chainOr(chain));
  }

  async waitForTransaction(
    id: string,
    opts: { chain?: string; intervalMs?: number; timeoutMs?: number } = {}
  ): Promise<TransactionInfo> {
    return transfers.waitForTransaction(await this.client(), id, {
      ...opts,
      chain: this.chainOr(opts.chain),
    });
  }

  async accelerateTransaction(id: string) {
    return transfers.accelerateTransaction(await this.client(), id);
  }

  async cancelTransaction(id: string) {
    return transfers.cancelTransaction(await this.client(), id);
  }

  // --- Nanopayments (x402) ----------------------------------------------
  async gatewayDeposit(amount: string, confirm?: boolean) {
    assertConfirmed(this.config, "gatewayDeposit", assertPositiveAmount(amount), {
      confirm,
    });
    return nano.gatewayDeposit(this.config, amount);
  }

  async payX402(
    url: string,
    options?: { method?: string; body?: unknown; headers?: Record<string, string> }
  ): Promise<NanopaymentResult> {
    return nano.payX402(this.config, url, options);
  }

  async gatewayBalance(address?: string): Promise<GatewayBalance> {
    return nano.gatewayBalance(this.config, address);
  }

  async gatewayWithdraw(amount: string, confirm?: boolean) {
    assertConfirmed(this.config, "gatewayWithdraw", assertPositiveAmount(amount), {
      confirm,
    });
    return nano.gatewayWithdraw(this.config, amount);
  }

  async requirePayment(params: { sellerAddress: string; price?: string; chain?: string }) {
    return nano.requirePayment(params);
  }

  // --- Requests ----------------------------------------------------------
  createPaymentRequest(params: {
    amount: string;
    destinationAddress: string;
    chain?: string;
    memo?: string;
    tokenAddress?: string;
  }): PaymentRequest {
    return createPaymentRequest({ ...params, chain: this.chainOr(params.chain) });
  }

  faucetInfo(chain?: string) {
    return faucetInfo(this.chainOr(chain));
  }

  // --- Contracts / Bridge / Swap (SDK-native) ---------------------------
  // These provide the CLI Agent Stack's execute/bridge/swap using the same
  // developer-controlled wallet as the rest of the kit (no CLI required).

  /**
   * Execute a write function on a smart contract. Always requires confirm
   * (arbitrary calls can move funds).
   */
  async executeContract(params: {
    walletId: string;
    contractAddress: string;
    abiFunctionSignature?: string;
    abiParameters?: unknown[];
    callData?: string;
    amount?: string;
    chain?: string;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
    confirm?: boolean;
    wait?: boolean;
  }): Promise<TransactionInfo> {
    const chain = this.chainOr(params.chain);
    assertValidAddress(params.contractAddress, chain);
    if (!params.confirm) {
      throw err(
        "CONFIRMATION_REQUIRED",
        `"executeContract" can move funds via arbitrary contract calls and requires confirm: true ` +
          `after verifying the contract, function signature, and parameters.`
      );
    }
    const client = await this.client();
    const tx = await contracts.executeContract(client, params);
    if (params.wait) return transfers.waitForTransaction(client, tx.id, { chain });
    return tx;
  }

  /**
   * Bridge USDC across chains via CCTP v2. Needs a source wallet (on fromChain)
   * and a destination wallet (on toChain). Applies confirmation guardrails.
   */
  async bridgeUSDC(params: {
    fromChain?: string;
    toChain: string;
    sourceWalletId: string;
    destWalletId: string;
    amount: string;
    mintRecipient?: string;
    waitForMint?: boolean;
    confirm?: boolean;
  }): Promise<contracts.BridgeResult> {
    const fromChain = this.chainOr(params.fromChain);
    const amountNum = assertPositiveAmount(params.amount);
    assertConfirmed(this.config, "bridgeUSDC", amountNum, { confirm: params.confirm });
    const client = await this.client();
    return contracts.bridgeUSDC(client, this.config, { ...params, fromChain });
  }

  /** Get a swap quote from the Circle App Kit (base-unit sellAmount). */
  async swapQuote(params: {
    chain?: string;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    takerAddress: string;
    slippageBps?: number;
  }): Promise<contracts.SwapQuote> {
    const client = await this.client();
    return contracts.getSwapQuote(client, this.config, {
      ...params,
      chain: this.chainOr(params.chain),
    });
  }

  /**
   * Swap one token for another from a wallet via the Circle App Kit.
   * `sellAmount` is in base units. Applies confirmation guardrails.
   */
  async swap(params: {
    walletId: string;
    walletAddress: string;
    chain?: string;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    slippageBps?: number;
    feeLevel?: "LOW" | "MEDIUM" | "HIGH";
    confirm?: boolean;
  }) {
    const chain = this.chainOr(params.chain);
    assertConfirmed(this.config, "swap", undefined, { confirm: params.confirm });
    const client = await this.client();
    return contracts.swap(client, this.config, { ...params, chain });
  }

  /**
   * Self-serve testnet funding: request USDC (and native gas, when relevant)
   * from Circle's faucet for a wallet. Resolves `address` from `walletId` when
   * only an id is given.
   */
  async requestFaucet(
    params: {
      walletId?: string;
      address?: string;
      chain?: string;
      native?: boolean;
      usdc?: boolean;
      eurc?: boolean;
    } = {}
  ): Promise<FaucetResult> {
    const chain = this.chainOr(params.chain);
    const address =
      params.address ?? (params.walletId ? await this.getAddress(params.walletId) : undefined);
    if (!address) {
      throw err(
        "VALIDATION",
        "requestFaucet needs either a walletId (to look up its address) or an explicit address."
      );
    }
    return requestFaucet({
      apiKey: this.config.apiKey,
      address,
      chain,
      native: params.native,
      usdc: params.usdc,
      eurc: params.eurc,
    });
  }

  // --- Agent Stack (Circle CLI) -----------------------------------------
  // User-custody MPC agent wallets operated via the `circle` CLI. Separate
  // from the developer-controlled SDK methods above. See agent-cli.ts.

  /** Lazily construct the Circle CLI adapter (testnet-aware). */
  agentCli(): CircleAgentCli {
    if (!this._cli) {
      this._cli = new CircleAgentCli({
        bin: this.config.cliBin,
        testnet: this.config.network !== "MAINNET",
      });
    }
    return this._cli;
  }

  /** Start email login: sends an OTP, returns a request id to complete with. */
  async agentLoginInit(email: string) {
    return this.agentCli().loginInit(email);
  }

  /** Complete email login with the request id and OTP from the inbox. */
  async agentLoginComplete(requestId: string, otp: string) {
    return this.agentCli().loginComplete(requestId, otp);
  }

  /** List agent wallets (optionally by chain). */
  async agentListWallets(chain?: string): Promise<CliResult> {
    return this.agentCli().listWallets(chain);
  }

  /** Resolve the agent wallet address for a chain. */
  async agentGetAddress(chain?: string): Promise<string | undefined> {
    return this.agentCli().getAddress(this.chainOr(chain));
  }

  /** On-chain balance for an agent wallet address. */
  async agentBalance(address: string, chain?: string): Promise<CliResult> {
    return this.agentCli().balance(address, this.chainOr(chain));
  }

  /**
   * Fund an agent wallet. Testnet draws from the Circle faucet (omit
   * amount/method). Mainnet crypto/fiat funding requires confirm.
   */
  async agentFund(params: {
    address: string;
    chain?: string;
    amount?: string;
    method?: "crypto" | "fiat";
    token?: string;
    confirm?: boolean;
  }): Promise<CliResult> {
    const chain = this.chainOr(params.chain);
    if (this.config.network === "MAINNET") {
      assertConfirmed(this.config, "agentFund", params.amount ? Number(params.amount) : undefined, {
        confirm: params.confirm,
      });
    }
    return this.agentCli().fund({ ...params, chain });
  }

  /** Transfer USDC (or token) from the agent wallet. Guardrails applied. */
  async agentTransfer(params: {
    to: string;
    amount: string;
    address: string;
    chain?: string;
    token?: string;
    confirm?: boolean;
  }): Promise<CliResult> {
    const chain = this.chainOr(params.chain);
    const amountNum = assertPositiveAmount(params.amount);
    assertValidAddress(params.to, chain);
    assertConfirmed(this.config, "agentTransfer", amountNum, { confirm: params.confirm });
    return this.agentCli().transfer({
      to: params.to,
      amount: params.amount,
      address: params.address,
      chain,
      token: params.token,
    });
  }

  /** Estimate the CCTP bridge fee from one chain to another. */
  async agentBridgeFee(toChain: string, fromChain?: string): Promise<CliResult> {
    return this.agentCli().bridgeGetFee(toChain, this.chainOr(fromChain));
  }

  /** Bridge USDC across chains via CCTP. Guardrails applied. */
  async agentBridge(params: {
    toChain: string;
    amount: string;
    address: string;
    fromChain?: string;
    recipient?: string;
    confirm?: boolean;
  }): Promise<CliResult> {
    const fromChain = this.chainOr(params.fromChain);
    const amountNum = assertPositiveAmount(params.amount);
    assertConfirmed(this.config, "agentBridge", amountNum, { confirm: params.confirm });
    return this.agentCli().bridgeTransfer({
      toChain: params.toChain,
      amount: params.amount,
      address: params.address,
      fromChain,
      recipient: params.recipient,
    });
  }

  /** Check the status of an in-flight bridge by burn tx hash. */
  async agentBridgeStatus(txHash: string, fromChain?: string): Promise<CliResult> {
    return this.agentCli().bridgeStatus(txHash, this.chainOr(fromChain));
  }

  /** Get a swap price quote (no execution). */
  async agentSwapQuote(params: {
    sellToken: string;
    sellAmount: string;
    buyToken: string;
    chain?: string;
  }): Promise<CliResult> {
    return this.agentCli().swap({
      sellToken: params.sellToken,
      sellAmount: params.sellAmount,
      buyToken: params.buyToken,
      chain: this.chainOr(params.chain),
      quote: true,
    });
  }

  /** Execute a token swap from the agent wallet. Guardrails applied. */
  async agentSwap(params: {
    sellToken: string;
    sellAmount: string;
    buyToken: string;
    buyMin: string;
    address: string;
    chain?: string;
    slippageBps?: number;
    confirm?: boolean;
  }): Promise<CliResult> {
    const chain = this.chainOr(params.chain);
    const amountNum = assertPositiveAmount(params.sellAmount);
    assertConfirmed(this.config, "agentSwap", amountNum, { confirm: params.confirm });
    return this.agentCli().swap({ ...params, chain, quote: false });
  }

  /** Look up a Circle contract address (usdc, cctp, gateway, ...). */
  async agentContractAddress(name: string, chain?: string): Promise<CliResult> {
    return this.agentCli().contractAddress(name, this.chainOr(chain));
  }

  /** Search for available services in the Circle Agent Marketplace. */
  async servicesSearch(params: {
    query?: string;
    category?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<CliResult> {
    return this.agentCli().servicesSearch(params);
  }

  /** Inspect a service URL to see its price, schema, and requirements. */
  async servicesInspect(params: {
    url: string;
    method?: string;
    data?: string;
    headers?: string[];
  }): Promise<CliResult> {
    return this.agentCli().servicesInspect(params);
  }

  /**
   * Execute a write function on a smart contract from the agent wallet.
   * Requires confirm (arbitrary contract calls can move funds).
   */
  async agentExecuteContract(params: {
    signature: string;
    params: (string | number)[];
    contract: string;
    address: string;
    chain?: string;
    amount?: string;
    confirm?: boolean;
  }): Promise<CliResult> {
    const chain = this.chainOr(params.chain);
    assertValidAddress(params.contract, chain);
    if (!params.confirm) {
      throw err(
        "CONFIRMATION_REQUIRED",
        `"agentExecuteContract" can move funds via arbitrary contract calls and requires explicit confirmation. ` +
          `Re-run with confirm: true after verifying the contract, function signature, and parameters.`
      );
    }
    assertConfirmed(this.config, "agentExecuteContract", undefined, { confirm: params.confirm });
    return this.agentCli().execute({
      signature: params.signature,
      params: params.params,
      contract: params.contract,
      address: params.address,
      chain,
      amount: params.amount,
    });
  }
}
