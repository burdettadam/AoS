import { create } from 'zustand';
import { GameState, GameId, WSMessage, LoadedScript } from '@botc/shared';
import * as Enums from '@botc/shared';
import { SetupApi } from '../api/setupApi';

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
  
  // Setup state
  setupState: any | null;
  grimoireState: any | null;
  currentSetupStep: 'characters' | 'validation' | 'complete';
  setupLoading: boolean;
  setupError: string | null;
  
  // Script state
  availableScripts: LoadedScript[];
  currentScript: LoadedScript | null;
  scriptsLoading: boolean;
  
  // Actions
  connect: (gameId: GameId, viewerSeatId?: string | null) => void;
  disconnect: () => void;
  sendMessage: (message: WSMessage) => void;
  setCurrentGame: (game: GameState) => void;
  setSeat: (seatId: string, isStoryteller?: boolean) => void;
  leaveGame: () => Promise<boolean>;
  
  // Setup actions
  enterSetup: () => Promise<boolean>;
  selectCharacters: (characterIds: string[]) => Promise<boolean>;
  validateSetup: () => Promise<boolean>;
  // Silent background validation used by the UI to keep the start button state up to date
  autoValidate: () => Promise<void>;
  completeSetup: () => Promise<boolean>;
  loadSetupState: () => Promise<void>;
  setSetupError: (error: string | null) => void;
  setSetupStep: (step: 'characters' | 'validation' | 'complete') => void;
  
  // Script actions
  loadScripts: () => Promise<void>;
  loadScript: (scriptId: string) => Promise<LoadedScript | null>;
  setCurrentScript: (script: LoadedScript) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  ws: null,
  currentGame: null,
  gameId: null,
  seatId: (() => {
    try { return localStorage.getItem('botc-seat-id'); } catch { return null; }
  })(),
  isStoryteller: (() => {
    try { const v = localStorage.getItem('botc-is-storyteller'); return v ? JSON.parse(v) : false; } catch { return false; }
  })(),
  
  // Setup state
  setupState: null,
  grimoireState: null,
  currentSetupStep: 'characters',
  setupLoading: false,
  setupError: null,

  // Script state
  availableScripts: [],
  currentScript: null,
  scriptsLoading: false,

  // Actions
  connect: (gameId: GameId, viewerSeatId?: string | null) => {
    const { ws } = get();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    set({ connecting: true, gameId });

  const wsUrl = `${(location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host  }/ws`;
  const websocket = new WebSocket(wsUrl);
    
  websocket.onopen = () => {
      set({ connected: true, connecting: false, ws: websocket });
      
      // Subscribe to game updates
      const viewer = viewerSeatId || get().seatId || undefined;
      websocket.send(JSON.stringify({
        type: 'subscribe',
    gameId,
    viewerSeatId: viewer || undefined
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        
        if (message.type === 'event') {
          // If server sent a full game state snapshot, prefer it
          const snapshot = (message.event.payload as any)?.gameState as GameState | undefined;
          if (snapshot) {
            const seatId = get().seatId;
            set({ currentGame: snapshot, isStoryteller: !!seatId && snapshot.storytellerSeatId === seatId });
            return;
          }

          // Otherwise, apply minimal event-specific updates if needed
          switch (message.event.type) {
            case 'player_joined':
            case 'phase_changed':
            case 'game_created':
              // These are expected to come with snapshots; ignore otherwise for now
              break;
            case 'storyteller_changed': {
              const payload = message.event.payload as { storytellerSeatId?: string };
              set((state) => {
                if (!state.currentGame) return state;
                const updated = { ...state.currentGame, storytellerSeatId: payload.storytellerSeatId } as GameState;
                const seatId = state.seatId;
                return {
                  currentGame: updated,
                  isStoryteller: !!seatId && payload.storytellerSeatId === seatId
                };
              });
              break;
            }
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
  gameId: null,
  setupState: null,
      grimoireState: null,
      setupError: null
    });
  },

  sendMessage: (message: WSMessage) => {
    const { ws, connected } = get();
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  },

  setCurrentGame: (game: GameState) => {
    const seatId = get().seatId;
    set({ currentGame: game, isStoryteller: !!seatId && game.storytellerSeatId === seatId });
  },
  
  setSeat: (seatId: string, isStoryteller?: boolean) => {
    try {
      if (seatId) localStorage.setItem('botc-seat-id', seatId);
      if (typeof isStoryteller === 'boolean') localStorage.setItem('botc-is-storyteller', JSON.stringify(!!isStoryteller));
    } catch {}
    set({ seatId, isStoryteller: !!isStoryteller });
  },

  // Leave the current game (lobby only). Clears local identity.
  leaveGame: async (): Promise<boolean> => {
    const state = get();
    if (!state.gameId || !state.seatId) return false;
    try {
      const res = await fetch(`/api/games/${state.gameId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId: state.seatId })
      });
      if (!res.ok) return false;
      try {
        localStorage.removeItem('botc-seat-id');
        localStorage.removeItem('botc-is-storyteller');
      } catch {}
      // Disconnect and clear game state
      const { ws } = get();
      if (ws) ws.close();
      set({ connected: false, connecting: false, ws: null, currentGame: null, gameId: null, seatId: null, isStoryteller: false, setupState: null, grimoireState: null, setupError: null });
      return true;
    } catch {
      return false;
    }
  },
  
  // Setup actions
  enterSetup: async (): Promise<boolean> => {
    const state = get();
    if (!state.gameId || !state.seatId) return false;
    // If we're already in SETUP, just load state and return success
  if (state.currentGame?.phase === Enums.GamePhase.SETUP) {
      try {
        await get().loadSetupState();
        set({ currentSetupStep: 'characters', setupError: null, setupLoading: false });
        return true;
      } catch {
        // fallthrough to normal path
      }
    }
    
    set({ setupLoading: true, setupError: null });
    
    try {
      const response = await SetupApi.enterSetup(state.gameId, state.seatId);
      
      if (response.success) {
        await get().loadSetupState();
        set({ currentSetupStep: 'characters' });
  // Run validation silently in the background
  get().autoValidate();
      } else {
        set({ setupError: response.error || 'Failed to enter setup phase' });
      }
      
  set({ setupLoading: false });
      return response.success;
    } catch (error) {
      set({ 
        setupLoading: false, 
        setupError: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },
  
  selectCharacters: async (characterIds: string[]): Promise<boolean> => {
    const state = get();
    if (!state.gameId || !state.seatId) return false;
    
    set({ setupLoading: true, setupError: null });
    
    try {
      const response = await SetupApi.selectCharacters(state.gameId, state.seatId, characterIds);
      
      if (response.success) {
        await get().loadSetupState();
  // Run validation silently in the background
  get().autoValidate();
      } else {
        set({ setupError: response.error || 'Failed to select characters' });
      }
      
      set({ setupLoading: false });
      return response.success;
    } catch (error) {
      set({ 
        setupLoading: false, 
        setupError: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },
  
  // Perform validation without changing UI steps or showing loading spinners
  autoValidate: async (): Promise<void> => {
    const state = get();
    if (!state.gameId || !state.seatId) return;
    try {
      const response = await SetupApi.validateSetup(state.gameId, state.seatId);
      // Update a lightweight snapshot only; do not mutate steps/loading
      if (response.success) {
        const valid = response.valid === true;
        const details = response.details || [];
        set({ setupState: { ...(get().setupState || {}), validation: { isValid: valid, issues: details } } });
      } else {
        // If server provides details on failure, store them for tooltip use
        set({ setupState: { ...(get().setupState || {}), validation: { isValid: false, issues: response.details || [] } } });
      }
    } catch {
      // Swallow errors silently for background validation
    }
  },
  
  validateSetup: async (): Promise<boolean> => {
    const state = get();
    if (!state.gameId || !state.seatId) return false;
    
    set({ setupLoading: true, setupError: null });
    
    try {
      const response = await SetupApi.validateSetup(state.gameId, state.seatId);
      
      if (response.success) {
        await get().loadSetupState();
        // Preserve a simple validation snapshot to surface in UI (no step change)
        set({ setupState: { ...(get().setupState || {}), validation: { isValid: response.valid === true, issues: response.details || [] } } });
      } else {
        set({ setupError: response.error || 'Setup validation failed' });
        if (response.details) {
          set({ setupError: `${response.error}: ${response.details.join(', ')}` });
        }
      }
      
      set({ setupLoading: false });
      return response.success;
    } catch (error) {
      set({ 
        setupLoading: false, 
        setupError: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },
  
  completeSetup: async (): Promise<boolean> => {
    const state = get();
    if (!state.gameId || !state.seatId) return false;
    
    set({ setupLoading: true, setupError: null });
    
    try {
      const response = await SetupApi.completeSetup(state.gameId, state.seatId);
      
      if (response.success) {
        set({ 
          currentSetupStep: 'complete',
          setupState: null,
          grimoireState: null
        });
      } else {
        set({ setupError: response.error || 'Failed to complete setup' });
      }
      
      set({ setupLoading: false });
      return response.success;
    } catch (error) {
      set({ 
        setupLoading: false, 
        setupError: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  },
  
  loadSetupState: async (): Promise<void> => {
    const state = get();
    if (!state.gameId) return;
    
    try {
      const response = await SetupApi.getSetupState(state.gameId);
      
      if (response) {
        set((s) => ({ 
          setupState: response.setupState,
          grimoireState: response.grimoireState,
          currentGame: s.currentGame ? { ...s.currentGame, phase: response.phase as any } : s.currentGame
        }));
      } else {
        set({ setupError: 'Failed to load setup state' });
      }
    } catch (error) {
      set({ setupError: error instanceof Error ? error.message : 'Failed to load setup state' });
    }
  },
  
  setSetupError: (error: string | null) => {
    set({ setupError: error });
  },
  
  setSetupStep: (step: 'characters' | 'validation' | 'complete') => {
    set({ currentSetupStep: step });
  },

  // Script actions - Fast cached loading
  loadScripts: async () => {
    const state = get();
    if (state.scriptsLoading || state.availableScripts.length > 0) return;
    
    set({ scriptsLoading: true });
    const startTime = Date.now();
    
    try {
      // Load just the script list first (very fast from cache)
      const response = await fetch('/api/scripts/cached/list');
      if (!response.ok) throw new Error('Failed to load scripts list');
      
      const { scripts: scriptsList } = await response.json();
      
      // Load full script data for each script (also from cache, so very fast)
      const scriptsPromises = scriptsList.map(async (script: { id: string; name: string }) => {
        const res = await fetch(`/api/scripts/cached/${script.id}`);
        if (!res.ok) throw new Error(`Failed to load script ${script.id}`);
        return res.json();
      });
      
      const scripts = await Promise.all(scriptsPromises);
      const endTime = Date.now();
      
      set({ availableScripts: scripts, scriptsLoading: false });
      
      console.log(`⚡ Loaded ${scripts.length} scripts in ${endTime - startTime}ms (cache-optimized)`);
    } catch (error) {
      console.error('Failed to load scripts:', error);
      set({ scriptsLoading: false });
    }
  },

  loadScript: async (scriptId: string): Promise<LoadedScript | null> => {
    try {
      const response = await fetch(`/api/scripts/cached/${scriptId}`);
      if (!response.ok) {
        throw new Error(`Failed to load script ${scriptId}: ${response.statusText}`);
      }
      const script = await response.json();
      return script;
    } catch (error) {
      console.error(`Failed to load script ${scriptId}:`, error);
      return null;
    }
  },

  setCurrentScript: (script: LoadedScript) => {
    set({ currentScript: script });
  }
}));
