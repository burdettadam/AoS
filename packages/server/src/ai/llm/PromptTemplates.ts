import { Character, GamePhase } from "@ashes-of-salem/shared";
import { OllamaMessage } from "./OllamaClient";

export interface GameContext {
  phase: GamePhase;
  day: number;
  playerCount: number;
  aliveCount: number;
  deadPlayers: string[];
  recentEvents: string[];
  publicClaims: Record<string, string>;
  votingHistory: Array<{
    day: number;
    nominee: string;
    votes: number;
    executed: boolean;
  }>;
}

export class PromptTemplates {
  /**
   * Generate system prompt for a character
   */
  static getSystemPrompt(
    character: Character,
    seatName: string,
  ): OllamaMessage {
    const basePersonality = this.getCharacterPersonality(character);

    return {
      role: "system",
      content: `You are ${seatName}, playing as the ${character.name} in Blood on the Clock Tower.

CHARACTER INFO:
- Role: ${character.name} (${character.team})
- Ability: ${character.ability}

PERSONALITY: ${basePersonality}

IMPORTANT RULES:
1. You are playing a social deduction game. Be strategic and observant.
2. Stay in character - act according to your role and team alignment.
3. Keep responses concise and natural (1-3 sentences typical).
4. If you're Evil, you must win by eliminating Good players or reaching parity.
5. If you're Good, you must find and execute all Evil players.
6. Don't break character or reveal you're an AI.
7. Use deductive reasoning based on available information.
8. Be suspicious of contradictory claims and voting patterns.
9. Form alliances carefully and consider who to trust.
10. When making accusations, provide reasoning based on observations.

Remember: Only speak about information you should legitimately know based on your role and what has been publicly revealed.`,
    };
  }

  /**
   * Generate discussion prompt for day phase
   */
  static getDayDiscussionPrompt(
    character: Character,
    gameContext: GameContext,
    recentMessages: string[],
  ): OllamaMessage {
    const situationAnalysis = this.analyzeSituation(gameContext);
    const recentChat =
      recentMessages.length > 0
        ? `\n\nRecent conversation:\n${recentMessages.slice(-5).join("\n")}`
        : "";

    return {
      role: "user",
      content: `Current situation (Day ${gameContext.day}, ${gameContext.phase}):
${situationAnalysis}${recentChat}

As the ${character.name}, what do you want to say or ask? Consider:
- Information you can share (based on your ability)
- Suspicions about other players
- Questions to help find evil players
- Defending yourself if needed

Respond naturally as if speaking to the group. Don't start with your character name.`,
    };
  }

  /**
   * Generate nomination decision prompt
   */
  static getNominationPrompt(
    character: Character,
    gameContext: GameContext,
    availableTargets: string[],
  ): OllamaMessage {
    const situationAnalysis = this.analyzeSituation(gameContext);

    return {
      role: "user",
      content: `NOMINATION PHASE - Day ${gameContext.day}

Current situation:
${situationAnalysis}

Available players to nominate: ${availableTargets.join(", ")}

As the ${character.name}, decide:
1. Do you want to nominate someone? (yes/no)
2. If yes, who and why?

Consider:
- Who seems most suspicious based on claims and behavior?
- Voting patterns from previous days
- Information contradictions
- Your team's win condition

Respond with either:
"NOMINATE: [player name] - [brief reason]"
or
"PASS - [brief reason for not nominating]"`,
    };
  }

  /**
   * Generate voting decision prompt
   */
  static getVotingPrompt(
    character: Character,
    nominee: string,
    nominationReason: string,
    gameContext: GameContext,
  ): OllamaMessage {
    const situationAnalysis = this.analyzeSituation(gameContext);

    return {
      role: "user",
      content: `VOTING PHASE - Day ${gameContext.day}

Nomination: ${nominee}
Reason: ${nominationReason}

Current situation:
${situationAnalysis}

As the ${character.name}, decide how to vote:

Consider:
- Do you think ${nominee} is evil?
- What evidence supports this nomination?
- How does this affect your team's chances?
- Is there a better target?
- What happens if this execution goes through?

Respond with:
"VOTE: EXECUTE - [brief reason]"
or
"VOTE: PARDON - [brief reason]"`,
    };
  }

  /**
   * Generate night action prompt for characters with night abilities
   */
  static getNightActionPrompt(
    character: Character,
    gameContext: GameContext,
    availableTargets: string[],
  ): OllamaMessage {
    return {
      role: "user",
      content: `NIGHT ${gameContext.day} - ${character.name} Action

Your ability: ${character.ability}

Available targets: ${availableTargets.join(", ")}
Alive players: ${gameContext.aliveCount}

Based on today's discussions and your reads on players, choose your target(s):

Respond with:
"TARGET: [player name(s)] - [brief reasoning]"
or
"SKIP - [reason for not using ability]" if applicable`,
    };
  }

  private static getCharacterPersonality(character: Character): string {
    const personalities: Record<string, string> = {
      // Townsfolk
      investigator:
        "Analytical and methodical. You ask probing questions and piece together information carefully.",
      washerwoman:
        "Observant and social. You pay attention to people's reactions and inconsistencies.",
      librarian:
        "Intellectual and thoughtful. You consider multiple possibilities before drawing conclusions.",
      chef: "Practical and direct. You share your information clearly and expect others to do the same.",
      empath:
        "Intuitive and empathetic. You read people well and notice emotional tells.",
      "fortune-teller":
        "Mysterious and perceptive. You make cryptic but meaningful observations.",
      undertaker:
        "Somber but determined. You use death information strategically.",

      // Outsiders
      butler:
        "Loyal and deferential. You align with players you trust but can be misled.",
      drunk:
        "Confused but well-meaning. You might misunderstand situations or give mixed signals.",
      recluse:
        "Withdrawn and paranoid. You're defensive and worry about being executed.",
      saint:
        "Righteous but cautious. You try to be helpful while avoiding execution.",

      // Minions
      poisoner:
        "Subtle and manipulative. You sow doubt and confusion while appearing helpful.",
      spy: "Deceptive and adaptive. You blend in while gathering information for evil.",
      "scarlet-woman":
        "Charming but dangerous. You protect your demon while building trust.",
      baron: "Strategic and calculating. You create chaos and misdirection.",

      // Demons
      imp: "Charismatic but ruthless. You lead discussions while hiding your true nature.",
      "fang-gu":
        "Patient and opportunistic. You wait for the right moments to strike.",
      vigormortis:
        "Bold and aggressive. You're not afraid to make strong plays.",
      "no-dashii":
        "Unpredictable and chaotic. You thrive in confusion and uncertainty.",
    };

    return (
      personalities[character.id] ||
      "Observant and strategic. You carefully consider all available information before making decisions."
    );
  }

  private static analyzeSituation(gameContext: GameContext): string {
    const parts = [];

    parts.push(
      `Players alive: ${gameContext.aliveCount}/${gameContext.playerCount}`,
    );

    if (gameContext.deadPlayers.length > 0) {
      parts.push(`Dead players: ${gameContext.deadPlayers.join(", ")}`);
    }

    if (gameContext.recentEvents.length > 0) {
      parts.push(
        `Recent events: ${gameContext.recentEvents.slice(-3).join("; ")}`,
      );
    }

    if (Object.keys(gameContext.publicClaims).length > 0) {
      const claims = Object.entries(gameContext.publicClaims)
        .map(([player, claim]) => `${player}: ${claim}`)
        .join("; ");
      parts.push(`Public claims: ${claims}`);
    }

    if (gameContext.votingHistory.length > 0) {
      const lastVote =
        gameContext.votingHistory[gameContext.votingHistory.length - 1];
      if (lastVote.executed) {
        parts.push(`Last execution: ${lastVote.nominee} (Day ${lastVote.day})`);
      }
    }

    return parts.join("\n");
  }
}
