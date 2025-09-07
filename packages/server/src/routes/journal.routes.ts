import { Router } from 'express';
import { JournalService } from '../services/journal.service';
import { GameEngine } from '../game/engine';

const router = Router();
const gameEngine = new GameEngine();

// Add a note to player's journal
router.post('/:gameId/seats/:seatId/notes', (req, res) => {
  try {
    const { gameId, seatId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const gameState = gameEngine.getGame(gameId);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    JournalService.addNote(gameState, seatId, text);
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    } else {
      res.status(500).json({ error });
    }
  }
});

// Get player's journal
router.get('/:gameId/seats/:seatId/journal', (req, res) => {
  try {
    const { gameId, seatId } = req.params;

    const gameState = gameEngine.getGame(gameId);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const journal = JournalService.getJournal(gameState, seatId);
    
    res.json({ journal });
  } catch (error) {
    if (error instanceof Error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    } else {
      res.status(500).json({ error });
    }
  }
});

// Update available moves for a player
router.post('/:gameId/seats/:seatId/moves', (req, res) => {
  try {
    const { gameId, seatId } = req.params;

    const gameState = gameEngine.getGame(gameId);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    JournalService.updateAvailableMoves(gameState, seatId);
    
    const journal = JournalService.getJournal(gameState, seatId);
    res.json({ moves: journal?.moves || [] });
  } catch (error) {
    if (error instanceof Error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    } else {
      res.status(500).json({ error });
    }
  }
});

// Storyteller: Get all journals for audit
router.get('/:gameId/journals', (req, res) => {
  try {
    const { gameId } = req.params;

    const gameState = gameEngine.getGame(gameId);
    if (!gameState) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // TODO: Add authorization check to ensure this is the storyteller
    
    const journals = JournalService.getAllJournals(gameState);
    
    res.json({ journals });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error });
    }
  }
});

export default router;
