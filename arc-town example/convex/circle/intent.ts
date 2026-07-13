/** Detect which in-game Circle action to run from chat text / turn index. */

export type CircleActionKind = 'balance' | 'wallet' | 'faucet' | 'send';

const ADDRESS_RE = /0x[a-fA-F0-9]{40}/;
const AMOUNT_RE = /\b(\d+(?:\.\d+)?)\s*usdc\b/i;

export function extractAddress(text: string): string | undefined {
  const match = text.match(ADDRESS_RE);
  return match?.[0];
}

export function extractAmount(text: string, fallback = '0.01'): string {
  const match = text.match(AMOUNT_RE);
  if (!match) return fallback;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  // Keep demo sends tiny so NPC chatter can't drain the wallet.
  return String(Math.min(n, 0.1));
}

export function detectCircleAction(text: string): CircleActionKind | null {
  const t = text.trim();
  if (!t) return null;

  if (/\b(faucet|testnet\s+usdc|top\s*up|fund\s+(my\s+)?wallet|request\s+faucet)\b/i.test(t)) {
    return 'faucet';
  }
  if (
    /\b(send|transfer|pay|tip)\b/i.test(t) &&
    (/\busdc\b/i.test(t) || ADDRESS_RE.test(t) || /\b(circle\s+)?wallet\b/i.test(t))
  ) {
    return 'send';
  }
  if (
    /\b(create|show|share|new|setup)\b/i.test(t) &&
    /\bwallet\b/i.test(t) &&
    !/\bbalance\b/i.test(t)
  ) {
    return 'wallet';
  }
  if (
    /\b(wallet\s*balance|my\s+balance|how\s+much\s+usdc|usdc\s+balance|check\s+(your\s+|my\s+)?balance|balances?)\b/i.test(
      t,
    ) ||
    (/\bbalance\b/i.test(t) && /\b(usdc|wallet|circle|arc)\b/i.test(t))
  ) {
    return 'balance';
  }
  return null;
}

/** When no explicit ask, rotate through safe wallet moves (no auto-send). */
export function circleActionForTurn(numMessages: number): CircleActionKind {
  const kinds: CircleActionKind[] = ['balance', 'wallet', 'faucet', 'balance', 'wallet'];
  return kinds[Math.min(Math.floor(numMessages / 2), kinds.length - 1)];
}
