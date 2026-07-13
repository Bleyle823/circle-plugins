import { ELIZA_EMBEDDING_DEFAULTS, OPENROUTER_DEFAULTS } from '../../data/openrouterDefaults';

/**
 * Plugins for agents created from Eliza Town (Convex → ElizaOS API).
 * OpenRouter loads before bootstrap to avoid service registration timeouts.
 */
export const ELIZA_TOWN_PLUGINS = [
  '@elizaos/plugin-sql',
  '@elizaos/plugin-openrouter',
  '@elizaos/plugin-bootstrap',
] as const;

const CIRCLE_ACTION_GUIDANCE = [
  'Speak in one short sentence only.',
  'You have Circle wallet tools on Arc Testnet — use them proactively.',
  'In most turns, run a Circle action first: prefer CIRCLE_CHECK_BALANCE, then CIRCLE_CREATE_WALLET, CIRCLE_REQUEST_FAUCET, or CIRCLE_SEND_USDC.',
  'After the action, REPLY with one short in-character line that includes the result and the word USDC.',
  'Steer chats toward balances, tips, bets, and faucet top-ups.',
].join(' ');

function circleSettingsFromEnv(): Record<string, string> {
  const settings: Record<string, string> = {};
  const keys = [
    'CIRCLE_WALLET_ID',
    'CIRCLE_WALLET_ADDRESS',
    'CIRCLE_DEFAULT_CHAIN',
    'CIRCLE_GATEWAY_ADDRESS',
  ] as const;
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      settings[key] = value;
    }
  }
  return settings;
}

export function buildElizaCharacterConfig(args: {
  name: string;
  identity: string;
  personality: string[];
  plan: string;
  includeCircle?: boolean;
}) {
  const plugins: string[] = [...ELIZA_TOWN_PLUGINS];
  if (args.includeCircle) {
    plugins.push('@circle-plugins/plugin-eliza');
  }

  const circlePrompt = args.includeCircle ? ` ${CIRCLE_ACTION_GUIDANCE}` : '';

  return {
    name: args.name,
    bio: [args.identity],
    adjectives: args.personality,
    system: `You are ${args.name}. Your plan is to ${args.plan}.${circlePrompt}`,
    plugins,
    settings: {
      EMBEDDING_DIMENSION: String(ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_DIMENSIONS),
      OPENROUTER_SMALL_MODEL: OPENROUTER_DEFAULTS.SMALL_MODEL,
      OPENROUTER_LARGE_MODEL: OPENROUTER_DEFAULTS.LARGE_MODEL,
      OPENROUTER_EMBEDDING_MODEL: ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_MODEL,
      OPENROUTER_EMBEDDING_DIMENSIONS: String(ELIZA_EMBEDDING_DEFAULTS.EMBEDDING_DIMENSIONS),
      ...circleSettingsFromEnv(),
      secrets: {},
    },
  };
}
