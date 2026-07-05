import { Service, type IAgentRuntime } from "@elizaos/core";
import { CircleAgentKit } from "@circle-agent-kit/core";
/**
 * Singleton service that owns a single CircleAgentKit instance for the agent.
 * Actions and providers resolve it via runtime.getService(CircleService.serviceType).
 */
export declare class CircleService extends Service {
    static serviceType: string;
    capabilityDescription: string;
    kit: CircleAgentKit;
    static start(runtime: IAgentRuntime): Promise<CircleService>;
    stop(): Promise<void>;
}
/** Helper for actions to fetch the kit from the runtime. */
export declare function getKit(runtime: IAgentRuntime): CircleAgentKit;
//# sourceMappingURL=service.d.ts.map