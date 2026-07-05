import { Service } from "@elizaos/core";
import { CircleAgentKit } from "@circle-agent-kit/core";
/**
 * Singleton service that owns a single CircleAgentKit instance for the agent.
 * Actions and providers resolve it via runtime.getService(CircleService.serviceType).
 */
export class CircleService extends Service {
    static serviceType = "circle-agent-kit";
    capabilityDescription = "Circle + Arc agent wallet: balances, USDC transfers, x402 nanopayments, payment requests.";
    kit;
    static async start(runtime) {
        const service = new CircleService(runtime);
        const get = (k) => {
            const v = runtime.getSetting?.(k) ?? process.env[k];
            return v == null ? undefined : String(v);
        };
        service.kit = CircleAgentKit.create({
            apiKey: get("CIRCLE_API_KEY"),
            entitySecret: get("ENTITY_SECRET"),
            network: get("CIRCLE_NETWORK") ?? undefined,
            defaultChain: get("CIRCLE_DEFAULT_CHAIN") ?? undefined,
            walletSetId: get("CIRCLE_WALLET_SET_ID") ?? undefined,
            x402PrivateKey: get("X402_PRIVATE_KEY") ?? undefined,
            x402Chain: get("X402_CHAIN") ?? undefined,
        });
        return service;
    }
    async stop() {
        // No persistent connections to tear down.
    }
}
/** Helper for actions to fetch the kit from the runtime. */
export function getKit(runtime) {
    const service = runtime.getService(CircleService.serviceType);
    if (!service?.kit) {
        throw new Error("CircleService is not initialized. Ensure @circle-agent-kit/plugin-eliza is registered and CIRCLE_API_KEY / ENTITY_SECRET are set.");
    }
    return service.kit;
}
//# sourceMappingURL=service.js.map