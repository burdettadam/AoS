// Local type definitions - these should be synced with @ashes-of-salem/shared

export enum GamePhase {
  Setup = "setup",
  Day = "day",
  Night = "night",
  VotingPhase = "voting",
  Endgame = "endgame",
}

export interface Character {
  id: string;
  name: string;
  ability: string;
  firstNight?: number;
  otherNight?: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
  setup?: boolean;
  team: "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled";
  edition?: string;
  jinxes?: Array<{
    id: string;
    reason: string;
  }>;
}

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface JournalEntry {
  id: string;
  gameId: string;
  playerId: string;
  type: "claim" | "observation" | "decision" | "suspicion" | "analysis";
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface GameState {
  gameId: string;
  phase: GamePhase;
  day: number;
  playerCount: number;
  aliveCount: number;
  deadPlayers: string[];
  players: Map<string, PlayerState>;
  votingHistory: VotingRecord[];
  recentEvents: string[];
  publicClaims: Record<string, string>;
  scriptId: string;
  characters: Character[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerState {
  playerId: string;
  name: string;
  character?: Character;
  isAlive: boolean;
  seat: number;
  claims: string[];
  votes: VoteRecord[];
  suspicions: Record<string, number>; // playerId -> suspicion level (0-1)
  trustLevels: Record<string, number>; // playerId -> trust level (0-1)
  lastActive: Date;
  npcProfileId?: string;
}

export interface VotingRecord {
  day: number;
  nominee: string;
  nominator: string;
  votes: string[]; // playerIds who voted
  executed: boolean;
  timestamp: Date;
}

export interface VoteRecord {
  day: number;
  nominee: string;
  timestamp: Date;
}

export interface Nomination {
  nominator: string;
  nominee: string;
  day: number;
  timestamp: Date;
}

export interface NPCBehaviorUpdate {
  aggressiveness?: number;
  trustingness?: number;
  deductiveReasoning?: number;
  socialManipulation?: number;
  riskTolerance?: number;
  vocalness?: number;
  customBehaviors?: Record<string, any>;
}
