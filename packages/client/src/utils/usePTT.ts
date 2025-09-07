import { useState, useEffect, useCallback, useRef } from 'react';
import { PTTState, PTTMode, PTTSession } from '@botc/shared';
import { useGameStore } from '../store/gameStore';

const PTT_COOLDOWN_MS = 500;
const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 16000,
  channelCount: 1
};

export const usePTT = () => {
  const { sendMessage, seatId } = useGameStore();
  const [pttState, setPttState] = useState<PTTState>({
    isMuted: true,
    isSpeaking: false,
    mode: 'hold',
    cooldownEndTime: undefined,
    currentSession: undefined,
    lastSession: undefined
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize microphone access
  useEffect(() => {
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONSTRAINTS
        });
        streamRef.current = stream;

        // Create MediaRecorder for low-bitrate mono audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error('Failed to initialize microphone:', error);
      }
    };

    initMic();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (cooldownTimeoutRef.current) {
        clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  // Handle PTT start
  const startPTT = useCallback(() => {
    if (!mediaRecorderRef.current || pttState.isSpeaking || pttState.cooldownEndTime) {
      return;
    }

    const sessionId = crypto.randomUUID();
    const session: PTTSession = {
      id: sessionId,
      seatId: seatId!,
      startTime: new Date()
    };

    setPttState(prev => ({
      ...prev,
      isMuted: false,
      isSpeaking: true,
      currentSession: session
    }));

    // Start recording
    audioChunksRef.current = [];
    mediaRecorderRef.current.start(100); // Collect data every 100ms

    // Send PTT start event
    sendMessage({
      type: 'cmd',
      cmd: {
        kind: 'ptt_start',
        payload: { sessionId, seatId }
      }
    });
  }, [pttState.isSpeaking, pttState.cooldownEndTime, seatId, sendMessage]);

  // Handle PTT end
  const endPTT = useCallback(async () => {
    if (!mediaRecorderRef.current || !pttState.isSpeaking || !pttState.currentSession) {
      return;
    }

    // Stop recording
    mediaRecorderRef.current.stop();

    const endTime = new Date();
    const session = {
      ...pttState.currentSession,
      endTime
    };

    // Create audio blob and get URI
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const audioUri = URL.createObjectURL(audioBlob);

    const completedSession: PTTSession = {
      ...session,
      audioUri
    };

    setPttState(prev => ({
      ...prev,
      isMuted: true,
      isSpeaking: false,
      lastSession: completedSession,
      currentSession: undefined,
      cooldownEndTime: new Date(Date.now() + PTT_COOLDOWN_MS)
    }));

    // Send PTT end event
    sendMessage({
      type: 'cmd',
      cmd: {
        kind: 'ptt_end',
        payload: {
          sessionId: session.id,
          seatId,
          audioUri,
          duration: endTime.getTime() - session.startTime.getTime()
        }
      }
    });

    // Start cooldown
    cooldownTimeoutRef.current = setTimeout(() => {
      setPttState(prev => ({
        ...prev,
        cooldownEndTime: undefined
      }));
    }, PTT_COOLDOWN_MS);
  }, [pttState.isSpeaking, pttState.currentSession, seatId, sendMessage]);

  // Handle PTT toggle
  const togglePTT = useCallback(() => {
    if (pttState.isSpeaking) {
      endPTT();
    } else {
      startPTT();
    }
  }, [pttState.isSpeaking, startPTT, endPTT]);

  // Handle mode change
  const setMode = useCallback((mode: PTTMode) => {
    setPttState(prev => ({ ...prev, mode }));
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && pttState.mode === 'hold') {
        event.preventDefault();
        startPTT();
      } else if (event.code === 'KeyT' && pttState.mode === 'toggle') {
        event.preventDefault();
        togglePTT();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && pttState.mode === 'hold') {
        event.preventDefault();
        endPTT();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [pttState.mode, startPTT, endPTT, togglePTT]);

  return {
    pttState,
    startPTT,
    endPTT,
    togglePTT,
    setMode
  };
};
