import { CircleAgentKit } from "@circle-plugins/core";
/** A framework-neutral tool definition; adapted to OpenClaw in index.ts. */
export interface CircleTool {
    name: string;
    description: string;
    /** JSON-schema object describing params. */
    parameters: Record<string, unknown>;
    /** Whether the tool is opt-in (funding / money-moving beyond small transfers). */
    optional?: boolean;
    run: (kit: CircleAgentKit, params: Record<string, any>) => Promise<unknown>;
}
export declare function kitFromEnv(): CircleAgentKit;
export declare const circleTools: CircleTool[];
/** Run a tool with consistent success/error text output for OpenClaw. */
export declare function runTool(tool: CircleTool, params: Record<string, any>): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
}>;
//# sourceMappingURL=tools.d.ts.map