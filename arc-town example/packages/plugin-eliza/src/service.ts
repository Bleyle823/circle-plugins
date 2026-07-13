import { Service, type IAgentRuntime, type ServiceTypeName, logger } from "@elizaos/core";
import { CircleAgentKit } from "@circle-plugins/core";
import { envSetting } from "./env.js";

/**
 * CircleService — owns and manages the CircleAgentKit instance for the agent.
 * Actions and providers resolve it via runtime.getService(CircleService.serviceType).
 */
export class CircleService extends Service {
  static serviceType: ServiceTypeName = "circle" as ServiceTypeName;
  private _kit?: CircleAgentKit;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<CircleService> {
    const service = new CircleService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    const service = runtime.getService<CircleService>(CircleService.serviceType);
    if (service) {
      await service.stop();
    }
  }

  get capabilityDescription(): string {
    return "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, and payment requests.";
  }

  async initialize(_runtime: IAgentRuntime): Promise<void> {
    // Kit is lazily initialized on first use to ensure env is ready.
  }

  async stop(): Promise<void> {
    // No specific cleanup needed for CircleAgentKit
  }

  get kit(): CircleAgentKit {
    if (!this._kit) {
      const r = this.runtime;
      const apiKey = envSetting(r, "CIRCLE_API_KEY");
      const entitySecret =
        envSetting(r, "ENTITY_SECRET") ?? envSetting(r, "CIRCLE_ENTITY_SECRET");
      const x402PrivateKey =
        envSetting(r, "X402_PRIVATE_KEY") ?? envSetting(r, "CLIENT_PRIVATE_KEY");

      try {
        this._kit = CircleAgentKit.create({
          apiKey: apiKey ?? "dummy",
          entitySecret: entitySecret ?? "dummy",
          network: (envSetting(r, "CIRCLE_NETWORK") as "TESTNET" | "MAINNET") ?? "TESTNET",
          defaultChain: envSetting(r, "CIRCLE_DEFAULT_CHAIN") ?? "ARC-TESTNET",
          walletSetId: envSetting(r, "CIRCLE_WALLET_SET_ID"),
          x402PrivateKey,
          x402Chain: envSetting(r, "X402_CHAIN") ?? "arcTestnet",
          sellerAddress: envSetting(r, "SERVER_ADDRESS"),
        });
      } catch (error) {
        if (!x402PrivateKey) throw error;
        logger.warn(
          `[CircleService] Full kit init failed (${error}). Using nanopayment-only mode.`
        );
        this._kit = CircleAgentKit.create({
          apiKey: "dummy",
          entitySecret: "dummy",
          x402PrivateKey,
          x402Chain: envSetting(r, "X402_CHAIN") ?? "arcTestnet",
          sellerAddress: envSetting(r, "SERVER_ADDRESS"),
        });
      }
    }
    return this._kit;
  }
}

/** Helper for actions to fetch the kit from the runtime. */
export function getKit(runtime: IAgentRuntime): CircleAgentKit {
  const service = runtime.getService<CircleService>(CircleService.serviceType);
  if (!service) {
    throw new Error(
      "CircleService not found in runtime. Make sure circlePlugin is registered."
    );
  }
  return service.kit;
}
