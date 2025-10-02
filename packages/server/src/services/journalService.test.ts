import { Character, GamePhase, GameState, Seat } from "@botc/shared";
import { JournalService } from "../services/journalService";

describe("JournalService", () => {
  let gameState: GameState;
  let playerSeat: Seat;
  let character: Character;

  beforeEach(() => {
    // Create a mock game state
    gameState = {
      id: "test-game",
      phase: GamePhase.DAY,
      day: 1,
      seed: "test-seed",
      scriptId: "trouble-brewing",
      isPublic: true,
      seats: [],
      abilities: [],
      availableScriptIds: [],
      scriptProposals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GameState;

    // Create a mock player seat
    playerSeat = {
      id: "seat-1",
      isNPC: false,
      position: 1,
      isAlive: true,
      votingPower: 1,
      statuses: [],
      journal: {
        notes: [],
        moves: [],
      },
    };

    // Create a mock character
    character = {
      id: "chef",
      name: "Chef",
      team: "townsfolk",
      ability: "You start knowing how many pairs of evil players there are.",
    } as Character;

    gameState.seats = [playerSeat];
  });

  describe("getAvailableMovesForPlayer", () => {
    it("should return universal moves for all players", () => {
      const moves = JournalService.getAvailableMovesForPlayer(
        gameState,
        playerSeat,
      );

      expect(moves).toContainEqual({
        id: "make_public_statement",
        label: "Make Public Statement",
        description: "Share information or make a claim to all players",
      });

      expect(moves).toContainEqual({
        id: "talk_to_storyteller",
        label: "Talk to Storyteller",
        description: "Ask questions or clarify rules with the storyteller",
      });
    });

    it("should include character-specific moves when character is provided", () => {
      const moves = JournalService.getAvailableMovesForPlayer(
        gameState,
        playerSeat,
        character,
      );

      expect(moves).toContainEqual({
        id: "share_information",
        label: "Share Information",
        description: "Reveal information you learned during the night",
      });

      expect(moves).toContainEqual({
        id: "analyze_behavior",
        label: "Analyze Behavior",
        description: "Study other players for tells or suspicious behavior",
      });
    });

    it("should include nomination moves during nomination phase", () => {
      gameState.phase = GamePhase.NOMINATION;
      const moves = JournalService.getAvailableMovesForPlayer(
        gameState,
        playerSeat,
      );

      expect(moves).toContainEqual({
        id: "nominate_player",
        label: "Nominate Player",
        description: "Nominate a player for execution",
      });
    });

    it("should include night-specific moves during night phase", () => {
      gameState.phase = GamePhase.NIGHT;
      const moves = JournalService.getAvailableMovesForPlayer(
        gameState,
        playerSeat,
      );

      expect(moves).toContainEqual({
        id: "use_night_ability",
        label: "Use Night Ability",
        description: "Use your character's night ability if available",
      });
    });
  });

  describe("updatePlayerJournal", () => {
    it("should initialize journal if it does not exist", () => {
      playerSeat.journal = undefined;
      JournalService.updatePlayerJournal(gameState, playerSeat.id, character);

      expect(playerSeat.journal).toBeDefined();
      expect(playerSeat.journal!.notes).toEqual([]);
      expect(playerSeat.journal!.moves).toBeDefined();
    });

    it("should update available moves in player journal", () => {
      JournalService.updatePlayerJournal(gameState, playerSeat.id, character);

      expect(playerSeat.journal?.moves).toContainEqual({
        id: "share_information",
        label: "Share Information",
        description: "Reveal information you learned during the night",
      });
    });
  });

  describe("addJournalNote", () => {
    it("should add a note to player journal", () => {
      const noteText =
        "I think Player 3 might be evil based on their voting pattern";
      JournalService.addJournalNote(gameState, playerSeat.id, noteText);

      expect(playerSeat.journal!.notes).toHaveLength(1);
      expect(playerSeat.journal!.notes[0].text).toBe(noteText);
      expect(playerSeat.journal!.notes[0].timestamp).toBeInstanceOf(Date);
    });

    it("should initialize journal if it does not exist when adding note", () => {
      playerSeat.journal = undefined;
      JournalService.addJournalNote(gameState, playerSeat.id, "Test note");

      expect(playerSeat.journal).toBeDefined();
      expect(playerSeat.journal!.notes).toHaveLength(1);
    });
  });

  describe("getPlayerJournalsForStoryteller", () => {
    it("should return all player journals with notes", () => {
      // Add notes to player journals
      JournalService.addJournalNote(gameState, playerSeat.id, "First note");

      // Add another player with a journal
      const secondSeat: Seat = {
        id: "seat-2",
        isNPC: false,
        position: 2,
        isAlive: true,
        votingPower: 1,
        statuses: [],
        journal: {
          notes: [
            {
              text: "Second player note",
              timestamp: new Date(),
            },
          ],
          moves: [],
        },
      };
      gameState.seats.push(secondSeat);

      const journals =
        JournalService.getPlayerJournalsForStoryteller(gameState);

      expect(Object.keys(journals)).toHaveLength(2);
      expect(journals[playerSeat.id]).toBeDefined();
      expect(journals[secondSeat.id]).toBeDefined();
    });

    it("should not return journals without notes", () => {
      // Player has journal but no notes
      playerSeat.journal = { notes: [], moves: [] };

      const journals =
        JournalService.getPlayerJournalsForStoryteller(gameState);

      expect(Object.keys(journals)).toHaveLength(0);
    });
  });
});
