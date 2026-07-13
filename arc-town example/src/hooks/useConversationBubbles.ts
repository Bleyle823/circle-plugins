import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { GameId } from '../../convex/aiTown/ids';
import { Id } from '../../convex/_generated/dataModel';
import { TYPING_TIMEOUT } from '../../convex/constants';
import { ServerGame } from './serverGame';

/** How long a spoken line stays visible above a character. */
const BUBBLE_DISPLAY_MS = 12_000;

export function useConversationBubbles(
  worldId: Id<'worlds'>,
  game: ServerGame | undefined,
  historicalTime?: number,
): Map<GameId<'players'>, string> {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (historicalTime !== undefined) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [historicalTime]);

  const effectiveNow = historicalTime ?? now;

  const activeConversationIds = useMemo(() => {
    if (!game) {
      return [];
    }
    const ids: string[] = [];
    for (const conversation of game.world.conversations.values()) {
      const isParticipating = [...conversation.participants.values()].every(
        (member) => member.status.kind === 'participating',
      );
      if (isParticipating) {
        ids.push(conversation.id);
      }
    }
    return ids;
  }, [game]);

  const latestMessages = useQuery(
    api.messages.latestForConversations,
    activeConversationIds.length > 0 ? { worldId, conversationIds: activeConversationIds } : 'skip',
  );

  return useMemo(() => {
    const bubbles = new Map<GameId<'players'>, string>();
    if (!game) {
      return bubbles;
    }

    for (const conversation of game.world.conversations.values()) {
      const isParticipating = [...conversation.participants.values()].every(
        (member) => member.status.kind === 'participating',
      );
      if (!isParticipating) {
        continue;
      }

      if (conversation.isTyping) {
        const typingAge = effectiveNow - conversation.isTyping.since;
        if (typingAge < TYPING_TIMEOUT) {
          bubbles.set(conversation.isTyping.playerId, '...');
        }
      }

      const latest = latestMessages?.[conversation.id];
      if (!latest) {
        continue;
      }

      const messageAge = effectiveNow - latest.timestamp;
      if (messageAge > BUBBLE_DISPLAY_MS) {
        continue;
      }

      // Show the latest line above whoever said it (typing indicator wins for that player).
      if (!bubbles.has(latest.author)) {
        bubbles.set(latest.author, latest.text);
      }
    }

    return bubbles;
  }, [game, latestMessages, effectiveNow]);
}
