import { Character } from "@ashes-of-salem/shared";
import { GameEngine } from "../../../game/GameEngine.js";
import { GameId, SeatId } from "../../../types/game.js";
import logger from "../../../utils/logger.js";
import { OllamaClient } from "../llm/OllamaClient.js";
import { PromptTemplates } from "../llm/PromptTemplates.js";
import { MCPClient } from "../mcp/MCPClient.js";
import { NPCProfile } from "../profiles/EnhancedNPCProfile.js";

export interface AIDecision {
  action: "speak" | "nominate" | "vote" | "night_action" | "pass";
  target?: string;
  message?: string;
  reasoning?: string;
  confidence?: number;
}

/**
 * Enhanced NPC AI Agent with MCP integration for stateless operation
 */
export class EnhancedNPCAIAgent {
  private mcpClient: MCPClient;
  private lastDecisionTime: Date = new Date();

  constructor(
    private gameId: GameId,
    private seatId: SeatId,
    private character: Character,
    private seatName: string,
    private gameEngine: GameEngine,
    private ollamaClient: OllamaClient,
    private npcProfile?: NPCProfile,
    mcpServerPath?: string,
  ) {
    this.mcpClient = new MCPClient(mcpServerPath);
  }

  /**
   * Initialize the agent and its MCP connection
   */
  async initialize(): Promise<boolean> {
    try {
      const mcpInitialized = await this.mcpClient.initialize();
      if (!mcpInitialized) {
        logger.warn(
          `Failed to initialize MCP client for ${this.seatName}, falling back to stateful mode`,
        );
        return false;
      }

      // Store initial NPC profile in MCP server if provided
      if (this.npcProfile) {
        await this.mcpClient.call("tools/call", {
          name: "update_npc_behavior",
          arguments: {
            profileId: this.npcProfile.id,
            updates: this.npcProfile,
          },
        });
      }

      logger.info(
        `Enhanced AI agent initialized for ${this.seatName} with MCP integration`,
      );
      return true;
    } catch (error) {
      logger.error(
        `Failed to initialize enhanced AI agent for ${this.seatName}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Process a game event and potentially make a decision
   */
  async processGameEvent(
    eventType: string,
    gameState: any,
  ): Promise<AIDecision | null> {
    try {
      // Get comprehensive context from MCP server
      const context = await this.getGameContext();

      // Get personality profile
      const profile = await this.getPersonalityProfile();

      // Analyze recent history
      const journalContext = await this.getJournalContext();

      // Make decision based on event type and game phase
      const decision = await this.makeDecision(
        eventType,
        context,
        profile,
        journalContext,
      );

      // Log the decision
      if (decision) {
        await this.logDecision(decision);
      }

      return decision;
    } catch (error) {
      logger.error(`Error processing game event for ${this.seatName}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive game context from MCP server
   */
  private async getGameContext() {
    try {
      const [gameState, playerInfo, votingHistory] = await Promise.all([
        this.mcpClient.getGameState(this.gameId),
        this.mcpClient.getPlayerInfo(this.gameId, this.seatName),
        this.mcpClient.call("tools/call", {
          name: "get_voting_history",
          arguments: { gameId: this.gameId },
        }),
      ]);

      return {
        gameState: gameState.result,
        playerInfo: playerInfo.result,
        votingHistory: votingHistory.result,
      };
    } catch (error) {
      logger.error(`Failed to get game context from MCP server:`, error);
      throw error;
    }
  }

  /**
   * Get personality profile from MCP server
   */
  private async getPersonalityProfile() {
    try {
      if (this.npcProfile?.id) {
        const response = await this.mcpClient.getNPCProfile(this.npcProfile.id);
        return response.result;
      }

      // Fall back to default profile
      const response = await this.mcpClient.call("tools/call", {
        name: "list_npc_profiles",
        arguments: {},
      });

      const profiles = response.result.profiles;
      return profiles.length > 0 ? profiles[0] : null;
    } catch (error) {
      logger.error(`Failed to get personality profile:`, error);
      return null;
    }
  }

  /**
   * Get journal context for decision making
   */
  private async getJournalContext() {
    try {
      const [journalEntries, suspicionNetwork, decisionHistory] =
        await Promise.all([
          this.mcpClient.getJournalEntries(this.gameId, this.seatName),
          this.mcpClient.getSuspicionNetwork(this.gameId),
          this.mcpClient.call("tools/call", {
            name: "get_decision_history",
            arguments: { gameId: this.gameId, playerId: this.seatName },
          }),
        ]);

      return {
        journalEntries: journalEntries.result,
        suspicionNetwork: suspicionNetwork.result,
        decisionHistory: decisionHistory.result,
      };
    } catch (error) {
      logger.error(`Failed to get journal context:`, error);
      return { journalEntries: [], suspicionNetwork: {}, decisionHistory: [] };
    }
  }

  /**
   * Make decision based on all available context
   */
  private async makeDecision(
    eventType: string,
    gameContext: any,
    profile: any,
    journalContext: any,
  ): Promise<AIDecision | null> {
    try {
      // Build LLM prompt with MCP-sourced context
      const prompt = this.buildContextualPrompt(
        eventType,
        gameContext,
        profile,
        journalContext,
      );

      // Get LLM response
      const response = await this.ollamaClient.chat([prompt], {
        temperature: profile?.personality?.creativity || 0.8,
        max_tokens: 300,
      });

      // Parse and validate decision
      const decision = this.parseDecisionFromResponse(response);

      if (decision) {
        decision.confidence = this.calculateConfidence(
          decision,
          profile,
          gameContext,
        );
        this.lastDecisionTime = new Date();
      }

      return decision;
    } catch (error) {
      logger.error(`Failed to make decision:`, error);
      return null;
    }
  }

  /**
   * Build contextual prompt using MCP data
   */
  private buildContextualPrompt(
    eventType: string,
    gameContext: any,
    profile: any,
    journalContext: any,
  ): string {
    const basePrompt = PromptTemplates.getSystemPrompt(
      this.character,
      this.seatName,
    );

    const contextualInfo = `
CURRENT GAME STATE:
- Phase: ${gameContext.gameState?.phase || "unknown"}
- Day: ${gameContext.gameState?.day || 1}
- Alive Players: ${gameContext.gameState?.aliveCount || "unknown"}
- Recent Events: ${gameContext.gameState?.recentEvents?.join(", ") || "none"}

MY PLAYER INFO:
- Status: ${gameContext.playerInfo?.status || "alive"}
- Public Claims: ${JSON.stringify(gameContext.gameState?.publicClaims || {})}
- Suspicion Level: ${gameContext.playerInfo?.suspicionLevel || 0}

PERSONALITY PROFILE:
- Aggressiveness: ${profile?.personality?.aggressiveness || 0.5}
- Trustingness: ${profile?.personality?.trustingness || 0.5}
- Vocalness: ${profile?.personality?.vocalness || 0.5}
- Deductive Reasoning: ${profile?.personality?.deductiveReasoning || 0.5}

RECENT DECISIONS:
${
  journalContext.decisionHistory
    ?.slice(-3)
    .map((d: any) => `- ${d.content}`)
    .join("\n") || "No recent decisions"
}

SUSPICION NETWORK:
${
  Object.entries(journalContext.suspicionNetwork)
    .map(
      ([player, suspicions]: [string, any]) =>
        `${player}: ${Object.entries(suspicions)
          .map(([target, level]) => `${target}(${level})`)
          .join(", ")}`,
    )
    .join("\n") || "No suspicions recorded"
}

EVENT: ${eventType}

Based on this context and your character's personality, what action do you take?
Respond with ACTION: [speak/nominate/vote/night_action/pass] followed by any target and reasoning.
`;

    return basePrompt + "\n\n" + contextualInfo;
  }

  /**
   * Parse decision from LLM response
   */
  private parseDecisionFromResponse(response: string): AIDecision | null {
    try {
      const lines = response.split("\n");
      const actionLine = lines.find((line) => line.startsWith("ACTION:"));

      if (!actionLine) return null;

      const actionMatch = actionLine.match(
        /ACTION:\s*(speak|nominate|vote|night_action|pass)/i,
      );
      if (!actionMatch) return null;

      const action = actionMatch[1].toLowerCase() as AIDecision["action"];

      // Extract target if mentioned
      const targetMatch =
        response.match(/TARGET:\s*([^\n]+)/i) ||
        response.match(/targeting?\s+([^\s,]+)/i);
      const target = targetMatch?.[1]?.trim();

      // Extract reasoning
      const reasoningMatch =
        response.match(/REASONING:\s*([^\n]+)/i) ||
        response.match(/because\s+([^\n]+)/i);
      const reasoning = reasoningMatch?.[1]?.trim();

      // Extract message for speak actions
      const messageMatch =
        response.match(/MESSAGE:\s*([^\n]+)/i) ||
        response.match(/SAY:\s*([^\n]+)/i);
      const message = messageMatch?.[1]?.trim();

      return {
        action,
        target,
        reasoning,
        message,
      };
    } catch (error) {
      logger.error("Failed to parse decision from response:", error);
      return null;
    }
  }

  /**
   * Calculate confidence score for decision
   */
  private calculateConfidence(
    decision: AIDecision,
    profile: any,
    gameContext: any,
  ): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on personality traits
    if (profile?.personality) {
      const p = profile.personality;

      switch (decision.action) {
        case "nominate":
          confidence += p.aggressiveness * 0.3;
          confidence += p.deductiveReasoning * 0.2;
          break;
        case "vote":
          confidence += p.deductiveReasoning * 0.3;
          confidence += (1 - p.trustingness) * 0.2;
          break;
        case "speak":
          confidence += p.vocalness * 0.3;
          break;
      }
    }

    // Adjust based on game context
    if (
      gameContext.gameState?.phase === "voting" &&
      decision.action === "vote"
    ) {
      confidence += 0.2; // More confident during voting phase
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Log decision to MCP server journal
   */
  private async logDecision(decision: AIDecision): Promise<void> {
    try {
      const content = `Action: ${decision.action}${decision.target ? ` targeting ${decision.target}` : ""}. ${decision.reasoning || "No reasoning provided"}`;

      await this.mcpClient.addJournalEntry(
        this.gameId,
        this.seatName,
        "decision",
        content,
        {
          action: decision.action,
          target: decision.target,
          confidence: decision.confidence,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      logger.error("Failed to log decision to MCP server:", error);
    }
  }

  /**
   * Update behavior based on game events
   */
  async updateBehavior(event: any): Promise<void> {
    try {
      // Log observation
      await this.mcpClient.addJournalEntry(
        this.gameId,
        this.seatName,
        "observation",
        `Observed event: ${event.type}`,
        event,
      );

      // Update suspicion levels if relevant
      if (event.type === "vote" && event.target === this.seatName) {
        // Someone voted against us - increase suspicion
        await this.mcpClient.call("tools/call", {
          name: "update_npc_behavior",
          arguments: {
            profileId: this.npcProfile?.id || "default",
            updates: {
              suspicionToward: {
                [event.voter]: 0.2,
              },
            },
          },
        });
      }
    } catch (error) {
      logger.error("Failed to update behavior:", error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.mcpClient.close();
    } catch (error) {
      logger.error("Error during cleanup:", error);
    }
  }
}
