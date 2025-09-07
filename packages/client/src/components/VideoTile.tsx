import React from 'react';
import { VideoTileState } from '@botc/shared';
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface VideoTileProps {
  seatId: string;
  playerName?: string;
  videoStream?: MediaStream;
  pttState?: VideoTileState;
  isStoryteller?: boolean;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  seatId,
  playerName,
  videoStream,
  pttState,
  isStoryteller = false,
  className = ''
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  return (
    <div className={`relative bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />

      {/* PTT Indicators */}
      {pttState && (
        <div className="absolute top-2 left-2 flex gap-1">
          {/* Speaking indicator */}
          {pttState.isSpeaking && (
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
              <MicrophoneIcon className="w-3 h-3" />
              <span>Speaking</span>
            </div>
          )}

          {/* Muted indicator */}
          {pttState.isMuted && !pttState.isSpeaking && (
            <div className="flex items-center gap-1 bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs">
              <MicrophoneIcon className="w-3 h-3" />
              <span>Muted</span>
            </div>
          )}

          {/* Ducked indicator */}
          {pttState.isDucked && (
            <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded text-xs">
              <SpeakerWaveIcon className="w-3 h-3" />
              <span>Ducked</span>
            </div>
          )}
        </div>
      )}

      {/* Player info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="text-white font-medium">
            {playerName || `Player ${seatId.slice(0, 8)}`}
          </div>
          {isStoryteller && (
            <div className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium">
              Storyteller
            </div>
          )}
        </div>
      </div>

      {/* Volume indicator */}
      {pttState && (
        <div className="absolute bottom-2 right-2">
          <div className="w-16 h-1 bg-gray-600 rounded">
            <div
              className="h-full bg-green-500 rounded transition-all duration-200"
              style={{ width: `${pttState.volume * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
