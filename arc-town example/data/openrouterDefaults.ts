/**
 * Default OpenRouter models for Eliza Town — cheapest / free where possible.
 * Override any value in .env / .env.local.
 *
 * Chat: openrouter/free ($0) — auto-picks from OpenRouter's free model pool.
 * Embeddings: NVIDIA Nemotron Embed VL free tier ($0, 2048 dimensions).
 *
 * @see https://openrouter.ai/openrouter/free
 */
export const OPENROUTER_DEFAULTS = {
  SMALL_MODEL: 'openrouter/free',
  LARGE_MODEL: 'openrouter/free',
  EMBEDDING_MODEL: 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
  EMBEDDING_DIMENSIONS: 2048,
} as const;

/**
 * ElizaOS bootstrap accepts 384, 512, 768, 1024, 1536, or 3072 — not 2048.
 * Town NPCs (Convex) use OPENROUTER_DEFAULTS; Eliza server agents use these.
 */
export const ELIZA_EMBEDDING_DEFAULTS = {
  EMBEDDING_MODEL: 'openai/text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,
} as const;
