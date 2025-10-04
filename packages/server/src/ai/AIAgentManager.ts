import type { NPCProfile } from "@ashes-of-salem/shared";
import { Character, GameId, GameState, SeatId } from "@ashes-of-salem/shared";
import { GameEngine } from "../game/engine";
import { logger } from "../utils/logger";
import { AIDecision, NPCAIAgent } from "./agents/NPCAIAgent";
import { OllamaClient } from "./llm/OllamaClient";

export class AIAgentManager {
  private gameEngine: GameEngine;
  private ollamaClient: OllamaClient;
  private agents: Map<string, NPCAIAgent> = new Map(); // gameId-seatId -> agent
  private isEnabled: boolean = false;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
    this.ollamaClient = new OllamaClient();
  }

  /**
   * Initialize AI system - checks if Ollama is available
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info("Initializing AI Agent Manager...");

      const isOllamaHealthy = await this.ollamaClient.healthCheck();
      if (!isOllamaHealthy) {
        logger.warn(
          "Ollama is not available. Attempting to ensure DeepSeek model...",
        );
        const modelEnsured =
          await this.ollamaClient.ensureModel("deepseek-r1:7b");
        if (!modelEnsured) {
          logger.error("Could not ensure DeepSeek model is available");
          return false;
        }
      }

      this.isEnabled = true;
      logger.info("AI Agent Manager initialized successfully");
      return true;
    } catch (error) {
      logger.error("Failed to initialize AI Agent Manager:", error);
      return false;
    }
  }

  /**
   * Create an AI agent for an NPC seat
   */
  async createAgent(
    gameId: GameId,
    seatId: SeatId,
    character: Character,
    seatName: string,
    npcProfile?: NPCProfile,
  ): Promise<boolean> {
    if (!this.isEnabled) {
      logger.warn("AI Agent Manager not enabled, cannot create agent");
      return false;
    }

    try {
      const agentKey = `${gameId}-${seatId}`;

      if (this.agents.has(agentKey)) {
        logger.warn(`Agent already exists for ${agentKey}`);
        return false;
      }

      const agent = new NPCAIAgent(
        gameId,
        seatId,
        character,
        seatName,
        this.gameEngine,
        this.ollamaClient,
        npcProfile,
      );

      this.agents.set(agentKey, agent);
      logger.info(
        `Created AI agent for ${seatName} as ${character.name} in game ${gameId}`,
        { profile: npcProfile?.name ?? "default" },
      );
      return true;
    } catch (error) {
      logger.error(`Failed to create AI agent for ${seatName}:`, error);
      return false;
    }
  }

  /**
   * Remove an AI agent
   */
  removeAgent(gameId: GameId, seatId: SeatId): boolean {
    const agentKey = `${gameId}-${seatId}`;
    const removed = this.agents.delete(agentKey);

    if (removed) {
      logger.info(`Removed AI agent for seat ${seatId} in game ${gameId}`);
    }

    return removed;
  }

  /**
   * Remove all agents for a game
   */
  removeGameAgents(gameId: GameId): number {
    let removed = 0;

    for (const [key] of this.agents) {
      if (key.startsWith(`${gameId}-`)) {
        this.agents.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`Removed ${removed} AI agents for game ${gameId}`);
    }

    return removed;
  }

  /**
   * Process a game event for all relevant agents
   */
  async processGameEvent(
    gameId: GameId,
    eventType: string,
    gameState: GameState,
  ): Promise<void> {
    if (!this.isEnabled) return;

    const gameAgents = this.getGameAgents(gameId);
    if (gameAgents.length === 0) return;

    logger.debug(
      `Processing ${eventType} event for ${gameAgents.length} agents in game ${gameId}`,
    );

    // Process agents sequentially to avoid overwhelming the LLM
    for (const agent of gameAgents) {
      try {
        const decision = await agent.onGameEvent(gameState, eventType);
        if (decision) {
          await this.executeAIDecision(gameId, agent, decision);
        }
      } catch (error) {
        logger.error(`Error processing event for AI agent:`, error);
      }
    }
  }

  /**
   * Handle voting for AI agents
   */
  async processVotingPhase(
    gameId: GameId,
    nominee: string,
    nominationReason: string,
    gameState: GameState,
  ): Promise<void> {
    if (!this.isEnabled) return;

    const gameAgents = this.getGameAgents(gameId);

    for (const agent of gameAgents) {
      try {
        const decision = await agent.makeVotingDecision(
          gameState,
          nominee,
          nominationReason,
        );
        if (decision) {
          await this.executeAIDecision(gameId, agent, decision);
        }
      } catch (error) {
        logger.error(`Error in voting decision for AI agent:`, error);
      }
    }
  }

  /**
   * Execute an AI decision through the game engine
   */
  private async executeAIDecision(
    gameId: GameId,
    agent: NPCAIAgent,
    decision: AIDecision,
  ): Promise<void> {
    const seatId = (agent as any).seatId; // Access private property

    try {
      switch (decision.action) {
        case "speak":
          if (decision.message) {
            await this.sendChatMessage(gameId, seatId, decision.message);
          }
          break;

        case "nominate":
          if (decision.target) {
            // TODO: Implement nomination through game engine
            logger.info(
              `AI Agent nomination: ${seatId} nominates ${decision.target} - ${decision.reasoning}`,
            );
            await this.sendChatMessage(
              gameId,
              seatId,
              decision.message || `I nominate ${decision.target}`,
            );
          }
          break;

        case "vote":
          // TODO: Implement voting through game engine
          logger.info(
            `AI Agent vote: ${seatId} votes on ${decision.target} - ${decision.reasoning}`,
          );
          if (decision.message) {
            await this.sendChatMessage(gameId, seatId, decision.message);
          }
          break;

        case "night_action":
          if (decision.target) {
            // TODO: Implement night action through game engine
            logger.info(
              `AI Agent night action: ${seatId} targets ${decision.target} - ${decision.reasoning}`,
            );
          }
          break;

        case "pass":
          // No action needed, just logging
          logger.debug(`AI Agent pass: ${seatId} - ${decision.reasoning}`);
          break;
      }
    } catch (error) {
      logger.error(`Failed to execute AI decision:`, error);
    }
  }

  /**
   * Send a chat message from an AI agent
   */
  private async sendChatMessage(
    gameId: GameId,
    seatId: SeatId,
    message: string,
  ): Promise<void> {
    // TODO: Integrate with your WebSocket/chat system
    // For now, just log the message
    logger.info(`[AI Chat] Game ${gameId}, Seat ${seatId}: ${message}`);

    // You would integrate this with your existing chat system
    // Example: this.webSocketHandler.broadcastToGame(gameId, {
    //   type: 'chat_message',
    //   seatId,
    //   message,
    //   timestamp: new Date()
    // });
  }

  /**
   * Get all agents for a specific game
   */
  private getGameAgents(gameId: GameId): NPCAIAgent[] {
    const agents: NPCAIAgent[] = [];

    for (const [key, agent] of this.agents) {
      if (key.startsWith(`${gameId}-`)) {
        agents.push(agent);
      }
    }

    return agents;
  }

  /**
   * Get statistics about active agents
   */
  getStats(): {
    totalAgents: number;
    gameCount: number;
    enabled: boolean;
  } {
    const games = new Set();

    for (const key of this.agents.keys()) {
      const gameId = key.split("-")[0];
      games.add(gameId);
    }

    return {
      totalAgents: this.agents.size,
      gameCount: games.size,
      enabled: this.isEnabled,
    };
  }

  /**
   * Check if AI system is ready
   */
  isReady(): boolean {
    return this.isEnabled;
  }

  /**
   * Shutdown the AI system
   */
  shutdown(): void {
    this.agents.clear();
    this.isEnabled = false;
    logger.info("AI Agent Manager shut down");
  }
}
