import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

const GamePage: React.FC = () => {
  const { gameId } = useParams();
  const { connect, currentGame, seatId, isStoryteller } = useGameStore() as any;

  useEffect(() => {
    if (!gameId) return;
  connect(gameId as any, seatId);
  }, [gameId]);

  if (!currentGame) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 text-center">Loading game...</div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string | undefined) => {
    if (!role) return 'Unknown';
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getAlignmentColor = (alignment: string | undefined) => {
    switch (alignment) {
      case 'good': return 'text-blue-400';
      case 'evil': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
  <h1 className="text-4xl font-medieval font-bold text-center mb-8">Blood on the Clocktower</h1>
      
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
          <div className="text-sm text-gray-400 flex items-center gap-3">
            <span>Script: {currentGame.scriptId}</span>
            {isStoryteller && <span className="px-2 py-0.5 rounded bg-yellow-700 text-yellow-200">Storyteller</span>}
          </div>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Players</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentGame.seats.map((seat: any, index: number) => (
            <div 
              key={seat.id} 
              className={`p-4 rounded-lg border-2 transition-all ${
                seat.isAlive 
                  ? 'bg-clocktower-dark border-gray-700 hover:border-gray-600' 
                  : 'bg-gray-800 border-gray-800 opacity-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-gray-400">Seat {index + 1}</div>
                <div className={`text-xs px-2 py-1 rounded ${
                  seat.isAlive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {seat.isAlive ? 'Alive' : 'Dead'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium truncate">
                  {seat.playerId ? (
                    <span className="text-white">{seat.playerId.slice(0, 8)}...</span>
                  ) : (
                    <span className="text-purple-400">NPC</span>
                  )}
                </div>
                
                {seat.role && (
                  <div className="text-sm">
                    {isStoryteller || (seatId && seat.id === seatId) ? (
                      <span className={`font-medium ${getAlignmentColor(seat.alignment)}`}>
                        {getRoleDisplayName(seat.role)}
                      </span>
                    ) : (
                      <span className="text-gray-500">Hidden</span>
                    )}
                  </div>
                )}
                
                {seat.statuses && seat.statuses.length > 0 && (
                  <div className="text-xs text-yellow-400">
                    {seat.statuses.join(', ')}
                  </div>
                )}
                
                {seat.votingPower !== 1 && (
                  <div className="text-xs text-orange-400">
                    Votes: {seat.votingPower}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
