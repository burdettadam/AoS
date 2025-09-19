import { GameId, GameState, SeatId } from '@botc/shared';
import { GameEngine } from '../game/engine';
import { logger } from '../utils/logger';

export class MatchmakingService {
  private gameEngine: GameEngine;
  // Optional callback to notify when a game's public state changes
  private onUpdate?: (args: { gameId: GameId; game: GameState; eventType: string; payload?: Record<string, any> }) => void;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  setOnUpdate(cb: (args: { gameId: GameId; game: GameState; eventType: string; payload?: Record<string, any> }) => void) {
    this.onUpdate = cb;
  }

  async createGame(scriptId?: string, options?: { isPublic?: boolean }): Promise<GameId> {
    try {
      const gameId = await this.gameEngine.createGame(scriptId, options);
      logger.info(`Matchmaking created game: ${gameId}`);
      const game = this.gameEngine.getGame(gameId);
      if (game && this.onUpdate) {
        this.onUpdate({ gameId, game, eventType: 'game_created' });
      }
      return gameId;
    } catch (error) {
      logger.error('Failed to create game:', error);
      throw error;
    }
  }

  async joinGame(gameId: GameId, playerId: string): Promise<SeatId | null> {
    try {
    const seatId = await this.gameEngine.addPlayer(gameId, playerId);
    if (seatId) {
        logger.info(`Player ${playerId} joined game ${gameId}`);
        const game = this.gameEngine.getGame(gameId);
        if (game && this.onUpdate) {
      this.onUpdate({ gameId, game, eventType: 'player_joined', payload: { playerId, seatId } });
        }
      } else {
        logger.warn(`Failed to add player ${playerId} to game ${gameId}`);
      }
      return seatId;
    } catch (error) {
      logger.error(`Error adding player ${playerId} to game ${gameId}:`, error);
      return null;
    }
  }

  async startGame(gameId: GameId): Promise<boolean> {
    try {
      const success = await this.gameEngine.startGame(gameId);
      if (success) {
        logger.info(`Game ${gameId} started successfully`);
        const game = this.gameEngine.getGame(gameId);
        if (game && this.onUpdate) {
          this.onUpdate({ gameId, game, eventType: 'phase_changed', payload: { phase: game.phase } });
        }
      } else {
        logger.warn(`Failed to start game ${gameId}`);
      }
      return success;
    } catch (error) {
      logger.error(`Error starting game ${gameId}:`, error);
      return false;
    }
  }

  async addNPC(gameId: GameId): Promise<boolean> {
    try {
      const seatId = await this.gameEngine.addPlayer(gameId, `npc-${Math.random().toString(36).slice(2,8)}`, true);
      if (seatId) {
        const game = this.gameEngine.getGame(gameId);
        if (game && this.onUpdate) {
          this.onUpdate({ gameId, game, eventType: 'player_joined', payload: { isNPC: true, seatId } });
        }
      }
      return !!seatId;
    } catch (error) {
      logger.error(`Error adding NPC to game ${gameId}:`, error);
      return false;
    }
  }

  proposeScript(gameId: GameId, proposer: string, scriptId: string, active: boolean = true): boolean {
    return !!this.gameEngine.proposeScript(gameId, proposer as any, scriptId, active);
  }

  voteOnScript(gameId: GameId, voterSeat: string, proposalId: string, vote: boolean | null | undefined): boolean {
    return this.gameEngine.voteOnScript(gameId, voterSeat as any, proposalId, vote);
  }

  getActiveGames(): GameState[] {
    return this.gameEngine.getActiveGames();
  }

  getPublicGames(): GameState[] {
    return this.gameEngine.getPublicGames();
  }

  getGame(gameId: GameId): GameState | undefined {
    return this.gameEngine.getGame(gameId);
  }

  // Queue system for matchmaking (future implementation)
  private playerQueue: string[] = [];

  addToQueue(playerId: string): void {
    if (!this.playerQueue.includes(playerId)) {
      this.playerQueue.push(playerId);
      logger.info(`Player ${playerId} added to matchmaking queue`);
      
      // Try to match players
      this.tryMatchPlayers();
    }
  }

  removeFromQueue(playerId: string): void {
    const index = this.playerQueue.indexOf(playerId);
    if (index > -1) {
      this.playerQueue.splice(index, 1);
      logger.info(`Player ${playerId} removed from matchmaking queue`);
    }
  }

  private async tryMatchPlayers(): Promise<void> {
    // Simple matchmaking: create game when we have enough players
    const minPlayers = 5;
    
    if (this.playerQueue.length >= minPlayers) {
      try {
        const gameId = await this.createGame();
        
        // Add first N players to the game
        const playersToMatch = this.playerQueue.splice(0, minPlayers);
        
        for (const playerId of playersToMatch) {
          await this.joinGame(gameId, playerId);
        }

        logger.info(`Matched ${playersToMatch.length} players to game ${gameId}`);
      } catch (error) {
        logger.error('Failed to match players:', error);
        // Re-add players to queue on failure
        // this.playerQueue.unshift(...playersToMatch);
      }
    }
  }

  getQueueLength(): number {
    return this.playerQueue.length;
  }
}
