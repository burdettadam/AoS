import { GameState, Journal, JournalEntry, AvailableMove } from '@botc/shared';
import { AvailableMovesService } from './available-moves.service';

export class JournalService {
  /**
   * Add a note to a player's journal
   */
  static addNote(gameState: GameState, seatId: string, text: string): void {
    const seat = gameState.seats.find(s => s.id === seatId);
    if (!seat) throw new Error('Seat not found');

    if (!seat.journal) {
      seat.journal = { notes: [], moves: [] };
    }

    const note: JournalEntry = {
      text,
      timestamp: new Date()
    };

    seat.journal.notes.push(note);
  }

  /**
   * Update available moves for a player's journal based on current game state
   */
  static updateAvailableMoves(gameState: GameState, seatId: string): void {
    const seat = gameState.seats.find(s => s.id === seatId);
    if (!seat) throw new Error('Seat not found');

    if (!seat.journal) {
      seat.journal = { notes: [], moves: [] };
    }

    // Generate available moves based on current game state and phase
    const availableMoves = AvailableMovesService.generateAvailableMoves(
      gameState,
      seatId,
      gameState.phase
    );

    seat.journal.moves = availableMoves;
  }

  /**
   * Get a player's journal (for the player themselves or storyteller audit)
   */
  static getJournal(gameState: GameState, seatId: string): Journal | null {
    const seat = gameState.seats.find(s => s.id === seatId);
    return seat?.journal || null;
  }

  /**
   * Get all journals for storyteller audit
   */
  static getAllJournals(gameState: GameState): Record<string, Journal> {
    const journals: Record<string, Journal> = {};
    
    for (const seat of gameState.seats) {
      if (seat.journal) {
        journals[seat.id] = seat.journal;
      }
    }

    return journals;
  }

  /**
   * Initialize journal for a player
   */
  static initializeJournal(gameState: GameState, seatId: string): void {
    const seat = gameState.seats.find(s => s.id === seatId);
    if (!seat) throw new Error('Seat not found');

    seat.journal = { notes: [], moves: [] };
    this.updateAvailableMoves(gameState, seatId);
  }
}
