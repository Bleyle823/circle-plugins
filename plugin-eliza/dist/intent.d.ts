/** Detect Circle Gateway / nanopayment intents from user text. */
export declare function wantsGatewayBalance(text: string): boolean;
/** Detect wallet (non-Gateway) balance intents. */
export declare function wantsWalletBalance(text: string): boolean;
/** Detect x402 paywall payment intents. */
export declare function wantsX402Payment(text: string): boolean;
/** General greeting / small talk — use REPLY, not Circle tools. */
export declare function isGreetingOrSmallTalk(text: string): boolean;
//# sourceMappingURL=intent.d.ts.map