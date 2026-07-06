import type { IAgentRuntime } from "@elizaos/core";

/** Read config from Eliza runtime settings, falling back to process.env. */
export function envSetting(runtime: IAgentRuntime, key: string): string | undefined {
  const fromRuntime = runtime.getSetting(key);
  if (fromRuntime != null && String(fromRuntime).trim() !== "") {
    return String(fromRuntime).trim();
  }
  const fromEnv = process.env[key];
  return fromEnv?.trim() || undefined;
}
