/**
 * Example Stateless NPC Agent Integration
 *
 * This demonstrates how a stateless NPC agent would interact with the MCP server
 * to get game state, make decisions, and log reasoning.
 */

interface MCPClient {
  call(method: string, params: any): Promise<any>;
}

interface NPCDecision {
  action: string;
  target?: string;
  reasoning: string;
  confidence: number;
}

class StatelessNPCAgent {
  constructor(
    private mcpClient: MCPClient,
    private playerId: string,
    private profileId: string,
  ) {}

  /**
   * Main decision-making loop for the NPC agent
   */
  async makeDecision(gameId: string): Promise<NPCDecision> {
    // 1. Get current game context
    const gameContext = await this.getGameContext(gameId);

    // 2. Retrieve personality and behavior
    const profile = await this.getPersonalityProfile();

    // 3. Analyze recent history and patterns
    const context = await this.analyzeContext(gameId);

    // 4. Make decision based on game phase
    let decision: NPCDecision;

    switch (gameContext.gameState.phase) {
      case "day":
        decision = await this.makeDayDecision(
          gameContext.gameState,
          profile,
          context,
        );
        break;
      case "voting":
        decision = await this.makeVotingDecision(
          gameContext.gameState,
          profile,
          context,
        );
        break;
      case "night":
        decision = await this.makeNightDecision(
          gameContext.gameState,
          profile,
          context,
        );
        break;
      default:
        decision = {
          action: "wait",
          reasoning: "Unknown phase",
          confidence: 0,
        };
    }

    // 5. Log the decision for future reference
    await this.logDecision(gameId, decision);

    return decision;
  }

  /**
   * Get comprehensive game context from MCP server
   */
  private async getGameContext(gameId: string) {
    const [gameState, playerInfo, votingHistory] = await Promise.all([
      this.mcpClient.call("get_game_state", { gameId }),
      this.mcpClient.call("get_player_info", {
        gameId,
        playerId: this.playerId,
      }),
      this.mcpClient.call("get_voting_history", { gameId }),
    ]);

    return { gameState, playerInfo, votingHistory };
  }

  /**
   * Get NPC personality profile
   */
  private async getPersonalityProfile() {
    return await this.mcpClient.call("get_npc_profile", {
      profileId: this.profileId,
    });
  }

  /**
   * Analyze recent context and decision history
   */
  private async analyzeContext(gameId: string) {
    const [journalEntries, suspicionNetwork, decisionHistory] =
      await Promise.all([
        this.mcpClient.call("get_journal_entries", {
          gameId,
          playerId: this.playerId,
        }),
        this.mcpClient.call("get_suspicion_network", { gameId }),
        this.mcpClient.call("get_decision_history", {
          gameId,
          playerId: this.playerId,
        }),
      ]);

    return { journalEntries, suspicionNetwork, decisionHistory };
  }

  /**
   * Make decision during day phase
   */
  private async makeDayDecision(
    gameState: any,
    profile: any,
    context: any,
  ): Promise<NPCDecision> {
    // Example: Decide whether to make a public claim
    const hasClaimedCharacter = gameState.publicClaims[this.playerId];

    if (!hasClaimedCharacter && profile.personality.vocalness > 0.6) {
      return {
        action: "claim_character",
        reasoning:
          "High vocalness personality trait indicates I should claim my character",
        confidence: profile.personality.vocalness,
      };
    }

    // Example: Decide whether to accuse someone
    const suspiciousPlayers = this.findSuspiciousPlayers(
      context.suspicionNetwork,
    );

    if (
      suspiciousPlayers.length > 0 &&
      profile.personality.aggressiveness > 0.7
    ) {
      const target = suspiciousPlayers[0];
      return {
        action: "accuse",
        target: target.playerId,
        reasoning: `High aggressiveness and suspicion level ${target.suspicion} toward ${target.playerId}`,
        confidence: profile.personality.aggressiveness * target.suspicion,
      };
    }

    return {
      action: "observe",
      reasoning: "Gathering more information before making a move",
      confidence: 0.5,
    };
  }

  /**
   * Make voting decision
   */
  private async makeVotingDecision(
    gameState: any,
    profile: any,
    context: any,
  ): Promise<NPCDecision> {
    // Get information about current nomination
    const currentNomination = gameState.currentNomination;

    if (!currentNomination) {
      return {
        action: "wait",
        reasoning: "No active nomination",
        confidence: 1.0,
      };
    }

    // Analyze suspicion toward the nominated player
    const suspicionLevel =
      context.suspicionNetwork[this.playerId]?.[currentNomination.target] || 0;

    // Factor in personality traits
    const baseVoteChance = suspicionLevel;
    const personalityModifier =
      (profile.personality.aggressiveness +
        profile.personality.deductiveReasoning) /
      2;

    const voteChance = baseVoteChance * personalityModifier;

    if (voteChance > 0.6) {
      return {
        action: "vote_yes",
        target: currentNomination.target,
        reasoning: `Suspicion level ${suspicionLevel}, personality modifier ${personalityModifier}`,
        confidence: voteChance,
      };
    } else {
      return {
        action: "vote_no",
        target: currentNomination.target,
        reasoning: `Insufficient suspicion (${suspicionLevel}) or personality doesn't favor voting`,
        confidence: 1 - voteChance,
      };
    }
  }

  /**
   * Make night action decision
   */
  private async makeNightDecision(
    gameState: any,
    profile: any,
    context: any,
  ): Promise<NPCDecision> {
    // Get character information to determine available night actions
    const characterInfo = await this.mcpClient.call("get_character_info", {
      characterId: gameState.publicClaims[this.playerId] || "unknown",
    });

    if (!characterInfo?.nightAction) {
      return {
        action: "sleep",
        reasoning: "No night action available",
        confidence: 1.0,
      };
    }

    // Example: Choose night action target based on suspicion network
    const alivePlayers = Object.keys(context.suspicionNetwork).filter(
      (player) =>
        !gameState.deadPlayers.includes(player) && player !== this.playerId,
    );

    if (alivePlayers.length === 0) {
      return {
        action: "sleep",
        reasoning: "No valid targets available",
        confidence: 1.0,
      };
    }

    // Choose target based on personality and game state
    const target = this.selectNightTarget(alivePlayers, profile, context);

    return {
      action: characterInfo.nightAction,
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
    const myNetwork = suspicionNetwork[this.playerId] || {};

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
    // For high-trust personalities, target highly suspicious players
    if (profile.personality.trustingness < 0.3) {
      const suspicious = this.findSuspiciousPlayers(context.suspicionNetwork);
      if (suspicious.length > 0) {
        return suspicious[0].playerId;
      }
    }

    // For analytical personalities, target information-gathering opportunities
    if (profile.personality.deductiveReasoning > 0.7) {
      // Target players who haven't claimed characters yet
      const unclaimedPlayers = alivePlayers.filter(
        (player) => !context.gameState.publicClaims[player],
      );
      if (unclaimedPlayers.length > 0) {
        return unclaimedPlayers[0];
      }
    }

    // Default: random selection
    return alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
  }

  /**
   * Log decision for future analysis
   */
  private async logDecision(gameId: string, decision: NPCDecision) {
    await this.mcpClient.call("add_journal_entry", {
      gameId,
      playerId: this.playerId,
      type: "decision",
      content: `Action: ${decision.action}${decision.target ? ` targeting ${decision.target}` : ""}. Reasoning: ${decision.reasoning}`,
      metadata: {
        action: decision.action,
        target: decision.target,
        confidence: decision.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Update behavior based on game events
   */
  async updateBehavior(gameId: string, event: any) {
    // Example: Become more suspicious if someone voted against us
    if (event.type === "vote" && event.target === this.playerId) {
      await this.mcpClient.call("update_npc_behavior", {
        profileId: this.profileId,
        updates: {
          suspicionToward: {
            [event.voter]: 0.2, // Increase suspicion toward this player
          },
        },
      });

      // Log the observation
      await this.mcpClient.call("add_journal_entry", {
        gameId,
        playerId: this.playerId,
        type: "observation",
        content: `${event.voter} voted against me - increasing suspicion`,
        metadata: {
          eventType: "vote_against",
          source: event.voter,
          suspicionIncrease: 0.2,
        },
      });
    }
  }
}

// Example usage
export async function runNPCAgent(mcpClient: MCPClient) {
  const agent = new StatelessNPCAgent(
    mcpClient,
    "Alice", // This NPC's player ID
    "analytical-skeptic", // Personality profile to use
  );

  const gameId = "test-game-1";

  // Make a decision
  const decision = await agent.makeDecision(gameId);
  console.log("NPC Decision:", decision);

  // Simulate responding to a game event
  await agent.updateBehavior(gameId, {
    type: "vote",
    voter: "Bob",
    target: "Alice",
  });
}
