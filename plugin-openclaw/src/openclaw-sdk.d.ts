/**
 * Minimal ambient declarations for the OpenClaw plugin SDK so this package
 * typechecks without the full `openclaw` install present. At runtime the real
 * modules are resolved from the host OpenClaw installation.
 */
declare module "openclaw/plugin-sdk" {
  export interface OpenClawTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    optional?: boolean;
    handler: (
      params: Record<string, any>,
      ctx?: unknown
    ) => Promise<{ content: Array<{ type: string; text: string }> }>;
  }

  export interface OpenClawPluginApi {
    registerTool(tool: OpenClawTool): void;
  }

  export interface PluginEntryConfig {
    id: string;
    name: string;
    description?: string;
    register: (api: OpenClawPluginApi) => void | Promise<void>;
  }

  export function definePluginEntry(config: PluginEntryConfig): PluginEntryConfig;
}

declare module "openclaw/plugin-sdk/tool-plugin" {
  export interface ToolPluginTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    optional?: boolean;
    handler: (
      params: Record<string, any>
    ) => Promise<{ content: Array<{ type: string; text: string }> }>;
  }
  export interface ToolPluginConfig {
    id: string;
    name: string;
    description?: string;
    tools: ToolPluginTool[];
  }
  export function defineToolPlugin(config: ToolPluginConfig): ToolPluginConfig;
}
