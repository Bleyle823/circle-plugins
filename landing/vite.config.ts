// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, PluginOption, UserConfig } from "vite";

function stripLovableUiPlugins(plugins: PluginOption[] | undefined): PluginOption[] | undefined {
  if (!plugins) return plugins;

  return plugins.flatMap((plugin) => {
    if (plugin == null || typeof plugin === "boolean") return [];
    if (Array.isArray(plugin)) return stripLovableUiPlugins(plugin) ?? [];
    if (plugin instanceof Promise) return [plugin];

    const name = "name" in plugin && typeof plugin.name === "string" ? plugin.name : "";
    // Drop Lovable/TanStack source-tagging overlays used for visual edit icons in preview.
    if (
      name.includes("lovable") ||
      name.includes("tagger") ||
      name.includes("inject-source") ||
      name.includes("devtools")
    ) {
      return [];
    }
    return [plugin];
  });
}

const lovableConfig = defineLovableConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});

export default async function defineConfig(env: ConfigEnv): Promise<UserConfig> {
  const config = await lovableConfig(env);
  return {
    ...config,
    plugins: stripLovableUiPlugins(config.plugins as PluginOption[] | undefined),
  };
}
