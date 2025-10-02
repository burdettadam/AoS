import { z } from "zod";
import { PlayerIdSchema, SeatIdSchema } from "./core-types";
import * as Enums from "./enums";
import { JournalSchema } from "./journal";

// Game State Types
export const SeatSchema = z.object({
  id: SeatIdSchema,
  playerId: PlayerIdSchema.optional(),
  isNPC: z.boolean(),
  position: z.number(),
  alignment: z.nativeEnum(Enums.Alignment).optional(), // Hidden from clients
  role: z.string().optional(), // Hidden from clients
  statuses: z.array(z.string()).default([]),
  isAlive: z.boolean().default(true),
  votingPower: z.number().default(1),
  // Selected NPC profile (for AI behavior customization)
  npcProfileId: z.string().optional(),
  // Marks this seat as the storyteller in the lobby (storyteller gets full grimoire view)
  isStoryteller: z.boolean().optional(),
  journal: JournalSchema.optional(),
});
export type Seat = z.infer<typeof SeatSchema>;

export const AbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  roleId: z.string(),
  actorSeat: SeatIdSchema,
  targets: z.array(SeatIdSchema),
  timing: z.enum(["night", "day", "passive"]),
  remainingUses: z.number().optional(),
  precedence: z.number(), // Lower = earlier in night order
});
export type Ability = z.infer<typeof AbilitySchema>;

// Day Phase: Nominations & Votes
export const NominationSchema = z.object({
  id: z.string().uuid(),
  nominator: SeatIdSchema,
  nominee: SeatIdSchema,
  createdAt: z.date(),
  closed: z.boolean().default(false),
});
export type Nomination = z.infer<typeof NominationSchema>;

export const VoteRecordSchema = z.object({
  voter: SeatIdSchema,
  vote: z.boolean(),
  timestamp: z.date(),
});
export type VoteRecord = z.infer<typeof VoteRecordSchema>;

export const VoteSessionSchema = z.object({
  nominationId: z.string().uuid(),
  startedAt: z.date(),
  votes: z.array(VoteRecordSchema),
  tally: z
    .object({ yes: z.number(), no: z.number() })
    .default({ yes: 0, no: 0 }),
  finished: z.boolean().default(false),
});
export type VoteSession = z.infer<typeof VoteSessionSchema>;
