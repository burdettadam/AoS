import React from 'react';

interface PlayersListProps {
  players: any[];
  storytellerSeatId?: string;
  seatId?: string;
  isStoryteller?: boolean;
  onMakeStoryteller?: (targetSeatId: string) => void;
}

export const PlayersList: React.FC<PlayersListProps> = ({ players, storytellerSeatId, seatId, isStoryteller, onMakeStoryteller }) => (
  <div className="card p-3 flex-1 flex flex-col">
    <div className="text-xs text-gray-400 mb-2">Players ({players.length})</div>
    <div className="flex-1 overflow-y-auto space-y-1">
      {players.map((s: any, i: number) => (
        <div key={s.id} className="flex items-center justify-between text-sm font-mono p-1 rounded hover:bg-white/5">
          <span className="truncate">{s.playerId || `NPC ${i + 1}`}</span>
          {isStoryteller && storytellerSeatId === seatId && (
            <button
              onClick={() => onMakeStoryteller?.(s.id)}
              className="text-[10px] btn-secondary ml-2 px-1 py-0.5"
              title="Make Storyteller"
            >👑</button>
          )}
        </div>
      ))}
    </div>
  </div>
);
