import express from "express";
import { logger } from "@elizaos/core";
export async function startPaywalledServer(kit, port = 4021) {
    const app = express();
    const sellerAddress = kit.config.sellerAddress;
    if (!sellerAddress) {
        logger.error("[Circle] SERVER_ADDRESS not set, cannot start paywalled server");
        return;
    }
    const gateway = await kit.requirePayment({
        sellerAddress,
        price: "$0.01",
    });
    // Add error handling like in the sample
    gateway.onVerifyFailure(async (ctx) => {
        const reason = ctx?.result?.invalidReason ?? ctx?.error?.message ?? 'unknown';
        logger.error(`[Circle Gateway] Verification failed: ${reason}`);
    });
    app.get("/health", (_req, res) => {
        res.json({ ok: true, paywall: "/risk-profile", price: "$0.01" });
    });
    app.get("/risk-profile", gateway.require("$0.01"), (_req, res) => {
        res.json({
            risk_score: 87,
            risk_level: "high",
            recommendation: "block_transaction",
        });
    });
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            logger.info(`[Circle] Paywalled server on http://localhost:${port}`);
            logger.info(`[Circle] Paywall: GET /risk-profile → $0.01 USDC nanopayment (Circle Gateway)`);
            logger.info(`[Circle] Seller address: ${sellerAddress}`);
            resolve(app);
        });
        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                logger.error(`[Circle] Port ${port} already in use — stale paywall may cause "Invalid transfer ID" errors. ` +
                    `Stop the other process (Task Manager / netstat) or run only: bun run x402:server`);
                resolve(undefined);
                return;
            }
            logger.error(`[Circle] Paywalled server failed to start: ${error.message}`);
            resolve(undefined);
        });
    });
}
//# sourceMappingURL=server.js.map