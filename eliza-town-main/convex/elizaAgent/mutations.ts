import { v } from 'convex/values';
import { conversationId } from '../aiTown/ids';
import { internalMutation } from '../_generated/server';

export const linkPlayerId = internalMutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('elizaAgents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .filter((q) => q.eq(q.field('name'), args.name))
      .first();
    if (!record) {
      console.warn(`No elizaAgents record found for ${args.name} in world ${args.worldId}`);
      return;
    }
    await ctx.db.patch(record._id, { playerId: args.playerId });
  },
});

export const saveMapping = internalMutation({
  args: {
    worldId: v.id('worlds'),
    playerId: v.optional(v.id('players')), // Using generic ID type as it maps to players table
    elizaAgentId: v.string(),
    name: v.string(),
    bio: v.string(),
    personality: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('elizaAgents', {
      playerId: args.playerId,
      worldId: args.worldId,
      elizaAgentId: args.elizaAgentId,
      name: args.name,
      bio: args.bio,
      personality: args.personality,
      createdAt: Date.now(),
    });
  },
});

export const upsertChatSession = internalMutation({
  args: {
    elizaAgentId: v.string(),
    conversationId,
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('elizaChatSessions')
      .withIndex('byConversation', (q) =>
        q.eq('elizaAgentId', args.elizaAgentId).eq('conversationId', args.conversationId),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        sessionId: args.sessionId,
        userId: args.userId,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert('elizaChatSessions', {
      elizaAgentId: args.elizaAgentId,
      conversationId: args.conversationId,
      sessionId: args.sessionId,
      userId: args.userId,
      updatedAt: Date.now(),
    });
  },
});
