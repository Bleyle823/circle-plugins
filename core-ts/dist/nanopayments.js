import { err } from "./errors.js";
async function loadX402() {
    try {
        return await import("@circle-fin/x402-batching");
    }
    catch (e) {
        throw err("DEPENDENCY_MISSING", "Nanopayments require the optional peer dependency @circle-fin/x402-batching. " +
            "Install it: npm install @circle-fin/x402-batching", e);
    }
}
async function makeGatewayClient(config) {
    if (!config.x402PrivateKey) {
        throw err("CONFIG_MISSING", "X402_PRIVATE_KEY is required for nanopayments (buyer signing key).");
    }
    const mod = await loadX402();
    const GatewayClient = mod.GatewayClient ?? mod.client?.GatewayClient ?? mod.default?.GatewayClient;
    if (!GatewayClient) {
        throw err("DEPENDENCY_MISSING", "GatewayClient not found in @circle-fin/x402-batching.");
    }
    return new GatewayClient({
        chain: config.x402Chain ?? "base-sepolia",
        privateKey: config.x402PrivateKey,
    });
}
/** One-time (per chain) deposit of USDC into the Gateway Wallet contract. */
export async function gatewayDeposit(config, amount) {
    const client = await makeGatewayClient(config);
    const raw = await client.deposit(amount);
    return { amount, raw };
}
/** Pay for an x402-compatible resource. Handles the 402 negotiation + retry. */
export async function payX402(config, url, options) {
    const client = await makeGatewayClient(config);
    const raw = await client.pay(url, options);
    return {
        url,
        paid: true,
        data: raw?.data ?? raw?.body ?? raw,
        amount: raw?.amount,
        status: raw?.status,
    };
}
export async function gatewayBalance(config, address) {
    const client = await makeGatewayClient(config);
    const raw = await client.getBalances(address);
    const available = raw?.available ?? raw?.balance ?? raw?.total ?? (Array.isArray(raw) ? raw : "0");
    return { chain: config.x402Chain, available: String(available), raw };
}
export async function gatewayWithdraw(config, amount) {
    const client = await makeGatewayClient(config);
    const raw = await client.withdraw(amount);
    return { amount, raw };
}
/**
 * Seller-side: build Express-compatible middleware that requires x402 payment
 * for a route. Thin wrapper over `createGatewayMiddleware` so agents can also
 * *earn* USDC by exposing paid endpoints.
 */
export async function requirePayment(params) {
    const mod = await loadX402();
    const factory = mod.createGatewayMiddleware ??
        mod.server?.createGatewayMiddleware ??
        mod.default?.createGatewayMiddleware;
    if (!factory) {
        throw err("DEPENDENCY_MISSING", "createGatewayMiddleware not found in @circle-fin/x402-batching.");
    }
    return factory({
        sellerAddress: params.sellerAddress,
        price: params.price,
        chain: params.chain,
    });
}
//# sourceMappingURL=nanopayments.js.map