const USDC_TRANSACTION_PATTERNS = [
  /\busdc\b/i,
  /\bsent\s+\d+(?:\.\d+)?\s*usdc\b/i,
  /\bbalance:\s*\d/i,
  /\bcreated\s+wallet\b/i,
  /\bcircle_send_usdc\b/i,
  /\bcircle_check_balance\b/i,
  /\bcircle_create_wallet\b/i,
  /\bcircle_request_faucet\b/i,
  /\bfaucet\b/i,
  /\bpayment\s+request\s+for\s+\d/i,
  /\bgateway\s+balance\b/i,
  /\bdeposited\s+\d+(?:\.\d+)?\s*usdc\b/i,
  /\btransaction\s+\S+\s+is\s+(complete|pending)/i,
];

export function isUsdcTransaction(text: string | undefined | null): boolean {
  if (!text || text === '...') {
    return false;
  }
  return USDC_TRANSACTION_PATTERNS.some((pattern) => pattern.test(text));
}
