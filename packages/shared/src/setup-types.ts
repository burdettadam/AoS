import { z } from 'zod';
import { JournalSchema } from './journal';
import { SeatIdSchema } from './core-types';

// Setup Phase Types
export const ReminderTokenSchema = z.object({
  id: z.string().uuid(),
  roleId: z.string(),
  text: z.string(),
  seatId: SeatIdSchema.optional(), // Which seat this reminder is attached to
  isActive: z.boolean().default(true)
});
export type ReminderToken = z.infer<typeof ReminderTokenSchema>;

export const CharacterModificationSchema = z.object({
  type: z.enum(['add_outsiders', 'remove_townsfolk', 'add_minions', 'remove_outsiders']),
  count: z.number(),
  condition: z.string().optional() // Description of when this applies
});
export type CharacterModification = z.infer<typeof CharacterModificationSchema>;

export const SetupStateSchema = z.object({
  selectedCharacters: z.array(z.string()).default([]), // Character IDs chosen by storyteller
  characterModifications: z.array(CharacterModificationSchema).default([]), // From characters like Baron
  reminderTokens: z.array(ReminderTokenSchema).default([]),
  distributionOverride: z.object({
    townsfolk: z.number(),
    outsiders: z.number(),
    minions: z.number(),
    demons: z.number()
  }).optional(), // Override calculated distribution
  isValidated: z.boolean().default(false),
  characterPool: z.array(z.string()).default([]) // Final pool for random distribution
});
export type SetupState = z.infer<typeof SetupStateSchema>;

export const GrimoireStateSchema = z.object({
  characterPositions: z.record(SeatIdSchema, z.string()), // seatId -> characterId
  reminderTokens: z.array(ReminderTokenSchema).default([]),
  nightOrder: z.array(z.string()).default([]), // Character IDs in night order
  setupState: SetupStateSchema.optional(),
  journals: z.record(SeatIdSchema, JournalSchema).optional(),
});
export type GrimoireState = z.infer<typeof GrimoireStateSchema>;
