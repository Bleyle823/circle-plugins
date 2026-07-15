import type {
  Action,
  ActionExample,
  ActionResult,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
} from "@elizaos/core";
import { CircleAgentError, type CircleAgentKit } from "@circle-plugins/core";
import { getKit } from "./service.js";
import { resolveParams } from "./params.js";

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

function assertRequired(spec: CircleActionSpec, params: Record<string, unknown>): void {
  for (const key of spec.requiredParams ?? []) {
    const v = params[key];
    if (v === undefined || v === null || v === "") {
      throw new CircleAgentError("VALIDATION", `Missing required parameter "${key}" for ${spec.name}.`);
    }
  }
}

function errMessage(error: unknown): string {
  if (error instanceof CircleAgentError) return `${error.code}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

/** Build an ElizaOS Action from a Circle capability spec (mirrors plugin-stacks). */
export function makeAction(spec: CircleActionSpec): Action {
  return {
    name: spec.name,
    similes: spec.similes ?? [],
    description: spec.description,
    validate: spec.validate ?? (async () => true),
    handler: async (
      runtime: IAgentRuntime,
      message: Memory,
      state?: State,
      options?: Record<string, unknown>,
      callback?: HandlerCallback,
      responses?: Memory[]
    ): Promise<ActionResult> => {
      try {
        const params = resolveParams(message, state, options, responses);
        assertRequired(spec, params);

        const kit = getKit(runtime);
        const result = await spec.run(kit, params);
        const text = spec.formatResult(result, params);

        if (callback) {
          await callback({ text, content: { success: true, result } });
        }
        return { success: true, text, data: { actionName: spec.name, result } };
      } catch (error) {
        const text = `Circle tool ${spec.name} failed: ${errMessage(error)}`;
        if (callback) {
          await callback({ text, content: { success: false, error: text } });
        }
        return {
          success: false,
          text,
          error: error instanceof Error ? error : new Error(String(error)),
          data: { actionName: spec.name, error: text },
        };
      }
    },
    examples: spec.examples ?? [],
  };
}

/** Small helper for building example conversations. */
export function convo(user: string, agent: string, action: string): ActionExample[] {
  const actions = action.includes(",") ? action.split(",").map((a) => a.trim()) : [action];
  return [
    { name: "user", content: { text: user } } as ActionExample,
    { name: "agent", content: { text: agent, action: actions[0], actions } } as ActionExample,
  ];
}
