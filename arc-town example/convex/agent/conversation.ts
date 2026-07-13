import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';
import { ActionCtx, internalQuery } from '../_generated/server';
import { LLMMessage, chatCompletion } from '../util/llm';
import * as memory from './memory';
import { api, internal } from '../_generated/api';
import * as embeddingsCache from './embeddingsCache';
import { GameId, conversationId, playerId } from '../aiTown/ids';
import { NUM_MEMORIES_TO_SEARCH } from '../constants';
import {
  circleActionForTurn,
  detectCircleAction,
  extractAddress,
  extractAmount,
  type CircleActionKind,
} from '../circle/intent';

const selfInternal = internal.agent.conversation;

/** Keep spoken lines punchy and money-focused. */
const DIALOGUE_STYLE = [
  'Speak in 1 short sentence (max ~12 words). Never write paragraphs.',
  'Reply with ONLY the spoken line — no planning, no quotes about instructions.',
  'Steer the chat toward Circle wallets, USDC, Arc Testnet balances, tips, bets, or faucet top-ups.',
  'Prefer concrete money moves: check balance, show wallet, request faucet, or send a little USDC.',
  'When you mention money, include the word USDC.',
].join(' ');

function circleTurnGoal(numMessages: number): string {
  const goals = [
    'Open with a short hello that mentions wallets or USDC.',
    'Ask them to check a Circle USDC balance with you.',
    'Suggest creating/showing a Circle wallet on Arc Testnet.',
    'Propose a tiny USDC tip, bet, or faucet top-up.',
    'Confirm the latest USDC / Circle wallet result in one short line.',
  ];
  return goals[Math.min(Math.floor(numMessages / 2), goals.length - 1)];
}

function circleEnabled(): boolean {
  return process.env.ENABLE_CIRCLE_PLUGIN === 'true';
}

function spokenFallbackFromCircle(result: string): string {
  const cleaned = result.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  if (words.length <= 14) return cleaned;
  return words.slice(0, 14).join(' ');
}

async function runInGameCircleAction(
  ctx: ActionCtx,
  kind: CircleActionKind,
  sourceText = '',
): Promise<{ ok: boolean; kind: CircleActionKind; text: string } | null> {
  if (!circleEnabled()) return null;
  try {
    return await ctx.runAction(internal.circle.actions.runTownCircleAction, {
      kind,
      destinationAddress: extractAddress(sourceText),
      amount: kind === 'send' ? extractAmount(sourceText) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`In-game Circle action skipped: ${message}`);
    return null;
  }
}

function injectCircleResult(
  prompt: string[],
  circle: { ok: boolean; kind: CircleActionKind; text: string } | null,
) {
  if (!circle) return;
  prompt.push(
    `You JUST ran a real Circle wallet action (${circle.kind}).`,
    `Exact result: ${circle.text}`,
    circle.ok
      ? 'Your spoken line MUST report this real result (include USDC). Do not invent numbers.'
      : 'Mention the wallet hiccup briefly, still say USDC.',
  );
}

export async function startConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, agent, otherAgent, lastConversation, elizaAgent } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    },
  );

  // Real on-chain / Circle API moves happen here for every agent in town.
  const circle = await runInGameCircleAction(ctx, 'balance');

  if (elizaAgent && !circle?.ok) {
    const response = await ctx.runAction(api.elizaAgent.actions.sendMessage, {
      elizaAgentId: elizaAgent.elizaAgentId,
      message: [
        `${otherPlayer.name} walked up.`,
        'Greet them in one short sentence.',
        'Immediately steer toward Circle wallets / USDC.',
        'If useful, run CIRCLE_CHECK_BALANCE or CIRCLE_CREATE_WALLET first, then reply with the USDC result.',
      ].join(' '),
      senderId: otherPlayer.id,
      conversationId,
      speakerName: otherPlayer.name,
    });
    if (response) return response;
  }

  const memories = await loadMemoriesSafely(
    ctx,
    player.id as GameId<'players'>,
    `${player.name} is talking to ${otherPlayer.name}`,
    Number(process.env.NUM_MEMORIES_TO_SEARCH) || NUM_MEMORIES_TO_SEARCH,
  );

  const memoryWithOtherPlayer = memories.find(
    (m) => m.data.type === 'conversation' && m.data.playerIds.includes(otherPlayerId),
  );
  const prompt = [
    `You are ${player.name}, starting a chat with ${otherPlayer.name}.`,
    DIALOGUE_STYLE,
    circleTurnGoal(0),
  ];
  injectCircleResult(prompt, circle);
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(...previousConversationPrompt(otherPlayer, lastConversation));
  prompt.push(...relatedMemoriesPrompt(memories));
  if (memoryWithOtherPlayer) {
    prompt.push(`Reference one prior detail, then pivot to USDC / Circle wallets.`);
  }
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  prompt.push(lastPrompt);

  const { content } = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: prompt.join('\n'),
      },
    ],
    max_tokens: 80,
    stop: stopWords(otherPlayer.name, player.name),
  });
  const spoken = trimContentPrefx(content, lastPrompt);
  if (circle?.ok && (!spoken || spoken === '...' || /okay,? let('|’)s see|the user wants/i.test(spoken))) {
    return spokenFallbackFromCircle(circle.text);
  }
  return spoken;
}

function trimContentPrefx(content: string | null | undefined, prompt: string) {
  if (!content) {
    return '...';
  }
  if (content.startsWith(prompt)) {
    return content.slice(prompt.length).trim();
  }
  return content.trim();
}

/** Memory recall should never block conversation replies. */
async function loadMemoriesSafely(
  ctx: ActionCtx,
  playerId: GameId<'players'>,
  query: string,
  limit: number,
) {
  try {
    const embedding = await embeddingsCache.fetch(ctx, query);
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return [];
    }
    return await memory.searchMemories(ctx, playerId, embedding, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Skipping memory search (${message})`);
    return [];
  }
}

export async function continueConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, conversation, agent, otherAgent, elizaAgent } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    },
  );

  const messages = await ctx.runQuery(api.messages.listMessages, { worldId, conversationId });
  const lastMessage = messages[messages.length - 1];
  const lastText = lastMessage?.text ?? '';
  const kind =
    detectCircleAction(lastText) ?? circleActionForTurn(messages.length);
  const circle = await runInGameCircleAction(ctx, kind, lastText);

  if (elizaAgent && !circle?.ok && lastMessage && lastMessage.author === otherPlayerId) {
    const goal = circleTurnGoal(messages.length);
    const response = await ctx.runAction(api.elizaAgent.actions.sendMessage, {
      elizaAgentId: elizaAgent.elizaAgentId,
      message: [
        `${otherPlayer.name} said: "${lastMessage.text}"`,
        goal,
        'Prefer running a Circle tool now (CIRCLE_CHECK_BALANCE, CIRCLE_CREATE_WALLET, CIRCLE_REQUEST_FAUCET, or CIRCLE_SEND_USDC).',
        'Then REPLY in one short in-character sentence that includes USDC and the action result.',
      ].join(' '),
      senderId: otherPlayerId,
      conversationId,
      speakerName: otherPlayer.name,
    });
    if (response) return response;
  }

  const now = Date.now();
  const started = new Date(conversation.created);
  const memories = await loadMemoriesSafely(
    ctx,
    player.id as GameId<'players'>,
    `What do you think about ${otherPlayer.name}?`,
    3,
  );
  const history = await previousMessages(
    ctx,
    worldId,
    player,
    otherPlayer,
    conversation.id as GameId<'conversations'>,
  );
  const prompt = [
    `You are ${player.name}, chatting with ${otherPlayer.name}.`,
    `Started ${started.toLocaleString()}; now ${now.toLocaleString()}.`,
    DIALOGUE_STYLE,
    circleTurnGoal(history.length),
  ];
  injectCircleResult(prompt, circle);
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(...relatedMemoriesPrompt(memories));
  prompt.push(`Below is the chat history with ${otherPlayer.name}.`);

  const llmMessages: LLMMessage[] = [
    {
      role: 'system',
      content: prompt.join('\n'),
    },
    ...history,
  ];
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  llmMessages.push({ role: 'user', content: lastPrompt });

  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 80,
    stop: stopWords(otherPlayer.name, player.name),
  });
  const spoken = trimContentPrefx(content, lastPrompt);
  if (circle?.ok && (!spoken || spoken === '...' || /okay,? let('|’)s see|the user wants/i.test(spoken))) {
    return spokenFallbackFromCircle(circle.text);
  }
  return spoken;
}

export async function leaveConversationMessage(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  conversationId: GameId<'conversations'>,
  playerId: GameId<'players'>,
  otherPlayerId: GameId<'players'>,
): Promise<string> {
  const { player, otherPlayer, conversation, agent, otherAgent, elizaAgent } = await ctx.runQuery(
    selfInternal.queryPromptData,
    {
      worldId,
      playerId,
      otherPlayerId,
      conversationId,
    },
  );
  
  // One last real balance check so goodbyes can cite actual USDC.
  const circle = await runInGameCircleAction(ctx, 'balance');

  if (elizaAgent && !circle?.ok) {
    const response = await ctx.runAction(api.elizaAgent.actions.sendMessage, {
      elizaAgentId: elizaAgent.elizaAgentId,
      message: `${otherPlayer.name} is ending the conversation. Say one short goodbye that mentions USDC or your Circle wallet.`,
      senderId: otherPlayerId,
      conversationId,
      speakerName: otherPlayer.name,
    });
    if (response) return response;
  }
  const prompt = [
    `You are ${player.name}, leaving a chat with ${otherPlayer.name}.`,
    DIALOGUE_STYLE,
    `Say one short goodbye that mentions USDC or Circle wallets.`,
  ];
  injectCircleResult(prompt, circle);
  prompt.push(...agentPrompts(otherPlayer, agent, otherAgent ?? null));
  prompt.push(`Below is the chat history with ${otherPlayer.name}.`);
  const llmMessages: LLMMessage[] = [
    {
      role: 'system',
      content: prompt.join('\n'),
    },
    ...(await previousMessages(
      ctx,
      worldId,
      player,
      otherPlayer,
      conversation.id as GameId<'conversations'>,
    )),
  ];
  const lastPrompt = `${player.name} to ${otherPlayer.name}:`;
  llmMessages.push({ role: 'user', content: lastPrompt });

  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 60,
    stop: stopWords(otherPlayer.name, player.name),
  });
  const spoken = trimContentPrefx(content, lastPrompt);
  if (circle?.ok && (!spoken || spoken === '...' || /okay,? let('|’)s see|the user wants/i.test(spoken))) {
    return spokenFallbackFromCircle(circle.text);
  }
  return spoken;
}

function agentPrompts(
  otherPlayer: { name: string },
  agent: { identity: string; plan: string } | null,
  otherAgent: { identity: string; plan: string } | null,
): string[] {
  const prompt = [];
  if (agent) {
    prompt.push(`About you: ${agent.identity}`);
    prompt.push(`Your goals for the conversation: ${agent.plan}`);
  }
  if (otherAgent) {
    prompt.push(`About ${otherPlayer.name}: ${otherAgent.identity}`);
  }
  return prompt;
}

function previousConversationPrompt(
  otherPlayer: { name: string },
  conversation: { created: number } | null,
): string[] {
  const prompt = [];
  if (conversation) {
    const prev = new Date(conversation.created);
    const now = new Date();
    prompt.push(
      `Last time you chatted with ${
        otherPlayer.name
      } it was ${prev.toLocaleString()}. It's now ${now.toLocaleString()}.`,
    );
  }
  return prompt;
}

function relatedMemoriesPrompt(memories: memory.Memory[]): string[] {
  const prompt = [];
  if (memories.length > 0) {
    prompt.push(`Here are some related memories in decreasing relevance order:`);
    for (const memory of memories) {
      prompt.push(' - ' + memory.description);
    }
  }
  return prompt;
}

async function previousMessages(
  ctx: ActionCtx,
  worldId: Id<'worlds'>,
  player: { id: string; name: string },
  otherPlayer: { id: string; name: string },
  conversationId: GameId<'conversations'>,
) {
  const llmMessages: LLMMessage[] = [];
  const prevMessages = await ctx.runQuery(api.messages.listMessages, { worldId, conversationId });
  for (const message of prevMessages) {
    const author = message.author === player.id ? player : otherPlayer;
    const recipient = message.author === player.id ? otherPlayer : player;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${message.text}`,
    });
  }
  return llmMessages;
}

export const queryPromptData = internalQuery({
  args: {
    worldId: v.id('worlds'),
    playerId,
    otherPlayerId: playerId,
    conversationId,
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) {
      throw new Error(`World ${args.worldId} not found`);
    }
    const player = world.players.find((p) => p.id === args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const playerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.playerId))
      .first();
    if (!playerDescription) {
      throw new Error(`Player description for ${args.playerId} not found`);
    }
    const otherPlayer = world.players.find((p) => p.id === args.otherPlayerId);
    if (!otherPlayer) {
      throw new Error(`Player ${args.otherPlayerId} not found`);
    }
    const otherPlayerDescription = await ctx.db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('playerId', args.otherPlayerId))
      .first();
    if (!otherPlayerDescription) {
      throw new Error(`Player description for ${args.otherPlayerId} not found`);
    }
    const conversation = world.conversations.find((c) => c.id === args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }
    const agent = world.agents.find((a) => a.playerId === args.playerId);
    if (!agent) {
      throw new Error(`Player ${args.playerId} not found`);
    }
    const agentDescription = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', agent.id))
      .first();
    if (!agentDescription) {
      throw new Error(`Agent description for ${agent.id} not found`);
    }
    const otherAgent = world.agents.find((a) => a.playerId === args.otherPlayerId);
    let otherAgentDescription;
    if (otherAgent) {
      otherAgentDescription = await ctx.db
        .query('agentDescriptions')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId).eq('agentId', otherAgent.id))
        .first();
      if (!otherAgentDescription) {
        throw new Error(`Agent description for ${otherAgent.id} not found`);
      }
    }
    const lastTogether = await ctx.db
      .query('participatedTogether')
      .withIndex('edge', (q) =>
        q
          .eq('worldId', args.worldId)
          .eq('player1', args.playerId)
          .eq('player2', args.otherPlayerId),
      )
      // Order by conversation end time descending.
      .order('desc')
      .first();

    let lastConversation = null;
    if (lastTogether) {
      lastConversation = await ctx.db
        .query('archivedConversations')
        .withIndex('worldId', (q) =>
          q.eq('worldId', args.worldId).eq('id', lastTogether.conversationId),
        )
        .first();
      if (!lastConversation) {
        throw new Error(`Conversation ${lastTogether.conversationId} not found`);
      }
    }
    let elizaAgent = await ctx.db
      .query('elizaAgents')
      .withIndex('playerId', (q) => q.eq('playerId', args.playerId))
      .first();

    if (!elizaAgent) {
      elizaAgent = await ctx.db
        .query('elizaAgents')
        .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
        .filter((q) => q.eq(q.field('name'), playerDescription.name))
        .first();
    }

    return {
      player: { name: playerDescription.name, ...player },
      otherPlayer: { name: otherPlayerDescription.name, ...otherPlayer },
      conversation,
      agent: { identity: agentDescription.identity, plan: agentDescription.plan, ...agent },
      otherAgent: otherAgent && {
        identity: otherAgentDescription!.identity,
        plan: otherAgentDescription!.plan,
        ...otherAgent,
      },
      lastConversation,
      elizaAgent,
    };
  },
});

function stopWords(otherPlayer: string, player: string) {
  // These are the words we ask the LLM to stop on. OpenAI only supports 4.
  const variants = [`${otherPlayer} to ${player}`];
  return variants.flatMap((stop) => [stop + ':', stop.toLowerCase() + ':']);
}
