import { Service, type IAgentRuntime, type ServiceTypeName } from "@elizaos/core";
import { CircleAgentKit } from "@circle-plugins/core";
/**
 * CircleService — owns and manages the CircleAgentKit instance for the agent.
 * Actions and providers resolve it via runtime.getService(CircleService.serviceType).
 */
export declare class CircleService extends Service {
    static serviceType: ServiceTypeName;
    private _kit?;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<CircleService>;
    static stop(runtime: IAgentRuntime): Promise<void>;
    get capabilityDescription(): string;
    initialize(_runtime: IAgentRuntime): Promise<void>;
    stop(): Promise<void>;
    get kit(): CircleAgentKit;
}
/** Helper for actions to fetch the kit from the runtime. */
export declare function getKit(runtime: IAgentRuntime): CircleAgentKit;
//# sourceMappingURL=service.d.ts.map