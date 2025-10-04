import {
  AvailableMove,
  GamePhase,
  GameState,
  Seat,
} from "@ashes-of-salem/shared";

export class AvailableMovesService {
  /**
   * Generate available moves for a player based on their character, game state, and current phase
   */
  static generateAvailableMoves(
    gameState: GameState,
    seatId: string,
    phase: GamePhase,
  ): AvailableMove[] {
    const seat = gameState.seats.find((s) => s.id === seatId);
    if (!seat || !seat.role) {
      return this.getGenericMoves(phase);
    }

    const moves: AvailableMove[] = [];

    // Add generic moves available to all players
    moves.push(...this.getGenericMoves(phase));

    // Add character-specific moves
    moves.push(...this.getCharacterSpecificMoves(seat, gameState, phase));

    // Add phase-specific moves
    moves.push(...this.getPhaseSpecificMoves(seat, gameState, phase));

    return moves;
  }

  private static getGenericMoves(phase: GamePhase): AvailableMove[] {
    const moves: AvailableMove[] = [];

    switch (phase) {
      case GamePhase.DAY:
        moves.push({
          id: "take_notes",
          label: "Take Notes",
          description:
            "Record observations, suspicions, or information in your journal",
        });
        moves.push({
          id: "whisper_with_player",
          label: "Whisper with Player",
          description: "Have a private conversation with another player",
        });
        moves.push({
          id: "make_public_statement",
          label: "Make Public Statement",
          description: "Share information or suspicions with the whole group",
        });
        moves.push({
          id: "analyze_voting_patterns",
          label: "Analyze Voting Patterns",
          description:
            "Look at how players voted in previous nominations for clues",
        });
        break;

      case GamePhase.NOMINATION:
        moves.push({
          id: "nominate_player",
          label: "Nominate Player",
          description:
            "Put a player up for execution (if you haven't already today)",
        });
        moves.push({
          id: "evaluate_nomination",
          label: "Evaluate Nomination",
          description: "Consider whether to vote for the current nominee",
        });
        break;

      case GamePhase.VOTE:
        moves.push({
          id: "vote_execute",
          label: "Vote to Execute",
          description: "Vote to execute the nominated player",
        });
        moves.push({
          id: "vote_pardon",
          label: "Vote to Pardon",
          description: "Vote to spare the nominated player",
        });
        break;

      case GamePhase.NIGHT:
        moves.push({
          id: "review_day_events",
          label: "Review Day Events",
          description:
            "Think about what happened during the day and update your notes",
        });
        break;
    }

    return moves;
  }

  private static getCharacterSpecificMoves(
    seat: Seat,
    gameState: GameState,
    phase: GamePhase,
  ): AvailableMove[] {
    const moves: AvailableMove[] = [];

    if (!seat.role) return moves;

    // Information-sharing characters (like Chef, Empath, Fortune Teller)
    if (this.isInformationCharacter(seat.role)) {
      if (phase === GamePhase.DAY) {
        moves.push({
          id: "share_information",
          label: "Share Your Information",
          description: `Reveal what you learned as the ${seat.role}`,
        });
        moves.push({
          id: "coordinate_with_others",
          label: "Coordinate with Other Info Characters",
          description:
            "Work with other information characters to cross-reference data",
        });
      }
    }

    // Detective characters (like Investigator, Washerwoman, Librarian)
    if (this.isDetectiveCharacter(seat.role)) {
      if (phase === GamePhase.DAY) {
        moves.push({
          id: "question_suspects",
          label: "Question Your Suspects",
          description:
            "Talk to the players from your information to gather more clues",
        });
      }
    }

    // Protective characters (like Monk, Soldier)
    if (this.isProtectiveCharacter(seat.role)) {
      if (phase === GamePhase.DAY) {
        moves.push({
          id: "coordinate_protection",
          label: "Coordinate Protection",
          description:
            "Work with other good players to protect important targets",
        });
      }
    }

    return moves;
  }

  private static getPhaseSpecificMoves(
    seat: Seat,
    gameState: GameState,
    phase: GamePhase,
  ): AvailableMove[] {
    const moves: AvailableMove[] = [];

    // Add moves based on specific game situations
    if (phase === GamePhase.DAY && gameState.day > 1) {
      moves.push({
        id: "analyze_death_pattern",
        label: "Analyze Death Pattern",
        description:
          "Consider who died and what that might reveal about evil players",
      });
    }

    // Final day considerations
    if (this.isFinalDay(gameState)) {
      moves.push({
        id: "final_day_strategy",
        label: "Final Day Strategy",
        description: "Consider who must be the demon to win the game",
      });
    }

    return moves;
  }

  private static isInformationCharacter(role: string): boolean {
    const infoCharacters = [
      "chef",
      "empath",
      "fortune-teller",
      "clockmaker",
      "seamstress",
    ];
    return infoCharacters.includes(role.toLowerCase());
  }

  private static isDetectiveCharacter(role: string): boolean {
    const detectiveCharacters = [
      "investigator",
      "washerwoman",
      "librarian",
      "steward",
    ];
    return detectiveCharacters.includes(role.toLowerCase());
  }

  private static isProtectiveCharacter(role: string): boolean {
    const protectiveCharacters = ["monk", "soldier", "tea-lady", "innkeeper"];
    return protectiveCharacters.includes(role.toLowerCase());
  }

  private static isFinalDay(gameState: GameState): boolean {
    const aliveCount = gameState.seats.filter((s) => s.isAlive).length;
    return aliveCount <= 3;
  }
}
