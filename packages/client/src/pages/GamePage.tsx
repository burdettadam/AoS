import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useNavigate } from 'react-router-dom';
import { usePTT } from '../utils/usePTT';
import { PTTButton } from '../components/PTTButton';
import { VideoTile } from '../components/VideoTile';

const GamePage: React.FC = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { connect, currentGame, seatId, isStoryteller, leaveGame } = useGameStore() as any;
  const { pttState, startPTT, endPTT, setMode } = usePTT();

  useEffect(() => {
    if (!gameId) return;
  connect(gameId as any, seatId || (typeof localStorage !== 'undefined' ? localStorage.getItem('botc-seat-id') : undefined) || undefined);
  }, [gameId]);

  if (!currentGame) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 text-center">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
  <h1 className="text-4xl font-medieval font-bold text-center mb-8">Blood on the Clocktower</h1>
      <div className="flex justify-end mb-2">
        <button
          className="btn-secondary"
          onClick={async () => {
            const ok = await leaveGame();
            if (ok) navigate('/');
          }}
        >
          Leave Game
        </button>
      </div>
      
      {/* Game Status */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-8">
            <div>
              <span className="text-gray-400">Phase:</span> 
              <span className="font-semibold ml-2">{currentGame.phase}</span>
            </div>
            <div>
              <span className="text-gray-400">Day:</span> 
              <span className="font-semibold ml-2">{currentGame.day}</span>
            </div>
            <div>
              <span className="text-gray-400">Players:</span> 
              <span className="font-semibold ml-2">{currentGame.seats.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PTTButton
              pttState={pttState}
              onToggleMode={setMode}
              onStart={startPTT}
              onEnd={endPTT}
            />
            <div className="text-sm text-gray-400 flex items-center gap-3">
              <span>Script: {currentGame.scriptId}</span>
              {isStoryteller && <span className="px-2 py-0.5 rounded bg-yellow-700 text-yellow-200">Storyteller</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Players</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentGame.seats.map((seat: any, index: number) => {
            // Mock PTT state - in real implementation this would come from WebSocket events
            const mockPttState = {
              seatId: seat.id,
              isMuted: true,
              isSpeaking: false,
              volume: 0.8,
              isDucked: false
            };

            return (
              <VideoTile
                key={seat.id}
                seatId={seat.id}
                playerName={seat.playerId ? seat.playerId.slice(0, 8) : `NPC ${index + 1}`}
                pttState={mockPttState}
                isStoryteller={isStoryteller && seatId === seat.id}
                className={`aspect-video ${
                  seat.isAlive
                    ? 'ring-2 ring-gray-700 hover:ring-gray-600'
                    : 'opacity-50'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
