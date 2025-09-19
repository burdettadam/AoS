import { z } from 'zod';
import { JournalSchema } from './journal';
import * as Enums from './enums';
import { SeatIdSchema, PlayerIdSchema, GameIdSchema } from './core-types';
import { SeatSchema, AbilitySchema, NominationSchema, VoteSessionSchema } from './game-state-types';
import { SetupStateSchema, GrimoireStateSchema } from './setup-types';

export const GameStateSchema = z.object({
  id: GameIdSchema,
  phase: z.nativeEnum(Enums.GamePhase),
  day: z.number(),
  seed: z.string(),
  // Human-friendly name for the game (set by host)
  gameName: z.string().optional(),
  // Whether this game is visible in public game lists (default: true)
  isPublic: z.boolean().default(true),
  scriptId: z.string(),
  seats: z.array(SeatSchema),
  abilities: z.array(AbilitySchema),
  // Day phase structures
  currentNomination: NominationSchema.optional(),
  currentVote: VoteSessionSchema.optional(),
  // Storyteller seat (if any)
  storytellerSeatId: SeatIdSchema.optional(),
  // Scripts made available by storyteller for players to see/propose
  availableScriptIds: z.array(z.string()).default([]),
  // Script proposals and voting while in lobby
  scriptProposals: z.array(z.object({
    id: z.string().uuid(),
    scriptId: z.string(),
    proposers: z.array(SeatIdSchema).default([]),
    // Legacy yes/no votes (kept for compatibility)
    votes: z.record(z.boolean()).default({}),
    // New difficulty votes per seat
    difficultyVotes: z.record(z.enum(['beginner','intermediate','advanced'])).default({}),
    createdAt: z.date()
  })).default([]),
  // Optional list of role IDs selected by the storyteller for this game
  selectedRoles: z.array(z.string()).optional(),
  // Optional map of seatId -> roleId claimed/picked before start
  roleClaims: z.record(z.string()).optional(),
  // Setup state for SETUP phase
  setupState: SetupStateSchema.optional(),
  // Grimoire state for storyteller
  grimoireState: GrimoireStateSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type GameState = z.infer<typeof GameStateSchema>;
