import { Router } from 'express';
import { JournalController } from '../controllers/journalController';

const router = Router();

// Add a note to player's journal
router.post('/games/:gameId/seats/:seatId/journal/notes', JournalController.addNote);

// Get available moves for a player
router.get('/games/:gameId/seats/:seatId/moves', JournalController.getAvailableMoves);

// Update player journal with current available moves
router.post('/games/:gameId/seats/:seatId/journal/update', JournalController.updateJournal);

// Get player's journal
router.get('/games/:gameId/seats/:seatId/journal', JournalController.getJournal);

// Get all player journals (storyteller only)
router.get('/games/:gameId/journals', JournalController.getAllJournals);

export { router as journalRoutes };
