import React from 'react';
import { PTTState, PTTMode } from '@botc/shared';
import { MicrophoneIcon, MicrophoneIcon as MicOffIcon } from '@heroicons/react/24/outline';

interface PTTButtonProps {
  pttState: PTTState;
  onToggleMode: (mode: PTTMode) => void;
  onStart: () => void;
  onEnd: () => void;
  className?: string;
}

export const PTTButton: React.FC<PTTButtonProps> = ({
  pttState,
  onToggleMode,
  onStart,
  onEnd,
  className = ''
}) => {
  const isOnCooldown = pttState.cooldownEndTime && pttState.cooldownEndTime > new Date();

  const handleClick = () => {
    if (isOnCooldown) return;

    if (pttState.isSpeaking) {
      onEnd();
    } else {
      onStart();
    }
  };

  const handleModeToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleMode(pttState.mode === 'hold' ? 'toggle' : 'hold');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isOnCooldown}
        className={`
          relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200
          ${pttState.isSpeaking
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }
          ${isOnCooldown ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={pttState.isSpeaking ? 'Click to stop speaking' : 'Click to start speaking'}
      >
        {pttState.isSpeaking ? (
          <MicrophoneIcon className="w-6 h-6" />
        ) : (
          <MicOffIcon className="w-6 h-6" />
        )}

        {/* Speaking indicator */}
        {pttState.isSpeaking && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Cooldown indicator */}
        {isOnCooldown && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-spin" />
        )}
      </button>

      {/* Mode toggle */}
      <button
        onClick={handleModeToggle}
        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
        title={`Current mode: ${pttState.mode}. Click to switch to ${pttState.mode === 'hold' ? 'toggle' : 'hold'}`}
      >
        {pttState.mode === 'hold' ? 'Hold (Space)' : 'Toggle (T)'}
      </button>
    </div>
  );
};
