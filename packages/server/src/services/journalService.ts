import { GameState, Seat, AvailableMove, GamePhase, Character } from '@botc/shared';

/**
 * Generates available moves for a player based on their character and current game state
 */
export class JournalService {
  /**
   * Get available moves for a player based on their seat and current game state
   */
  static getAvailableMovesForPlayer(gameState: GameState, seat: Seat, character?: Character): AvailableMove[] {
    const moves: AvailableMove[] = [];
    
    // Universal moves available to all players
    moves.push(...this.getUniversalMoves(gameState, seat));
    
    // Character-specific moves
    if (character?.actions) {
      moves.push(...this.getCharacterSpecificMoves(gameState, character, seat));
    }
    
    // Phase-specific moves
    moves.push(...this.getPhaseSpecificMoves(gameState, seat));
    
    return moves;
  }

  /**
   * Universal moves available to all players regardless of character
   */
  private static getUniversalMoves(gameState: GameState, seat: Seat): AvailableMove[] {
    const moves: AvailableMove[] = [];
    
    if (gameState.phase === GamePhase.DAY) {
      moves.push({
        id: 'make_public_statement',
        label: 'Make Public Statement',
        description: 'Share information or make a claim to all players'
      });
      
      moves.push({
        id: 'whisper_privately',
        label: 'Whisper Privately',
        description: 'Have a private conversation with another player'
      });
      
      moves.push({
        id: 'bluff',
        label: 'Bluff',
        description: 'Make a false claim to mislead other players'
      });
      
      moves.push({
        id: 'analyze_behavior',
        label: 'Analyze Behavior',
        description: 'Study other players for tells or suspicious behavior'
      });
    }
    
    if (gameState.phase === GamePhase.NOMINATION || gameState.phase === GamePhase.VOTE) {
      if (seat.isAlive) {
        moves.push({
          id: 'nominate_player',
          label: 'Nominate Player',
          description: 'Nominate a player for execution'
        });
        
        moves.push({
          id: 'vote_on_nomination',
          label: 'Vote on Nomination',
          description: 'Cast your vote on the current nomination'
        });
      }
    }
    
    // Always available moves
    moves.push({
      id: 'talk_to_storyteller',
      label: 'Talk to Storyteller',
      description: 'Ask questions or clarify rules with the storyteller'
    });
    
    return moves;
  }

  /**
   * Get character-specific moves based on the character's availableMoves configuration
   */
  private static getCharacterSpecificMoves(gameState: GameState, character: Character, seat: Seat): AvailableMove[] {
    const moves: AvailableMove[] = [];
    if (!character.actions) return moves;
    const mapToAvailableMove = (action: any): AvailableMove => ({
      id: action.id,
      label: action.label,
      description: action.description
    });
    switch (gameState.phase) {
      case GamePhase.DAY:
        if (character.actions.firstNight) {
          moves.push(...character.actions.firstNight.map(mapToAvailableMove));
        }
        if (character.actions.day) {
          moves.push(...character.actions.day.map(mapToAvailableMove));
        }
        break;
      case GamePhase.NOMINATION:
        if (character.actions.nominations) {
          moves.push(...character.actions.nominations.map(mapToAvailableMove));
        }
        break;
      case GamePhase.NIGHT:
        if (character.actions.night) {
          moves.push(...character.actions.night.map(mapToAvailableMove));
        }
        break;
    }
    return moves;
  }

  /**
   * Get phase-specific moves that apply to the current game phase
   */
  private static getPhaseSpecificMoves(gameState: GameState, seat: Seat): AvailableMove[] {
    const moves: AvailableMove[] = [];
    
    switch (gameState.phase) {
      case GamePhase.NIGHT:
        if (seat.isAlive) {
          moves.push({
            id: 'use_night_ability',
            label: 'Use Night Ability',
            description: 'Use your character\'s night ability if available'
          });
        }
        break;
        
      case GamePhase.DAY:
        moves.push({
          id: 'share_information',
          label: 'Share Information',
          description: 'Reveal information you learned during the night'
        });
        
        moves.push({
          id: 'form_alliance',
          label: 'Form Alliance',
          description: 'Try to coordinate with other good players'
        });
        break;
    }
    
    return moves;
  }

  /**
   * Update a player's journal with new available moves
   */
  static updatePlayerJournal(gameState: GameState, seatId: string, character?: Character): void {
    const seat = gameState.seats.find(s => s.id === seatId);
    if (!seat) return;
    
    // Initialize journal if it doesn't exist
    if (!seat.journal) {
      seat.journal = {
        notes: [],
        moves: []
      };
    }
    
    // Update available moves
    seat.journal.moves = this.getAvailableMovesForPlayer(gameState, seat, character);
  }

  /**
   * Add a note to a player's journal
   */
  static addJournalNote(gameState: GameState, seatId: string, text: string): void {
    const seat = gameState.seats.find(s => s.id === seatId);
    if (!seat) return;
    
    // Initialize journal if it doesn't exist
    if (!seat.journal) {
      seat.journal = {
        notes: [],
        moves: []
      };
    }
    
    seat.journal.notes.push({
      text,
      timestamp: new Date()
    });
  }

  /**
   * Get all player journals for storyteller auditing
   */
  static getPlayerJournalsForStoryteller(gameState: GameState): Record<string, { playerName?: string; journal: any }> {
    const journals: Record<string, any> = {};
    
    for (const seat of gameState.seats) {
      if (seat.journal && seat.journal.notes.length > 0) {
        journals[seat.id] = {
          playerName: `Player ${seat.position}`, // You might want to add actual player names
          journal: seat.journal
        };
      }
    }
    
    return journals;
  }
}
