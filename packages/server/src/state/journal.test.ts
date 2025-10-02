import { GamePhase, GameState, Seat } from "@botc/shared";
import { AvailableMovesService } from "../services/available-moves.service";
import { JournalService } from "../services/journal.service";

// Mock a basic game state for testing
const createMockGameState = (): GameState => ({
  id: "test-game",
  phase: GamePhase.DAY,
  day: 1,
  seed: "test-seed",
  scriptId: "trouble-brewing",
  isPublic: true,
  seats: [
    {
      id: "seat-1",
      playerId: "player-1",
      isNPC: false,
      position: 0,
      isAlive: true,
      votingPower: 1,
      statuses: [],
      role: "chef",
    },
  ],
  abilities: [],
  availableScriptIds: [],
  scriptProposals: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe("Journal Management", () => {
  let gameState: GameState;
  let playerSeat: Seat;

  beforeEach(() => {
    gameState = createMockGameState();
    playerSeat = gameState.seats[0];
  });

  it("should allow a player to add a note to their journal", () => {
    JournalService.initializeJournal(gameState, playerSeat.id);
    JournalService.addNote(gameState, playerSeat.id, "This is a test note.");

    const journal = JournalService.getJournal(gameState, playerSeat.id);
    expect(journal?.notes).toHaveLength(1);
    expect(journal?.notes[0].text).toBe("This is a test note.");
  });

  it("should generate available moves for a player", () => {
    const moves = AvailableMovesService.generateAvailableMoves(
      gameState,
      playerSeat.id,
      GamePhase.DAY,
    );

    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some((move) => move.id === "take_notes")).toBe(true);
  });

  it("should update available moves when game state changes", () => {
    JournalService.initializeJournal(gameState, playerSeat.id);

    const initialJournal = JournalService.getJournal(gameState, playerSeat.id);
    const initialMovesCount = initialJournal?.moves.length || 0;

    // Change game phase
    gameState.phase = GamePhase.NOMINATION;
    JournalService.updateAvailableMoves(gameState, playerSeat.id);

    const updatedJournal = JournalService.getJournal(gameState, playerSeat.id);
    expect(updatedJournal?.moves.length).toBeGreaterThan(0);
    // Moves should be different for different phases
    expect(
      updatedJournal?.moves.some((move) => move.id === "nominate_player"),
    ).toBe(true);
  });

  it("should allow the storyteller to audit all player journals", () => {
    JournalService.initializeJournal(gameState, playerSeat.id);
    JournalService.addNote(gameState, playerSeat.id, "Secret note from player");

    const allJournals = JournalService.getAllJournals(gameState);
    expect(allJournals[playerSeat.id]).toBeDefined();
    expect(allJournals[playerSeat.id].notes).toHaveLength(1);
  });
});
