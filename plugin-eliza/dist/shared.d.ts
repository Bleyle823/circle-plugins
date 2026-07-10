import type { Action, ActionExample, IAgentRuntime, Memory } from "@elizaos/core";
import { type CircleAgentKit } from "@circle-plugins/core";
/** A Circle capability adapted into an ElizaOS Action. */
export interface CircleActionSpec {
    /** Uppercase action id, e.g. `CIRCLE_SEND_USDC`. */
    name: string;
    /** Natural-language description shown to the model. */
    description: string;
    /** Alternate trigger phrasings. */
    similes?: string[];
    /** Example conversations. */
    examples?: ActionExample[][];
    /** Params required before invoking the kit; missing ones raise a clear error. */
    requiredParams?: string[];
    /** Optional validate; defaults to always true. */
    validate?: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
    /** Run the capability against the shared kit. */
    run: (kit: CircleAgentKit, params: Record<string, unknown>) => Promise<unknown> | unknown;
    /** Format handler output for chat. */
    formatResult: (result: any, params: Record<string, unknown>) => string;
}
/** Build an ElizaOS Action from a Circle capability spec (mirrors plugin-stacks). */
export declare function makeAction(spec: CircleActionSpec): Action;
/** Small helper for building example conversations. */
export declare function convo(user: string, agent: string, action: string): ActionExample[];
//# sourceMappingURL=shared.d.ts.map