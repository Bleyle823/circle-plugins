import { useState } from 'react';
import PixiGame from './PixiGame.tsx';

import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { useAutoJoinWorld } from '../hooks/useAutoJoinWorld.ts';
import { useEnsureWorld } from '../hooks/useEnsureWorld.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

function WorldLoading({ message, error }: { message: string; error?: string | null }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-brown-900">
      <div className="text-center font-dialog space-y-3 px-6">
        <p className="text-[#e0dce6] text-lg">{message}</p>
        {error && (
          <p className="text-red-300 text-sm max-w-md">
            {error}
            <br />
            <span className="text-[#a395b8] text-xs">
              Add OPENROUTER_API_KEY to .env.local, then run npm run setup
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const { worldId, engineId, isLoading, initError } = useEnsureWorld();
  const game = useServerGame(worldId);

  const { humanPlayerId, isJoining } = useAutoJoinWorld(worldId);

  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);

  if (isLoading) {
    return <WorldLoading message="Starting Eliza Town..." />;
  }

  if (initError && !worldId) {
    return <WorldLoading message="Could not start the world." error={initError} />;
  }

  if (!worldId || !engineId || !game) {
    return <WorldLoading message="Loading world..." />;
  }

  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      {!humanPlayerId && isJoining && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-[#23202b]/90 border-2 border-[#4a3b5b] px-6 py-3 text-[#e0dce6] font-dialog text-sm">
            Entering town...
          </div>
        </div>
      )}
      <div className="w-full h-full relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
        <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
          <ConvexProvider client={convex}>
            <PixiGame
              game={game}
              worldId={worldId}
              engineId={engineId}
              width={width}
              height={height}
              historicalTime={historicalTime}
              setSelectedElement={setSelectedElement}
            />
          </ConvexProvider>
        </Stage>

        <div className="absolute top-0 right-0 z-10 h-full w-80 lg:w-96 p-4 flex flex-col pointer-events-auto overflow-hidden">
          <PlayerDetails
            worldId={worldId}
            engineId={engineId}
            game={game}
            playerId={selectedElement?.id}
            setSelectedElement={setSelectedElement}
          />
        </div>
      </div>
    </>
  );
}
