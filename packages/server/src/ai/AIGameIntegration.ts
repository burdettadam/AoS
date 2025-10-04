/**
 * Example integration of AI Agents with the existing game system
 * This shows how to modify the GameEngine to support AI NPCs
 */

import { GameId, GameState, SeatId } from "@ashes-of-salem/shared";
import { GameEngine } from "../game/engine";
import { logger } from "../utils/logger";
import { AIAgentManager } from "./AIAgentManager";

/**
 * Extended GameEngine with AI integration
 * This would be integrated into your existing GameEngine class
 */
export class AIEnhancedGameEngine extends GameEngine {
  private aiManager: AIAgentManager;

  constructor() {
    super();
    this.aiManager = new AIAgentManager(this);
  }

  /**
   * Initialize AI system when server starts
   */
  async initializeAI(): Promise<boolean> {
    const initialized = await this.aiManager.initialize();
    if (initialized) {
      logger.info("✅ AI Agent system ready for NPC players");
    } else {
      logger.warn("⚠️  AI Agent system not available - NPCs will be basic");
    }
    return initialized;
  }

  /**
   * Override addPlayer to support AI agents
   */
  async addPlayer(
    gameId: GameId,
    playerId: string,
    isNPC: boolean = false,
  ): Promise<SeatId | null> {
    const seatId = await super.addPlayer(gameId, playerId, isNPC);

    if (seatId && isNPC && this.aiManager.isReady()) {
      // We'll create the AI agent later during role assignment
      // when we know what character this NPC will play
      logger.info(
        `NPC seat ${seatId} created, AI agent will be created during setup`,
      );
    }

    return seatId;
  }

  /**
   * Override completeSetup to create AI agents for NPCs
   */
  async completeSetup(
    gameId: GameId,
    storytellerSeatId: SeatId,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await super.completeSetup(gameId, storytellerSeatId);

    if (result.ok && this.aiManager.isReady()) {
      await this.createAIAgentsForGame(gameId);
    }

    return result;
  }

  /**
   * Create AI agents for all NPCs in a game after roles are assigned
   */
  private async createAIAgentsForGame(gameId: GameId): Promise<void> {
    const game = this.getGame(gameId);
    if (!game) return;

    for (const seat of game.seats) {
      if (seat.isNPC && seat.role) {
        // TODO: Get character data from seat.role
        // const character = await this.getCharacterById(seat.role);
        const seatName = seat.playerId || `NPC-${seat.position}`;

        // For now, create a mock character for demo
        const mockCharacter = {
          id: seat.role,
          name: seat.role,
          team: "townsfolk" as const,
          ability: "Placeholder character ability",
        };

        const success = await this.aiManager.createAgent(
          gameId,
          seat.id,
          mockCharacter as any,
          seatName,
        );

        if (success) {
          logger.info(
            `🤖 Created AI agent for ${seatName} playing ${mockCharacter.name}`,
          );
        }
      }
    }
  }

  /**
   * Override phase advancement to notify AI agents
   */
  async advancePhase(
    gameId: GameId,
    storytellerSeatId: SeatId,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await super.advancePhase(gameId, storytellerSeatId);

    if (result.ok) {
      const game = this.getGame(gameId);
      if (game) {
        await this.aiManager.processGameEvent(gameId, "phase_changed", game);
      }
    }

    return result;
  }

  /**
   * Handle voting phase with AI agents
   */
  async startVoting(
    gameId: GameId,
    nominee: string,
    nominationReason: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    // This would be your existing voting logic
    const game = this.getGame(gameId);
    if (!game) return { ok: false, error: "Game not found" };

    // Start voting phase in game state
    // ... your existing voting logic here ...

    // Let AI agents make their voting decisions
    if (this.aiManager.isReady()) {
      await this.aiManager.processVotingPhase(
        gameId,
        nominee,
        nominationReason,
        game,
      );
    }

    return { ok: true };
  }

  /**
   * Override endGame to clean up AI agents
   */
  async endGame(
    gameId: GameId,
    storytellerSeatId: SeatId,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await super.endGame(gameId, storytellerSeatId);

    if (result.ok) {
      this.aiManager.removeGameAgents(gameId);
      logger.info(`🧹 Cleaned up AI agents for completed game ${gameId}`);
    }

    return result;
  }

  /**
   * Get AI system statistics
   */
  getAIStats() {
    return this.aiManager.getStats();
  }

  /**
   * Shutdown AI system
   */
  shutdownAI(): void {
    this.aiManager.shutdown();
  }
}

/**
 * Example API routes for AI management
 */
export const aiRoutes = {
  // Get AI system status
  "GET /api/ai/status": async () => {
    const engine = new AIEnhancedGameEngine();
    return {
      ready: engine.getAIStats().enabled,
      stats: engine.getAIStats(),
    };
  },

  // Add AI NPC to a game
  "POST /api/games/:gameId/npc/ai": async (gameId: GameId) => {
    const engine = new AIEnhancedGameEngine();
    const seatId = await engine.addPlayer(gameId, `ai-npc-${Date.now()}`, true);

    return {
      success: !!seatId,
      seatId,
      message: seatId ? "AI NPC added to game" : "Failed to add AI NPC",
    };
  },
};

/**
 * Example WebSocket integration for AI chat messages
 */
export class AIWebSocketHandler {
  constructor(private aiManager: AIAgentManager) {}

  /**
   * Broadcast AI chat message to game
   */
  async broadcastAIMessage(
    gameId: GameId,
    seatId: SeatId,
    message: string,
  ): Promise<void> {
    // This would integrate with your existing WebSocket system
    // Broadcast to all players in the game
    // webSocketManager.broadcastToGame(gameId, chatMessage);

    logger.info(`[AI Chat] ${gameId}/${seatId}: ${message}`);
  }

  /**
   * Handle player chat messages - AI agents might respond
   */
  async onPlayerMessage(
    gameId: GameId,
    _seatId: SeatId,
    _message: string,
  ): Promise<void> {
    // Notify AI agents about player messages
    const game = await this.getGameState(gameId);
    if (game) {
      await this.aiManager.processGameEvent(gameId, "player_spoke", game);
    }
  }

  private async getGameState(_gameId: GameId): Promise<GameState | null> {
    // This would get the game state from your GameEngine
    return null;
  }
}
