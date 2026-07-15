import type { Character } from '@elizaos/core';
import { ELIZA_EMBEDDING_DEFAULTS, OPENROUTER_DEFAULTS } from '../../data/openrouterDefaults.js';

/** OpenRouter before bootstrap so TEXT_EMBEDDING is registered before services start. */
export function getTownPlugins(): string[] {
  const plugins = [
    '@elizaos/plugin-sql',
    '@elizaos/plugin-openrouter',
    '@elizaos/plugin-bootstrap',
  ];

  if (process.env.ENABLE_CIRCLE_PLUGIN === 'true') {
    plugins.push('@circle-plugins/plugin-eliza');
  }

  return plugins;
}

export function getTownAgentSettings(): Character['settings'] {
  return {
    EMBEDDING_DIMENSION: String(ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_DIMENSIONS),
    OPENROUTER_SMALL_MODEL: OPENROUTER_DEFAULTS.SMALL_MODEL,
    OPENROUTER_LARGE_MODEL: OPENROUTER_DEFAULTS.LARGE_MODEL,
    OPENROUTER_EMBEDDING_MODEL: ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_MODEL,
    OPENROUTER_EMBEDDING_DIMENSIONS: String(ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_DIMENSIONS),
    secrets: {},
  };
}

/** Default character template — plugins resolved at runtime after env is loaded. */
export function createTownCharacterTemplate(): Character {
  return {
    name: 'Eliza Town Agent',
    bio: [
      'An autonomous resident of Eliza Town.',
      'Can explore, chat with others, and use Circle wallet tools for USDC payments.',
    ],
    plugins: getTownPlugins(),
    settings: getTownAgentSettings(),
  };
}
