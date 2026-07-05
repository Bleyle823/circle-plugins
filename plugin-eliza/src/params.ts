import type { Memory } from "@elizaos/core";

/** ElizaOS runtime injects these into `options`; they are not tool params. */
const IGNORE_OPTION_KEYS = new Set(["actionContext", "actionPlan", "onStreamChunk"]);

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/g;
const URL_RE = /https?:\/\/[^\s]+/i;
const AMOUNT_WITH_UNIT_RE = /\b(\d+(?:\.\d+)?)\s*usdc\b/i;
const VERB_AMOUNT_RE = /\b(?:send|transfer|pay|deposit|request)\s+(\d+(?:\.\d+)?)\b/i;
const CONFIRM_RE = /\b(confirm|confirmed|yes,? do it|approved?|go ahead)\b/i;

export function extractAddress(text: string): string | undefined {
  if (!text) return undefined;
  const matches = [...text.matchAll(EVM_ADDRESS_RE)].map((m) => m[0]);
  // Prefer the last address (usually the recipient after "to").
  return matches.length ? matches[matches.length - 1] : undefined;
}

export function extractAmount(text: string): string | undefined {
  if (!text) return undefined;
  const withUnit = text.match(AMOUNT_WITH_UNIT_RE);
  if (withUnit) return withUnit[1];
  const verb = text.match(VERB_AMOUNT_RE);
  return verb ? verb[1] : undefined;
}

export function extractUrl(text: string): string | undefined {
  const m = text?.match(URL_RE);
  return m ? m[0] : undefined;
}

/** Keep only real tool params from the runtime-provided options object. */
export function pickActionParams(options?: Record<string, unknown>): Record<string, unknown> {
  if (!options) return {};
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (IGNORE_OPTION_KEYS.has(key)) continue;
    if (value !== undefined && value !== null && value !== "") {
      params[key] = value;
    }
  }
  return params;
}

/**
 * Resolve action params. Precedence (later wins):
 *   1. regex extraction from message text (+ prior responses)
 *   2. structured `message.content.params`
 *   3. explicit handler `options`
 */
export function resolveParams(
  message: Memory,
  options?: Record<string, unknown>,
  responses?: Memory[]
): Record<string, unknown> {
  const content = (message?.content ?? {}) as Record<string, unknown>;
  const text = String(content.text ?? "");

  const params: Record<string, unknown> = {};

  const texts = [text, ...(responses ?? []).map((r) => String(r?.content?.text ?? ""))];
  for (const t of texts) {
    if (!params.destinationAddress) {
      const address = extractAddress(t);
      if (address) params.destinationAddress = address;
    }
    if (params.amount == null) {
      const amount = extractAmount(t);
      if (amount != null) params.amount = amount;
    }
    if (!params.url) {
      const url = extractUrl(t);
      if (url) params.url = url;
    }
    if (params.confirm == null && CONFIRM_RE.test(t)) {
      params.confirm = true;
    }
  }

  if (content.params && typeof content.params === "object") {
    Object.assign(params, content.params as Record<string, unknown>);
  }

  Object.assign(params, pickActionParams(options));

  return params;
}
