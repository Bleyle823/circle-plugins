import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

/** Create the default world + NPC agents if init has not run yet. */
export function useEnsureWorld() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const initWorld = useMutation(api.init.init);
  const started = useRef(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (worldStatus !== null || started.current) {
      return;
    }
    started.current = true;
    void initWorld({ numAgents: 4 })
      .then(() => setInitError(null))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[eliza-town] World init failed:', message);
        setInitError(message);
        started.current = false;
      });
  }, [worldStatus, initWorld]);

  return {
    worldStatus,
    worldId: worldStatus?.worldId,
    engineId: worldStatus?.engineId,
    isLoading: worldStatus === undefined || (worldStatus === null && !initError),
    initError,
  };
}
