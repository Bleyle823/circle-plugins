import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { api } from '../_generated/api';
import { internal } from '../_generated/api';
import { STARTER_AGENT } from '../../data/starterDefaults';

/** Spawn a default ElizaOS agent into the world if none exist yet. */
export const ensureDefault = internalAction({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(internal.elizaAgent.queries.listByWorldId, {
      worldId: args.worldId,
    });
    if (existing.length > 0) {
      return;
    }

    console.log(`[eliza-town] Bootstrapping default agent "${STARTER_AGENT.name}"...`);

    await ctx.runAction(api.elizaAgent.actions.createElizaAgent, {
      worldId: args.worldId,
      name: STARTER_AGENT.name,
      character: STARTER_AGENT.character,
      identity: STARTER_AGENT.identity,
      plan: STARTER_AGENT.plan,
      personality: STARTER_AGENT.personality,
    });
  },
});
