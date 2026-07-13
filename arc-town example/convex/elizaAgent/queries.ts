import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';
import { conversationId } from '../aiTown/ids';

export const listByWorldId = internalQuery({
  args: {
    worldId: v.id('worlds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('elizaAgents')
      .withIndex('worldId', (q) => q.eq('worldId', args.worldId))
      .collect();
  },
});

export const getChatSession = internalQuery({
  args: {
    elizaAgentId: v.string(),
    conversationId,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('elizaChatSessions')
      .withIndex('byConversation', (q) =>
        q.eq('elizaAgentId', args.elizaAgentId).eq('conversationId', args.conversationId),
      )
      .first();
  },
});
