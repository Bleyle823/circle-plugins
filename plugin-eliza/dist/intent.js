/** Detect Circle Gateway / nanopayment intents from user text. */
export function wantsGatewayBalance(text) {
    return (/\bgateway\b/i.test(text) &&
        /\b(balance|funds|usdc|how\s+much|available)\b/i.test(text));
}
/** Detect wallet (non-Gateway) balance intents. */
export function wantsWalletBalance(text) {
    if (/\bgateway\b/i.test(text))
        return false;
    return /\b(wallet\s*balance|my\s+balance|how\s+much\s+usdc|usdc\s+balance|check\s+balance)\b/i.test(text);
}
/** Detect x402 paywall payment intents. */
export function wantsX402Payment(text) {
    if (/\b(hello|hi|hey|greetings|good\s+(morning|afternoon|evening))\b/i.test(text)) {
        return false;
    }
    return (/\b(x402|nanopayment|paywall|risk[- ]?profile)\b/i.test(text) ||
        /localhost:\d+\/risk-profile/i.test(text) ||
        /\bpay\s+(for\s+)?(the\s+)?(risk|paywall|x402|api)/i.test(text));
}
/** General greeting / small talk — use REPLY, not Circle tools. */
export function isGreetingOrSmallTalk(text) {
    const t = text.trim();
    if (!t)
        return false;
    return /^(hi|hello|hey|yo|sup|greetings|good\s+(morning|afternoon|evening)|howdy)\b/i.test(t);
}
//# sourceMappingURL=intent.js.map