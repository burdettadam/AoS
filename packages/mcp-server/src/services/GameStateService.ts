import type { Character } from "@ashes-of-salem/shared";
import type { GameState, MCPResponse, PlayerState } from "../types/index.js";

export class GameStateService {
  private gameStates = new Map<string, GameState>();
  private playerStates = new Map<string, Map<string, PlayerState>>();

  constructor() {
    // Initialize with some mock data for testing
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockGameState: GameState = {
      gameId: "test-game-1",
      phase: "DAY" as any,
      day: 2,
      playerCount: 7,
      aliveCount: 6,
      deadPlayers: ["Bob"],
      players: new Map(),
      votingHistory: [
        {
          day: 1,
          nominee: "Frank",
          nominator: "Alice",
          votes: ["Alice", "Charlie"],
          executed: false,
          timestamp: new Date(),
        },
      ],
      recentEvents: [
        "Night 1: Bob was found dead",
        "Day 1: No execution",
        "Alice claimed to be the Investigator",
      ],
      publicClaims: {
        Alice: "Investigator",
        Charlie: "Butler to Dave",
        Eve: "Empath (0 evil neighbors)",
      },
      scriptId: "trouble-brewing",
      characters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.gameStates.set("test-game-1", mockGameState);

    // Mock player states
    const playerStates = new Map<string, PlayerState>();
    const playerNames = [
      "Alice",
      "Bob",
      "Charlie",
      "Dave",
      "Eve",
      "Frank",
      "Grace",
    ];

    playerNames.forEach((name, index) => {
      playerStates.set(name, {
        playerId: name,
        name,
        isAlive: name !== "Bob",
        seat: index + 1,
        claims: name === "Alice" ? ["Investigator"] : [],
        votes: [],
        suspicions: {},
        trustLevels: {},
        lastActive: new Date(),
        npcProfileId:
          name !== "Alice" ? `npc-${name.toLowerCase()}` : undefined,
      });
    });

    this.playerStates.set("test-game-1", playerStates);
  }

  async getGameState(gameId: string): Promise<MCPResponse> {
    const gameState = this.gameStates.get(gameId);

    if (!gameState) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Game ${gameId} not found` }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            gameId: gameState.gameId,
            phase: gameState.phase,
            day: gameState.day,
            playerCount: gameState.playerCount,
            aliveCount: gameState.aliveCount,
            deadPlayers: gameState.deadPlayers,
            recentEvents: gameState.recentEvents,
            publicClaims: gameState.publicClaims,
            scriptId: gameState.scriptId,
          }),
        },
      ],
    };
  }

  async getPlayerInfo(gameId: string, playerId: string): Promise<MCPResponse> {
    const playerStates = this.playerStates.get(gameId);

    if (!playerStates) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Game ${gameId} not found` }),
          },
        ],
      };
    }

    const player = playerStates.get(playerId);

    if (!player) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Player ${playerId} not found in game ${gameId}`,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            playerId: player.playerId,
            name: player.name,
            isAlive: player.isAlive,
            seat: player.seat,
            claims: player.claims,
            suspicions: player.suspicions,
            trustLevels: player.trustLevels,
            npcProfileId: player.npcProfileId,
          }),
        },
      ],
    };
  }

  async getVotingHistory(gameId: string, day?: number): Promise<MCPResponse> {
    const gameState = this.gameStates.get(gameId);

    if (!gameState) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Game ${gameId} not found` }),
          },
        ],
      };
    }

    let votingHistory = gameState.votingHistory;

    if (day !== undefined) {
      votingHistory = votingHistory.filter((vote) => vote.day === day);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            gameId,
            votingHistory: votingHistory.map((vote) => ({
              day: vote.day,
              nominee: vote.nominee,
              nominator: vote.nominator,
              voteCount: vote.votes.length,
              executed: vote.executed,
              timestamp: vote.timestamp,
            })),
          }),
        },
      ],
    };
  }

  async getCharacterInfo(characterId: string): Promise<MCPResponse> {
    // This would typically fetch from a character database
    // For now, return mock character data
    const mockCharacters: Record<string, Character> = {
      investigator: {
        id: "investigator",
        name: "Investigator",
        team: "townsfolk",
        ability:
          "You start knowing that 1 of 2 players is a particular Minion.",
        firstNight: 1,
        reminders: ["Minion", "Wrong"],
        setup: false,
        edition: ["trouble-brewing"],
        tags: ["information", "setup"],
      },
      imp: {
        id: "imp",
        name: "Imp",
        team: "demon",
        ability:
          "Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.",
        otherNights: 3,
        reminders: ["Dead"],
        setup: false,
        edition: ["trouble-brewing"],
        tags: ["elimination", "active"],
      },
    };

    const character = mockCharacters[characterId];

    if (!character) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Character ${characterId} not found`,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(character),
        },
      ],
    };
  }

  async getScriptCharacters(scriptId: string): Promise<MCPResponse> {
    // Mock script characters - would fetch from database
    const scriptCharacters = {
      "trouble-brewing": [
        "investigator",
        "washerwoman",
        "empath",
        "chef",
        "fortune-teller",
        "undertaker",
        "monk",
        "virgin",
        "slayer",
        "soldier",
        "mayor",
        "librarian",
        "butler",
        "imp",
        "baron",
        "scarlet-woman",
        "spy",
      ],
    };

    const characters =
      scriptCharacters[scriptId as keyof typeof scriptCharacters];

    if (!characters) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: `Script ${scriptId} not found` }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            scriptId,
            characters,
          }),
        },
      ],
    };
  }

  async updateGameState(
    gameId: string,
    updates: Partial<GameState>,
  ): Promise<void> {
    const gameState = this.gameStates.get(gameId);
    if (gameState) {
      Object.assign(gameState, updates);
      gameState.updatedAt = new Date();
    }
  }

  async updatePlayerState(
    gameId: string,
    playerId: string,
    updates: Partial<PlayerState>,
  ): Promise<void> {
    const playerStates = this.playerStates.get(gameId);
    if (playerStates) {
      const player = playerStates.get(playerId);
      if (player) {
        Object.assign(player, updates);
        player.lastActive = new Date();
      }
    }
  }
}
