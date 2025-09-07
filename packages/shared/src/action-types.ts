import { z } from 'zod';
import * as Enums from './enums';
import { SeatIdSchema, GameIdSchema } from './core-types';
import { MetaActionType, CharacterActionType } from './game-definitions';
import {
  TargetSelectionSchema,
  EffectSpecSchema,
  InformationSpecSchema,
} from './script-dsl';

export const CharacterActionSchema = z.object({
  id: z.string(),
  // Support both old and new formats during migration
  type: z.enum(['character','meta']).default('character').optional(),
  // Old format (to be deprecated)
  action: z.union([z.nativeEnum(CharacterActionType), z.nativeEnum(MetaActionType), z.string()]).optional(),
  description: z.string(),
  targets: z.array(z.string()).optional(),
  // New parameterized format
  actionType: z.union([z.nativeEnum(CharacterActionType), z.nativeEnum(MetaActionType), z.string()]).optional(),
  selection: TargetSelectionSchema.optional(),
  effects: z.array(EffectSpecSchema).optional(),
  information: InformationSpecSchema.optional(),
  order: z.number().optional(),
  condition: z.string().optional()
}).refine((data) => {
  // Ensure either old format OR new format is used
  const hasOldFormat = data.action !== undefined && data.targets !== undefined;
  const hasNewFormat = data.actionType !== undefined && data.selection !== undefined && data.effects !== undefined;

  return hasOldFormat || hasNewFormat;
}, {
  message: "Action must use either old format (action + targets) or new format (actionType + selection + effects)"
});
export type CharacterAction = z.infer<typeof CharacterActionSchema>;

// Meta action schema for script-level actions (minion info, demon info, etc.)
export const MetaActionSchema = z.object({
  id: z.string(),
  type: z.literal('meta').optional(),
  // Old format (to be deprecated)
  action: z.union([z.nativeEnum(MetaActionType), z.string()]).optional(),
  description: z.string(),
  targets: z.array(z.enum(['townsfolk', 'outsiders', 'minions', 'demons', 'all'])).optional(),
  // New parameterized format
  actionType: z.nativeEnum(MetaActionType).optional(),
  selection: TargetSelectionSchema.optional(),
  effects: z.array(EffectSpecSchema).optional(),
  information: InformationSpecSchema.optional(),
  order: z.number()
}).refine((data) => {
  // Ensure either old format OR new format is used
  const hasOldFormat = data.action !== undefined && data.targets !== undefined;
  const hasNewFormat = data.actionType !== undefined && data.selection !== undefined && data.effects !== undefined;

  return hasOldFormat || hasNewFormat;
}, {
  message: "Meta action must use either old format (action + targets) or new format (actionType + selection + effects)"
});
export type MetaAction = z.infer<typeof MetaActionSchema>;

// Union type for night order entries (can be character ID or meta action)
export const NightOrderEntrySchema = z.union([
  z.string(), // Character ID
  MetaActionSchema
]);
export type NightOrderEntry = z.infer<typeof NightOrderEntrySchema>;

// Action execution context for the engine
export const ActionContextSchema = z.object({
  gameId: GameIdSchema,
  phase: z.nativeEnum(Enums.GamePhase),
  day: z.number(),
  acting: SeatIdSchema.optional(), // The seat performing the action
  targets: z.array(SeatIdSchema).optional(), // Target seats
  metadata: z.record(z.any()).optional() // Additional context
});
export type ActionContext = z.infer<typeof ActionContextSchema>;

// Action result for tracking what happened
export const ActionResultSchema = z.object({
  actionId: z.string(),
  success: z.boolean(),
  information: z.record(z.any()).optional(), // Information delivered
  events: z.array(z.string()).optional(), // Event IDs generated
  errors: z.array(z.string()).optional()
});
export type ActionResult = z.infer<typeof ActionResultSchema>;
