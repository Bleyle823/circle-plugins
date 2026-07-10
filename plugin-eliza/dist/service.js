import { Service, logger } from "@elizaos/core";
import { CircleAgentKit } from "@circle-plugins/core";
import { envSetting } from "./env.js";
/**
 * CircleService — owns and manages the CircleAgentKit instance for the agent.
 * Actions and providers resolve it via runtime.getService(CircleService.serviceType).
 */
export class CircleService extends Service {
    static serviceType = "circle";
    _kit;
    constructor(runtime) {
        super(runtime);
    }
    static async start(runtime) {
        const service = new CircleService(runtime);
        return service;
    }
    static async stop(runtime) {
        const service = runtime.getService(CircleService.serviceType);
        if (service) {
            await service.stop();
        }
    }
    get capabilityDescription() {
        return "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, and payment requests.";
    }
    async initialize(_runtime) {
        // Kit is lazily initialized on first use to ensure env is ready.
    }
    async stop() {
        // No specific cleanup needed for CircleAgentKit
    }
    get kit() {
        if (!this._kit) {
            const r = this.runtime;
            const apiKey = envSetting(r, "CIRCLE_API_KEY");
            const entitySecret = envSetting(r, "ENTITY_SECRET") ?? envSetting(r, "CIRCLE_ENTITY_SECRET");
            const x402PrivateKey = envSetting(r, "X402_PRIVATE_KEY") ?? envSetting(r, "CLIENT_PRIVATE_KEY");
            try {
                this._kit = CircleAgentKit.create({
                    apiKey: apiKey ?? "dummy",
                    entitySecret: entitySecret ?? "dummy",
                    network: envSetting(r, "CIRCLE_NETWORK") ?? "TESTNET",
                    defaultChain: envSetting(r, "CIRCLE_DEFAULT_CHAIN") ?? "ARC-TESTNET",
                    walletSetId: envSetting(r, "CIRCLE_WALLET_SET_ID"),
                    x402PrivateKey,
                    x402Chain: envSetting(r, "X402_CHAIN") ?? "arcTestnet",
                    sellerAddress: envSetting(r, "SERVER_ADDRESS"),
                });
            }
            catch (error) {
                if (!x402PrivateKey)
                    throw error;
                logger.warn(`[CircleService] Full kit init failed (${error}). Using nanopayment-only mode.`);
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
export function getKit(runtime) {
    const service = runtime.getService(CircleService.serviceType);
    if (!service) {
        throw new Error("CircleService not found in runtime. Make sure circlePlugin is registered.");
    }
    return service.kit;
}
//# sourceMappingURL=service.js.map