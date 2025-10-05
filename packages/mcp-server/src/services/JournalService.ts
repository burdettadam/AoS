import type { JournalEntry, MCPResponse } from "../types/index.js";

export class JournalService {
  private journals = new Map<string, Map<string, JournalEntry[]>>();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const gameJournals = new Map<string, JournalEntry[]>();

    // Mock journal entries for test game
    const mockEntries: JournalEntry[] = [
      {
        id: "entry-1",
        gameId: "test-game-1",
        playerId: "Alice",
        type: "claim",
        content:
          "Claimed to be Investigator, received information about Charlie/Dave (one is Minion)",
        metadata: {
          character: "Investigator",
          confidence: 0.9,
          claimDay: 1,
        },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: "entry-2",
        gameId: "test-game-1",
        playerId: "Bob",
        type: "observation",
        content:
          "Died Night 1 - likely killed by demon. No information revealed before death.",
        metadata: {
          deathNight: 1,
          killedBy: "demon",
        },
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
      {
        id: "entry-3",
        gameId: "test-game-1",
        playerId: "Charlie",
        type: "suspicion",
        content:
          "Suspicious of Frank - voting patterns don't align with town interests",
        metadata: {
          target: "Frank",
          suspicionLevel: 0.7,
          reasoning: "voting_patterns",
        },
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ];

    mockEntries.forEach((entry) => {
      if (!gameJournals.has(entry.playerId)) {
        gameJournals.set(entry.playerId, []);
      }
      gameJournals.get(entry.playerId)!.push(entry);
    });

    this.journals.set("test-game-1", gameJournals);
  }

  async getEntries(
    gameId: string,
    playerId?: string,
    entryType?: string,
  ): Promise<MCPResponse> {
    const gameJournals = this.journals.get(gameId);

    if (!gameJournals) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `No journal entries found for game ${gameId}`,
            }),
          },
        ],
      };
    }

    let entries: JournalEntry[] = [];

    if (playerId) {
      const playerEntries = gameJournals.get(playerId);
      if (playerEntries) {
        entries = playerEntries;
      }
    } else {
      // Get all entries for the game
      for (const playerEntries of gameJournals.values()) {
        entries.push(...playerEntries);
      }
    }

    // Filter by entry type if specified
    if (entryType) {
      entries = entries.filter((entry) => entry.type === entryType);
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            gameId,
            playerId,
            entryType,
            entries: entries.map((entry) => ({
              id: entry.id,
              playerId: entry.playerId,
              type: entry.type,
              content: entry.content,
              metadata: entry.metadata,
              timestamp: entry.timestamp,
            })),
          }),
        },
      ],
    };
  }

  async addEntry(
    gameId: string,
    playerId: string,
    entry: Omit<JournalEntry, "id" | "gameId" | "playerId" | "timestamp">,
  ): Promise<MCPResponse> {
    if (!this.journals.has(gameId)) {
      this.journals.set(gameId, new Map());
    }

    const gameJournals = this.journals.get(gameId)!;

    if (!gameJournals.has(playerId)) {
      gameJournals.set(playerId, []);
    }

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      playerId,
      timestamp: new Date(),
      ...entry,
    };

    gameJournals.get(playerId)!.push(newEntry);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            entryId: newEntry.id,
            message: "Journal entry added successfully",
          }),
        },
      ],
    };
  }

  async getPlayerDecisionHistory(
    gameId: string,
    playerId: string,
  ): Promise<MCPResponse> {
    const gameJournals = this.journals.get(gameId);

    if (!gameJournals) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Game ${gameId} not found` }),
          },
        ],
      };
    }

    const playerEntries = gameJournals.get(playerId);

    if (!playerEntries) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              gameId,
              playerId,
              decisions: [],
            }),
          },
        ],
      };
    }

    const decisions = playerEntries
      .filter((entry) => entry.type === "decision")
      .map((entry) => ({
        timestamp: entry.timestamp,
        content: entry.content,
        metadata: entry.metadata,
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            gameId,
            playerId,
            decisions,
          }),
        },
      ],
    };
  }

  async getSuspicionNetwork(gameId: string): Promise<MCPResponse> {
    const gameJournals = this.journals.get(gameId);

    if (!gameJournals) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Game ${gameId} not found` }),
          },
        ],
      };
    }

    const suspicionNetwork: Record<string, Record<string, number>> = {};

    for (const [playerId, entries] of gameJournals.entries()) {
      suspicionNetwork[playerId] = {};

      const suspicionEntries = entries.filter(
        (entry) => entry.type === "suspicion",
      );

      for (const entry of suspicionEntries) {
        const target = entry.metadata.target;
        const level = entry.metadata.suspicionLevel || 0.5;

        if (target) {
          suspicionNetwork[playerId][target] = level;
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            gameId,
            suspicionNetwork,
          }),
        },
      ],
    };
  }
}
