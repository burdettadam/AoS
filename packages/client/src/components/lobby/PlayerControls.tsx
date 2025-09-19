import React from 'react';

interface PlayerControlsProps {
  onAddNPC: () => void;
  onCopyLink: () => void;
  onLeaveGame: () => void;
  canLeave?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ onAddNPC, onCopyLink, onLeaveGame, canLeave }) => (
  <div className="space-y-2 mt-3">
    <button className="w-full btn-secondary text-sm" onClick={onAddNPC}>Add NPC</button>
    <button className="w-full btn-secondary text-sm" onClick={onCopyLink}>Copy Lobby Link</button>
    {canLeave && (
      <button className="w-full btn-secondary text-sm" onClick={onLeaveGame}>Leave Game</button>
    )}
  </div>
);
