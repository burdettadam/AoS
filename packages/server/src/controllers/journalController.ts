import { GameState } from "@botc/shared";
import { Request, Response } from "express";
import { JournalService } from "../services/journalService";

export class JournalController {
  /**
   * Add a note to a player's journal
   */
  static addNote = async (req: Request, res: Response) => {
    try {
      const { gameId, seatId } = req.params;
      const { text } = req.body;

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Note text is required" });
      }

      // TODO: Fetch game state from storage/database
      // For now, this is a placeholder
      const gameState: GameState = req.gameState; // Assume middleware adds this

      JournalService.addJournalNote(gameState, seatId, text);

      // TODO: Save updated game state

      res.json({ success: true, message: "Note added to journal" });
    } catch (error) {
      console.error("Error adding journal note:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  /**
   * Get available moves for a player
   */
  static getAvailableMoves = async (req: Request, res: Response) => {
    try {
      const { gameId, seatId } = req.params;

      // TODO: Fetch game state and character from storage/database
      const gameState: GameState = req.gameState; // Assume middleware adds this
      const seat = gameState.seats.find((s) => s.id === seatId);

      if (!seat) {
        return res.status(404).json({ error: "Seat not found" });
      }

      // TODO: Get character from game/seat data
      const character = undefined; // Placeholder - would fetch actual character

      const moves = JournalService.getAvailableMovesForPlayer(
        gameState,
        seat,
        character,
      );

      res.json({ moves });
    } catch (error) {
      console.error("Error getting available moves:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  /**
   * Update player journal with current available moves
   */
  static updateJournal = async (req: Request, res: Response) => {
    try {
      const { gameId, seatId } = req.params;

      // TODO: Fetch game state and character from storage/database
      const gameState: GameState = req.gameState;
      const character = undefined; // Placeholder

      JournalService.updatePlayerJournal(gameState, seatId, character);

      // TODO: Save updated game state

      res.json({ success: true, message: "Journal updated" });
    } catch (error) {
      console.error("Error updating journal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  /**
   * Get player journal (for the player themselves)
   */
  static getJournal = async (req: Request, res: Response) => {
    try {
      const { gameId, seatId } = req.params;

      const gameState: GameState = req.gameState;
      const seat = gameState.seats.find((s) => s.id === seatId);

      if (!seat) {
        return res.status(404).json({ error: "Seat not found" });
      }

      res.json({ journal: seat.journal || { notes: [], moves: [] } });
    } catch (error) {
      console.error("Error getting journal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  /**
   * Get all player journals (for storyteller auditing)
   */
  static getAllJournals = async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;

      // TODO: Verify user is storyteller

      const gameState: GameState = req.gameState;
      const journals =
        JournalService.getPlayerJournalsForStoryteller(gameState);

      res.json({ journals });
    } catch (error) {
      console.error("Error getting all journals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Extend Express Request to include gameState (this would be added by middleware)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      gameState: GameState;
    }
  }
}
