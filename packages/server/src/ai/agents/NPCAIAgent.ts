import type {
  NPCBehaviorSettings,
  NPCPersonalityTrait,
  NPCProfile,
} from "@ashes-of-salem/shared";
import {
  Character,
  GameId,
  GamePhase,
  GameState,
  SeatId,
} from "@ashes-of-salem/shared";
import { GameEngine } from "../../game/engine";
import { logger } from "../../utils/logger";
import { OllamaClient, OllamaMessage } from "../llm/OllamaClient";
import { GameContext, PromptTemplates } from "../llm/PromptTemplates";

export interface AIDecision {
  action: "speak" | "nominate" | "vote" | "night_action" | "pass";
  target?: string;
  message?: string;
  reasoning?: string;
}

export class NPCAIAgent {
  private gameId: GameId;
  private seatId: SeatId;
  private character: Character;
  private seatName: string;
  private gameEngine: GameEngine;
  private ollamaClient: OllamaClient;
  private conversationHistory: OllamaMessage[] = [];
  private lastDecisionTime: Date = new Date();

  // AI personality and behavior settings
  private npcProfile: NPCProfile | null = null;
  private personality: NPCPersonalityTrait;
  private behavior: NPCBehaviorSettings;

  constructor(
    gameId: GameId,
    seatId: SeatId,
    character: Character,
    seatName: string,
    gameEngine: GameEngine,
    ollamaClient?: OllamaClient,
    npcProfile?: NPCProfile,
  ) {
    this.gameId = gameId;
    this.seatId = seatId;
    this.character = character;
    this.seatName = seatName;
    this.gameEngine = gameEngine;
    this.ollamaClient = ollamaClient || new OllamaClient();
    this.npcProfile = npcProfile || null;

    // Initialize personality and behavior from profile or defaults
    if (npcProfile) {
      this.personality = npcProfile.personality;
      this.behavior = npcProfile.behavior;
    } else {
      // Generate default personality traits
      this.personality = {
        chattiness: this.generatePersonalityTrait("chattiness"),
        suspicion: this.generatePersonalityTrait("suspicion"),
        boldness: this.generatePersonalityTrait("boldness"),
        helpfulness: this.generatePersonalityTrait("helpfulness"),
        deception: this.generatePersonalityTrait("deception"),
        leadership: this.generatePersonalityTrait("leadership"),
        followership: this.generatePersonalityTrait("followership"),
        independence: this.generatePersonalityTrait("independence"),
        claimTiming: this.generatePersonalityTrait("claimTiming"),
        voteConfidence: this.generatePersonalityTrait("voteConfidence"),
        informationSharing: this.generatePersonalityTrait("informationSharing"),
      };
      this.behavior = {
        averageWordsPerMessage: 25,
        messagesPerPhase: 3,
        useEmojis: true,
        formalLanguage: false,
        decisionSpeed: "deliberate",
        changesMind: true,
        explainReasoning: true,
        preferredVotingStyle: "analytical",
        nominationTendency: "normal",
        claimStrategy: "pressured",
      };
    }

    // Initialize conversation with system prompt
    this.conversationHistory = [
      PromptTemplates.getSystemPrompt(character, seatName),
    ];

    logger.info(
      `Created AI agent for ${seatName} as ${character.name} (chattiness: ${this.personality.chattiness.toFixed(2)}, suspicion: ${this.personality.suspicion.toFixed(2)}, boldness: ${this.personality.boldness.toFixed(2)})`,
    );
  }

  /**
   * Main decision-making method called on game events
   */
  async onGameEvent(
    gameState: GameState,
    eventType: string,
  ): Promise<AIDecision | null> {
    try {
      const maskedGame = this.getMaskedGameState(gameState);

      switch (eventType) {
        case "phase_changed":
          return await this.onPhaseChange(maskedGame);
        case "player_spoke":
          return await this.onPlayerMessage(maskedGame);
        case "nomination_made":
          return await this.onPlayerMessage(maskedGame);
        case "day_started":
          return await this.considerDayAction(maskedGame);
        default:
          return null;
      }
    } catch (error) {
      logger.error(`AI agent ${this.seatName} decision error:`, error);
      return null;
    }
  }

  /**
   * Handle phase changes
   */
  private async onPhaseChange(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    switch (gameState.phase) {
      case GamePhase.DAY:
        return await this.considerDayDiscussion(gameState);
      case GamePhase.NOMINATION:
        return await this.considerNomination(gameState);
      case GamePhase.NIGHT:
        return await this.considerNightAction(gameState);
      default:
        return null;
    }
  }

  /**
   * Consider participating in day discussion
   */
  private async considerDayDiscussion(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    // Don't speak immediately, wait a bit for natural pacing
    const timeSinceLastDecision = Date.now() - this.lastDecisionTime.getTime();
    if (timeSinceLastDecision < 10000) return null; // Wait at least 10 seconds

    // Random chance to speak based on chattiness
    if (Math.random() > this.personality.chattiness) return null;

    const gameContext = this.buildGameContext(gameState);
    const recentMessages = this.getRecentMessages(gameState);

    const prompt = PromptTemplates.getDayDiscussionPrompt(
      this.character,
      gameContext,
      recentMessages,
    );

    const response = await this.getLLMResponse([prompt]);

    if (response && response.trim().length > 0) {
      this.lastDecisionTime = new Date();
      return {
        action: "speak",
        message: response,
        reasoning: "Day discussion participation",
      };
    }

    return null;
  }

  /**
   * Consider making a nomination
   */
  private async considerNomination(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    const availableTargets = this.getAlivePlayersExceptSelf(gameState);
    if (availableTargets.length === 0) return null;

    const gameContext = this.buildGameContext(gameState);
    const prompt = PromptTemplates.getNominationPrompt(
      this.character,
      gameContext,
      availableTargets,
    );

    const response = await this.getLLMResponse([prompt]);

    if (response?.startsWith("NOMINATE:")) {
      const match = response.match(/NOMINATE:\s*([^-]+)\s*-\s*(.+)/);
      if (match) {
        const target = match[1].trim();
        const reasoning = match[2].trim();

        if (availableTargets.includes(target)) {
          this.lastDecisionTime = new Date();
          return {
            action: "nominate",
            target,
            reasoning,
            message: `I nominate ${target}. ${reasoning}`,
          };
        }
      }
    }

    return { action: "pass", reasoning: "Decided not to nominate anyone" };
  }

  /**
   * Consider night action if character has night ability
   */
  private async considerNightAction(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    // Check if character has night ability
    if (!this.character.otherNights && !this.character.firstNight) return null;

    const availableTargets = this.getAlivePlayersExceptSelf(gameState);
    if (availableTargets.length === 0) return null;

    const gameContext = this.buildGameContext(gameState);
    const prompt = PromptTemplates.getNightActionPrompt(
      this.character,
      gameContext,
      availableTargets,
    );

    const response = await this.getLLMResponse([prompt]);

    if (response?.startsWith("TARGET:")) {
      const match = response.match(/TARGET:\s*([^-]+)\s*-\s*(.+)/);
      if (match) {
        const target = match[1].trim();
        const reasoning = match[2].trim();

        this.lastDecisionTime = new Date();
        return {
          action: "night_action",
          target,
          reasoning,
        };
      }
    }

    return null;
  }

  /**
   * React to other players' messages
   */
  private async onPlayerMessage(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    // Lower chance to respond to every message to avoid spam
    if (Math.random() > this.personality.chattiness * 0.3) return null;

    const gameContext = this.buildGameContext(gameState);
    const recentMessages = this.getRecentMessages(gameState);

    if (recentMessages.length === 0) return null;

    // Only respond if message seems relevant or suspicious
    const lastMessage = recentMessages[recentMessages.length - 1];
    if (this.shouldRespondToMessage(lastMessage)) {
      return await this.considerDayDiscussion(gameState);
    }

    return null;
  }

  /**
   * Make voting decision
   */
  async makeVotingDecision(
    gameState: GameState,
    nominee: string,
    nominationReason: string,
  ): Promise<AIDecision> {
    const gameContext = this.buildGameContext(gameState);
    const prompt = PromptTemplates.getVotingPrompt(
      this.character,
      nominee,
      nominationReason,
      gameContext,
    );

    const response = await this.getLLMResponse([prompt]);

    if (response?.includes("VOTE: EXECUTE")) {
      const reasoning =
        response.split("-")[1]?.trim() || "Supporting execution";
      return {
        action: "vote",
        target: nominee,
        message: `I vote to execute. ${reasoning}`,
        reasoning,
      };
    } else {
      const reasoning = response?.split("-")[1]?.trim() || "Not convinced";
      return {
        action: "vote",
        target: nominee,
        message: `I vote to pardon. ${reasoning}`,
        reasoning,
      };
    }
  }

  private async considerDayAction(
    gameState: GameState,
  ): Promise<AIDecision | null> {
    // Periodically consider speaking during day phase
    return await this.considerDayDiscussion(gameState);
  }

  /**
   * Get LLM response and update conversation history
   */
  private async getLLMResponse(
    newMessages: OllamaMessage[],
  ): Promise<string | null> {
    try {
      const fullConversation = [...this.conversationHistory, ...newMessages];
      const response = await this.ollamaClient.chat(fullConversation, {
        temperature: 0.8, // Slightly creative but not too random
        max_tokens: 200, // Keep responses concise
      });

      // Add to conversation history (keep last 20 messages to avoid context explosion)
      this.conversationHistory.push(...newMessages);
      this.conversationHistory.push({ role: "assistant", content: response });

      if (this.conversationHistory.length > 20) {
        // Keep system prompt + recent messages
        this.conversationHistory = [
          this.conversationHistory[0], // System prompt
          ...this.conversationHistory.slice(-19),
        ];
      }

      return response;
    } catch (error) {
      logger.error(`LLM response error for ${this.seatName}:`, error);
      return null;
    }
  }

  /**
   * Build game context for prompts
   */
  private buildGameContext(gameState: GameState): GameContext {
    const aliveSeats = gameState.seats.filter((s) => s.isAlive);
    const deadSeats = gameState.seats.filter((s) => !s.isAlive);

    return {
      phase: gameState.phase,
      day: gameState.day || 1,
      playerCount: gameState.seats.length,
      aliveCount: aliveSeats.length,
      deadPlayers: deadSeats.map((s) => s.playerId || `Seat ${s.position}`),
      recentEvents: [], // TODO: Extract from game events
      publicClaims: {}, // TODO: Track player claims
      votingHistory: [], // TODO: Extract from voting history
    };
  }

  private getMaskedGameState(gameState: GameState): GameState {
    // Use existing masking system
    return gameState; // For now, assuming we get already masked state
  }

  private getAlivePlayersExceptSelf(gameState: GameState): string[] {
    return gameState.seats
      .filter((s) => s.isAlive && s.id !== this.seatId)
      .map((s) => s.playerId || `Seat ${s.position}`);
  }

  private getRecentMessages(_gameState: GameState): string[] {
    // TODO: Extract recent chat messages from game state/events
    return [];
  }

  private shouldRespondToMessage(message: string): boolean {
    // Check if message mentions this player or contains suspicious claims
    const mentionsMe = message
      .toLowerCase()
      .includes(this.seatName.toLowerCase());
    const containsSuspiciousClaims =
      /claim|role|ability|evil|good|minion|demon|townsfolk/i.test(message);

    return (
      mentionsMe ||
      (containsSuspiciousClaims && Math.random() < this.personality.suspicion)
    );
  }

  private generatePersonalityTrait(trait: string): number {
    const base = 0.5;
    const characterModifiers: Record<string, Record<string, number>> = {
      chattiness: {
        empath: 0.2, // More talkative
        washerwoman: 0.1, // Slightly more talkative
        recluse: -0.3, // Less talkative
        drunk: 0.1, // More talkative when confused
      },
      suspicion: {
        investigator: 0.2, // More suspicious
        paranoid: 0.3, // Very suspicious
        drunk: -0.1, // Less suspicious (confused)
        saint: 0.1, // Cautious
      },
      boldness: {
        demon: 0.2, // Bold to avoid suspicion
        minion: 0.1, // Somewhat bold
        saint: -0.2, // Very cautious
        recluse: -0.1, // Somewhat cautious
      },
    };

    let modifier = 0;
    if (characterModifiers[trait]?.[this.character.id]) {
      modifier = characterModifiers[trait][this.character.id];
    } else if (characterModifiers[trait]?.[this.character.team]) {
      modifier = characterModifiers[trait][this.character.team];
    }

    // Add some randomness
    const randomFactor = (Math.random() - 0.5) * 0.3;

    return Math.max(0.1, Math.min(0.9, base + modifier + randomFactor));
  }
}
