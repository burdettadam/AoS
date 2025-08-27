import { create } from 'zustand';
import { GameState, GameId, WSMessage } from '@botc/shared';

interface GameStore {
  // Connection state
  connected: boolean;
  connecting: boolean;
  ws: WebSocket | null;
  
  // Game state
  currentGame: GameState | null;
  gameId: GameId | null;
  seatId: string | null;
  isStoryteller: boolean;
  
  // Actions
  connect: (gameId: GameId, viewerSeatId?: string | null) => void;
  disconnect: () => void;
  sendMessage: (message: WSMessage) => void;
  setCurrentGame: (game: GameState) => void;
  setSeat: (seatId: string, isStoryteller?: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  ws: null,
  currentGame: null,
  gameId: null,
  seatId: null,
  isStoryteller: false,

  // Actions
  connect: (gameId: GameId, viewerSeatId?: string | null) => {
    const { ws } = get();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    set({ connecting: true, gameId });

  const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
  const websocket = new WebSocket(wsUrl);
    
  websocket.onopen = () => {
      set({ connected: true, connecting: false, ws: websocket });
      
      // Subscribe to game updates
      websocket.send(JSON.stringify({
        type: 'subscribe',
    gameId,
    viewerSeatId: viewerSeatId || undefined
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        
        if (message.type === 'event') {
          // If server sent a full game state snapshot, prefer it
          const snapshot = (message.event.payload as any)?.gameState as GameState | undefined;
          if (snapshot) {
            set({ currentGame: snapshot });
            return;
          }

          // Otherwise, apply minimal event-specific updates if needed
          switch (message.event.type) {
            case 'player_joined':
            case 'phase_changed':
            case 'game_created':
              // These are expected to come with snapshots; ignore otherwise for now
              break;
            default:
              break;
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      set({ connected: false, connecting: false, ws: null });
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      set({ connected: false, connecting: false, ws: null });
    };
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({ 
      connected: false, 
      connecting: false, 
      ws: null, 
      currentGame: null, 
      gameId: null 
    });
  },

  sendMessage: (message: WSMessage) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  },

  setCurrentGame: (game: GameState) => {
    set({ currentGame: game });
  },
  setSeat: (seatId: string, isStoryteller?: boolean) => {
    set({ seatId, isStoryteller: !!isStoryteller });
  }
}));
