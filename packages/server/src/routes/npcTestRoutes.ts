/**
 * NPC Test Routes
 * API endpoints for testing NPC agents with enhanced behavioral systems
 */

import type { Character, NPCProfile } from "@ashes-of-salem/shared";
import { GamePhase } from "@ashes-of-salem/shared";
import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { getInitializationPrompt } from "../ai/initialization/NPCInitializationSystem";
import { GameContext } from "../ai/llm/PromptTemplates";
import { logger } from "../utils/logger";

// Constants
const SESSION_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour
const PLAYER_NAMES = [
  "Alice",
  "Bob",
  "Charlie",
  "Dave",
  "Eve",
  "Frank",
  "Grace",
];

// Mock character data for testing
const MOCK_CHARACTERS: Character[] = [
  {
    id: "investigator",
    name: "Investigator",
    team: "townsfolk",
    ability: "You start knowing that 1 of 2 players is a particular Minion.",
    firstNight: 1,
    reminders: ["Minion", "Wrong"],
    setup: false,
    edition: ["trouble-brewing"],
    tags: ["information", "setup"],
  },
  {
    id: "washerwoman",
    name: "Washerwoman",
    team: "townsfolk",
    ability: "You start knowing that 1 of 2 players is a particular Townsfolk.",
    firstNight: 1,
    reminders: ["Townsfolk", "Wrong"],
    setup: false,
    edition: ["trouble-brewing"],
    tags: ["information", "setup"],
  },
  {
    id: "empath",
    name: "Empath",
    team: "townsfolk",
    ability:
      "Each night, you learn how many of your 2 alive neighbors are evil.",
    firstNight: 1,
    otherNights: 2,
    reminders: ["1", "2"],
    setup: false,
    edition: ["trouble-brewing"],
    tags: ["information", "active"],
  },
  {
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
];

interface NPCTestSession {
  sessionId: string;
  profileId: string;
  profile: NPCProfile;
  character: Character;
  gameContext: GameContext;
  seatName: string;
  messageHistory: Array<{
    id: string;
    sender: "user" | "npc";
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastActivity: Date;
}

interface MessageData {
  id: string;
  sender: "user" | "npc";
  content: string;
  timestamp: Date;
}

interface APIError {
  error: string;
}

// Session management
class NPCTestSessionManager {
  private sessions = new Map<string, NPCTestSession>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(
      () => this.cleanupExpiredSessions(),
      SESSION_CLEANUP_INTERVAL,
    );
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredTime = new Date(now.getTime() - SESSION_TIMEOUT);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < expiredTime) {
        this.sessions.delete(sessionId);
        logger.info(`Cleaned up expired NPC test session: ${sessionId}`);
      }
    }
  }

  createSession(profile: NPCProfile): NPCTestSession {
    const sessionId = randomUUID();
    const { character, gameContext, seatName } =
      this.createSimulatedGameContext();

    const session: NPCTestSession = {
      sessionId,
      profileId: profile.id,
      profile,
      character,
      gameContext,
      seatName,
      messageHistory: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);
    logger.info(
      `Started NPC test session: ${sessionId} with profile: ${profile.name} as ${character.name}`,
    );

    return session;
  }

  getSession(sessionId: string): NPCTestSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  addMessage(sessionId: string, message: MessageData): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messageHistory.push(message);
      this.updateSessionActivity(sessionId);
    }
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info(`Ended NPC test session: ${sessionId}`);
    }
    return deleted;
  }

  private createSimulatedGameContext(): {
    character: Character;
    gameContext: GameContext;
    seatName: string;
  } {
    const randomCharacter =
      MOCK_CHARACTERS[Math.floor(Math.random() * MOCK_CHARACTERS.length)];
    const seatName =
      PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];

    const gameContext: GameContext = {
      phase: GamePhase.DAY,
      day: 2,
      playerCount: 7,
      aliveCount: 6,
      deadPlayers: ["Bob"],
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
      votingHistory: [
        {
          day: 1,
          nominee: "Frank",
          votes: 2,
          executed: false,
        },
      ],
    };

    return { character: randomCharacter, gameContext, seatName };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
