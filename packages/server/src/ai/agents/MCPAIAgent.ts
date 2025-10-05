import { Character } from "@ashes-of-salem/shared";
import { MCPClient } from "../mcp/MCPClient.js";

export interface AIDecision {
  action: "speak" | "nominate" | "vote" | "night_action" | "pass";
  target?: string;
  message?: string;
  reasoning?: string;
  confidence?: number;
}

/**
 * Pure MCP-based stateless AI Agent - no fallback modes
 * Requires MCP server to function - throws errors if unavailable
 */
export class MCPAIAgent {
  private mcpClient: MCPClient;
  private lastDecisionTime: Date = new Date();

  constructor(
    private gameId: string,
    private seatId: string,
    private character: Character,
    private seatName: string,
    private npcProfileId: string = "analytical-skeptic",
    mcpServerPath?: string,
  ) {
    this.mcpClient = new MCPClient(mcpServerPath);
  }

  /**
   * Initialize the agent - MCP connection required
   */
  async initialize(): Promise<void> {
    const success = await this.mcpClient.initialize();
    if (!success) {
      throw new Error(
        `Failed to initialize MCP client for ${this.seatName} - MCP server required`,
      );
    }

    console.log(`MCP AI agent initialized for ${this.seatName}`);
  }

  /**
   * Process a game event and make a decision
   */
  async processGameEvent(eventType: string): Promise<AIDecision | null> {
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
  }

  /**
   * Get comprehensive game context from MCP server
   */
  private async getGameContext() {
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
  }

  /**
   * Get personality profile from MCP server
   */
  private async getPersonalityProfile() {
    const response = await this.mcpClient.getNPCProfile(this.npcProfileId);
    return response.result;
  }

  /**
   * Get journal context for decision making
   */
  private async getJournalContext() {
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
    // Build decision based on game phase
    switch (gameContext.gameState?.phase) {
      case "day":
        return this.makeDayDecision(gameContext, profile, journalContext);
      case "voting":
        return this.makeVotingDecision(gameContext, profile, journalContext);
      case "night":
        return this.makeNightDecision(gameContext, profile, journalContext);
      default:
        return {
          action: "pass",
          reasoning: `Unknown phase: ${gameContext.gameState?.phase}`,
          confidence: 0,
        };
    }
  }

  /**
   * Make decision during day phase
   */
  private makeDayDecision(
    gameContext: any,
    profile: any,
    journalContext: any,
  ): AIDecision {
    // Check if we should claim character
    const hasClaimedCharacter =
      gameContext.gameState?.publicClaims?.[this.seatName];

    if (!hasClaimedCharacter && profile.personality.vocalness > 0.6) {
      return {
        action: "speak",
        message: `I am the ${this.character.name}`,
        reasoning:
          "High vocalness personality trait indicates I should claim my character",
        confidence: profile.personality.vocalness,
      };
    }

    // Check if we should accuse someone
    const suspiciousPlayers = this.findSuspiciousPlayers(
      journalContext.suspicionNetwork,
    );

    if (
      suspiciousPlayers.length > 0 &&
      profile.personality.aggressiveness > 0.7
    ) {
      const target = suspiciousPlayers[0];
      return {
        action: "speak",
        message: `I suspect ${target.playerId} might be evil`,
        target: target.playerId,
        reasoning: `High aggressiveness and suspicion level ${target.suspicion} toward ${target.playerId}`,
        confidence: profile.personality.aggressiveness * target.suspicion,
      };
    }

    return {
      action: "pass",
      reasoning: "Gathering more information before making a move",
      confidence: 0.5,
    };
  }

  /**
   * Make voting decision
   */
  private makeVotingDecision(
    gameContext: any,
    profile: any,
    journalContext: any,
  ): AIDecision {
    const currentNomination = gameContext.gameState?.currentNomination;

    if (!currentNomination) {
      return {
        action: "pass",
        reasoning: "No active nomination",
        confidence: 1.0,
      };
    }

    // Analyze suspicion toward the nominated player
    const suspicionLevel =
      journalContext.suspicionNetwork[this.seatName]?.[
        currentNomination.target
      ] || 0;

    // Factor in personality traits
    const baseVoteChance = suspicionLevel;
    const personalityModifier =
      (profile.personality.aggressiveness +
        profile.personality.deductiveReasoning) /
      2;

    const voteChance = baseVoteChance * personalityModifier;

    if (voteChance > 0.6) {
      return {
        action: "vote",
        target: currentNomination.target,
        reasoning: `Suspicion level ${suspicionLevel}, personality modifier ${personalityModifier}`,
        confidence: voteChance,
      };
    } else {
      return {
        action: "pass",
        reasoning: `Insufficient suspicion (${suspicionLevel}) or personality doesn't favor voting`,
        confidence: 1 - voteChance,
      };
    }
  }

  /**
   * Make night action decision
   */
  private async makeNightDecision(
    gameContext: any,
    profile: any,
    journalContext: any,
  ): Promise<AIDecision> {
    // Get character information to determine available night actions
    const characterInfo = await this.mcpClient.call("tools/call", {
      name: "get_character_info",
      arguments: { characterId: this.character.id },
    });

    if (!characterInfo?.result?.nightAction) {
      return {
        action: "pass",
        reasoning: "No night action available",
        confidence: 1.0,
      };
    }

    // Choose night action target based on suspicion network
    const alivePlayers = Object.keys(journalContext.suspicionNetwork).filter(
      (player) =>
        !gameContext.gameState?.deadPlayers?.includes(player) &&
        player !== this.seatName,
    );

    if (alivePlayers.length === 0) {
      return {
        action: "pass",
        reasoning: "No valid targets available",
        confidence: 1.0,
      };
    }

    // Choose target based on personality and game state
    const target = this.selectNightTarget(
      alivePlayers,
      profile,
      journalContext,
    );

    return {
      action: "night_action",
      target: target,
      reasoning: `Selected ${target} based on current suspicions and personality traits`,
      confidence: 0.7,
    };
  }

  /**
   * Helper: Find most suspicious players
   */
  private findSuspiciousPlayers(
    suspicionNetwork: any,
  ): Array<{ playerId: string; suspicion: number }> {
    const myNetwork = suspicionNetwork[this.seatName] || {};

    return Object.entries(myNetwork)
      .map(([playerId, suspicion]) => ({
        playerId,
        suspicion: suspicion as number,
      }))
      .filter((entry) => entry.suspicion > 0.5)
      .sort((a, b) => b.suspicion - a.suspicion);
  }

  /**
   * Helper: Select night action target
   */
  private selectNightTarget(
    alivePlayers: string[],
    profile: any,
    context: any,
  ): string {
    // For low-trust personalities, target highly suspicious players
    if (profile.personality.trustingness < 0.3) {
      const suspicious = this.findSuspiciousPlayers(context.suspicionNetwork);
      if (suspicious.length > 0) {
        return suspicious[0].playerId;
      }
    }

    // For analytical personalities, target information-gathering opportunities
    if (profile.personality.deductiveReasoning > 0.7) {
      // Target players who haven't been analyzed much
      const lessAnalyzedPlayers = alivePlayers.filter(
        (player) =>
          (context.decisionHistory || []).filter((d: any) =>
            d.content.includes(player),
          ).length < 2,
      );
      if (lessAnalyzedPlayers.length > 0) {
        return lessAnalyzedPlayers[0];
      }
    }

    // Default: select player with highest suspicion
    const suspicious = this.findSuspiciousPlayers(context.suspicionNetwork);
    return suspicious.length > 0 ? suspicious[0].playerId : alivePlayers[0];
  }

  /**
   * Log decision to MCP server journal
   */
  private async logDecision(decision: AIDecision): Promise<void> {
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

    this.lastDecisionTime = new Date();
  }

  /**
   * Update behavior based on game events
   */
  async updateBehavior(event: any): Promise<void> {
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
          profileId: this.npcProfileId,
          updates: {
            suspicionToward: {
              [event.voter]: 0.2,
            },
          },
        },
      });
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.mcpClient.close();
  }
}
