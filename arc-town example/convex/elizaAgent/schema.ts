import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { conversationId, playerId } from '../aiTown/ids';

export const elizaAgentTables = {
  elizaAgents: defineTable({
    playerId: v.optional(playerId),
    worldId: v.id('worlds'),
    elizaAgentId: v.string(),     // UUID from ElizaOS
    name: v.string(),
    bio: v.string(),
    personality: v.array(v.string()), // ['Friendly', 'Curious']
    createdAt: v.number(),
  })
    .index('playerId', ['playerId'])
    .index('elizaAgentId', ['elizaAgentId'])
    .index('worldId', ['worldId']),

  /** Reused ElizaOS messaging sessions per town conversation. */
  elizaChatSessions: defineTable({
    elizaAgentId: v.string(),
    conversationId,
    sessionId: v.string(),
    userId: v.string(),
    updatedAt: v.number(),
  }).index('byConversation', ['elizaAgentId', 'conversationId']),
};
