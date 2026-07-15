import { v } from 'convex/values';
import { internal } from './_generated/api';
import { MutationCtx, mutation } from './_generated/server';
import * as map from '../data/gentle';
import { Descriptions } from '../data/characters';
import { Id } from './_generated/dataModel';
import { createEngine, kickEngine } from './aiTown/main';
import { insertInput } from './aiTown/insertInput';
import { ENGINE_ACTION_DURATION } from './constants';
import { detectMismatchedLLMProvider } from './util/llm';

const DEFAULT_NPC_COUNT = 4;

export const init = mutation({
  args: {
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { worldStatus, engine } = await getOrCreateDefaultWorld(ctx);

    const numAgents = args.numAgents ?? DEFAULT_NPC_COUNT;
    await ensureDefaultAgents(ctx, worldStatus.worldId, numAgents);

    try {
      detectMismatchedLLMProvider();
    } catch (error) {
      console.warn(
        '[init] LLM not fully configured — agents will spawn but conversations need OPENROUTER_API_KEY:',
        error,
      );
    }

    if (worldStatus.status !== 'running') {
      console.warn(
        `Engine ${engine._id} is not active! Run "npx convex run testing:resume" to restart it.`,
      );
      return;
    }
    await scheduleDefaultElizaAgent(ctx, worldStatus.worldId);
  },
});

async function getOrCreateDefaultWorld(ctx: MutationCtx) {
  const now = Date.now();

  let worldStatus = await ctx.db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .unique();
  if (worldStatus) {
    const engine = (await ctx.db.get(worldStatus.engineId))!;
    return { worldStatus, engine };
  }

  const engineId = await createEngine(ctx);
  const engine = (await ctx.db.get(engineId))!;
  const worldId = await ctx.db.insert('worlds', {
    nextId: 0,
    agents: [],
    conversations: [],
    players: [],
  });
  const worldStatusId = await ctx.db.insert('worldStatus', {
    engineId: engineId,
    isDefault: true,
    lastViewed: now,
    status: 'running',
    worldId: worldId,
  });
  worldStatus = (await ctx.db.get(worldStatusId))!;
  await ctx.db.insert('maps', {
    worldId,
    width: map.mapwidth,
    height: map.mapheight,
    tileSetUrl: map.tilesetpath,
    tileSetDimX: map.tilesetpxw,
    tileSetDimY: map.tilesetpxh,
    tileDim: map.tiledim,
    bgTiles: map.bgtiles,
    objectTiles: map.objmap,
    animatedSprites: map.animatedsprites,
  });
  await ctx.scheduler.runAfter(0, internal.aiTown.main.runStep, {
    worldId,
    generationNumber: engine.generationNumber,
    maxDuration: ENGINE_ACTION_DURATION,
  });
  return { worldStatus, engine };
}

/** Spawn built-in NPCs (Lucky, Bob, Stella, Eliza, …) so the town is alive on first load. */
async function ensureDefaultAgents(
  ctx: MutationCtx,
  worldId: Id<'worlds'>,
  numAgents: number,
) {
  const world = await ctx.db.get(worldId);
  if (!world || world.agents.length > 0) {
    return;
  }

  const count = Math.min(numAgents, Descriptions.length);
  console.log(`[init] Spawning ${count} default NPC agents...`);

  for (let i = 0; i < count; i++) {
    await insertInput(ctx, worldId, 'createAgent', { descriptionIndex: i });
  }

  try {
    await kickEngine(ctx, worldId);
  } catch (error) {
    console.warn(`[init] Failed to kick engine after spawning agents:`, error);
  }
}

/** Wait for eliza-server to start, then spawn a default ElizaOS agent in the world. */
async function scheduleDefaultElizaAgent(ctx: MutationCtx, worldId: Id<'worlds'>) {
  const existing = await ctx.db
    .query('elizaAgents')
    .withIndex('worldId', (q) => q.eq('worldId', worldId))
    .first();
  if (existing) {
    return;
  }
  await ctx.scheduler.runAfter(8000, internal.elizaAgent.bootstrap.ensureDefault, {
    worldId,
  });
}
