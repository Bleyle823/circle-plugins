import { CircleAgentError } from "@circle-agent-kit/core";
import { getKit } from "./service.js";
import { resolveParams } from "./params.js";
function assertRequired(spec, params) {
    for (const key of spec.requiredParams ?? []) {
        const v = params[key];
        if (v === undefined || v === null || v === "") {
            throw new CircleAgentError("VALIDATION", `Missing required parameter "${key}" for ${spec.name}.`);
        }
    }
}
function errMessage(error) {
    if (error instanceof CircleAgentError)
        return `${error.code}: ${error.message}`;
    if (error instanceof Error)
        return error.message;
    return String(error);
}
/** Build an ElizaOS Action from a Circle capability spec (mirrors plugin-stacks). */
export function makeAction(spec) {
    return {
        name: spec.name,
        similes: spec.similes ?? [],
        description: spec.description,
        validate: async (_runtime, _message) => true,
        handler: async (runtime, message, _state, options, callback, responses) => {
            try {
                const params = resolveParams(message, options, responses);
                assertRequired(spec, params);
                const kit = getKit(runtime);
                const result = await spec.run(kit, params);
                const text = spec.formatResult(result, params);
                if (callback) {
                    await callback({ text, content: { success: true, result } });
                }
                return { success: true, text, data: { actionName: spec.name, result } };
            }
            catch (error) {
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
export function convo(user, agent, action) {
    return [
        { name: "user", content: { text: user } },
        { name: "agent", content: { text: agent, action } },
    ];
}
//# sourceMappingURL=shared.js.map