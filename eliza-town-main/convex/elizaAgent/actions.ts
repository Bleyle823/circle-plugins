import { action, ActionCtx } from '../_generated/server';
import { v } from 'convex/values';
import { internal } from '../_generated/api';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { buildElizaCharacterConfig } from './pluginConfig';
import {
  createAndStartAgent,
  createChatSession,
  elizaServerUrl,
  sendAgentMessage,
  sessionUserId,
} from './elizaApi';
import { sleep } from '../util/sleep';

async function linkWorldPlayer(
  ctx: ActionCtx,
  inputId: Id<'inputs'>,
  worldId: Id<'worlds'>,
  name: string,
) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const status = await ctx.runQuery(api.aiTown.main.inputStatus, { inputId });
    if (status?.kind === 'ok' && status.value?.agentId) {
      const { world } = await ctx.runQuery(api.world.worldState, { worldId });
      const agent = world.agents.find((a: { id: string }) => a.id === status.value.agentId);
      if (agent?.playerId) {
        await ctx.runMutation(internal.elizaAgent.mutations.linkPlayerId, {
          worldId,
          name,
          playerId: agent.playerId,
        });
        return;
      }
    }
    if (status?.kind === 'error') {
      throw new Error(status.message);
    }
    await sleep(500);
  }
  console.warn(`Timed out linking player for Eliza agent "${name}"`);
}

export const createElizaAgent = action({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    character: v.string(),
    identity: v.string(), // Maps to bio
    plan: v.string(),
    personality: v.array(v.string()), // ['Friendly', 'Curious']
  },
  handler: async (ctx, args): Promise<{ inputId: Id<"inputs"> | string; elizaAgentId: string }> => {
    // 1. Create in ElizaOS
    console.log(`Creating Eliza Agent [${args.name}] at ${elizaServerUrl()}...`);
    
    try {
      const characterConfig = buildElizaCharacterConfig({
        name: args.name,
        identity: args.identity,
        personality: args.personality,
        plan: args.plan,
        includeCircle: process.env.ENABLE_CIRCLE_PLUGIN === 'true',
      });

      console.log('Creating and starting ElizaOS agent...');
      const elizaAgentId = await createAndStartAgent(characterConfig);
      console.log(`Eliza Agent created: ${elizaAgentId}`);

      // 2. Create game player using existing API
      // We use api.world.createAgent to create the character in the game engine
      // casting to any to avoid circular type inference issues
      const inputId: any = await ctx.runMutation(api.world.createAgent, {
         worldId: args.worldId,
         name: args.name,
         character: args.character,
         identity: args.identity,
         plan: args.plan,
      });
      
      // 3. Save Mapping
      // We can't link playerId yet as it's created asynchronously by the engine.
      // We map by name/worldId for now, or just store the record.
      await ctx.runMutation(internal.elizaAgent.mutations.saveMapping, {
         worldId: args.worldId,
         name: args.name, 
         elizaAgentId,
         bio: args.identity,
         personality: args.personality,
      });

      await linkWorldPlayer(ctx, inputId, args.worldId, args.name);
      
      return { inputId, elizaAgentId };
    } catch (e: any) {
        console.error("Create Eliza Agent Failed", e);
        throw new Error("Failed to create Eliza Agent: " + e.message);
    }
  },
});

export const sendMessage = action({
  args: {
    elizaAgentId: v.string(),
    message: v.string(),
    senderId: v.string(),
    conversationId: v.string(),
    speakerName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    try {
      const circleEnabled = process.env.ENABLE_CIRCLE_PLUGIN === 'true';
      const userId = sessionUserId(args.senderId);

      const existing = await ctx.runQuery(internal.elizaAgent.queries.getChatSession, {
        elizaAgentId: args.elizaAgentId,
        conversationId: args.conversationId,
      });

      let sessionId: string | undefined = existing?.sessionId;
      if (!sessionId) {
        sessionId = await createChatSession({
          elizaAgentId: args.elizaAgentId,
          userId,
          roomId: args.conversationId,
        });
        await ctx.runMutation(internal.elizaAgent.mutations.upsertChatSession, {
          elizaAgentId: args.elizaAgentId,
          conversationId: args.conversationId,
          sessionId,
          userId,
        });
      }

      return await sendAgentMessage({
        elizaAgentId: args.elizaAgentId,
        message: args.message,
        userId,
        roomId: args.conversationId,
        sessionId,
        speakerName: args.speakerName,
        circleEnabled,
      });
    } catch (error) {
      console.error('Eliza Chat Error', error);
      return null;
    }
  },
});
