import { err } from "./errors.js";
/**
 * Lazily construct the real Circle SDK client. Imported dynamically so that
 * consumers who only use, say, chain metadata don't pay the dependency cost,
 * and so tests can inject a mock instead.
 */
export async function createWalletsClient(config) {
    try {
        const mod = await import("@circle-fin/developer-controlled-wallets");
        const init = mod.initiateDeveloperControlledWalletsClient ??
            mod.default?.initiateDeveloperControlledWalletsClient;
        if (typeof init !== "function") {
            throw err("DEPENDENCY_MISSING", "Could not find initiateDeveloperControlledWalletsClient in @circle-fin/developer-controlled-wallets.");
        }
        const walletsClient = init({
            apiKey: config.apiKey,
            entitySecret: config.entitySecret,
        });
        // Initialize App Kit + Adapter
        const { AppKit } = await import("@circle-fin/app-kit");
        const { createCircleWalletsAdapter } = await import("@circle-fin/adapter-circle-wallets");
        const adapter = createCircleWalletsAdapter({
            apiKey: config.apiKey,
            entitySecret: config.entitySecret,
        });
        const appKit = new AppKit();
        return Object.assign(walletsClient, { appKit, adapter });
    }
    catch (e) {
        if (e && e.code === "DEPENDENCY_MISSING")
            throw e;
        throw err("DEPENDENCY_MISSING", "Failed to initialize @circle-fin/developer-controlled-wallets. Is it installed?", e);
    }
}
//# sourceMappingURL=client.js.map