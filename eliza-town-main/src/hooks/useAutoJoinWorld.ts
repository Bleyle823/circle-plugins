import { useEffect, useRef } from 'react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { STARTER_PLAYER_CHARACTER } from '../../data/starterDefaults';
import { waitForInput } from './sendInput';
import { useServerGame } from './serverGame';

/** Join the world as a playable character on first load (click-to-walk). */
export function useAutoJoinWorld(worldId: Id<'worlds'> | undefined) {
  const game = useServerGame(worldId);
  const humanTokenIdentifier = useQuery(api.world.userStatus, worldId ? { worldId } : 'skip');
  const join = useMutation(api.world.joinWorld);
  const convex = useConvex();
  const joiningRef = useRef(false);

  const humanPlayerId =
    game && humanTokenIdentifier
      ? [...game.world.players.values()].find((p) => p.human === humanTokenIdentifier)?.id
      : undefined;

  useEffect(() => {
    if (!worldId || game === undefined || humanPlayerId || joiningRef.current) {
      return;
    }
    joiningRef.current = true;
    void (async () => {
      try {
        const inputId = await join({
          worldId,
          character: STARTER_PLAYER_CHARACTER,
        });
        await waitForInput(convex, inputId, {
          timeoutMs: 15000,
          timeoutMessage: 'World is still loading. Refresh in a moment.',
        });
      } catch (error) {
        console.warn('[eliza-town] Auto-join failed:', error);
        joiningRef.current = false;
      }
    })();
  }, [worldId, game, humanPlayerId, join, convex]);

  return { humanPlayerId, isJoining: joiningRef.current && !humanPlayerId };
}
