import { z } from 'zod';
import {
  CharacterActionType,
  MetaActionType,
  StatusEffect,
  EffectDuration,
  EffectTarget,
  PlayerTeam,
  SelectionModifier,
  CharacterTag,
  ActionPhase,
} from './game-definitions';
import * as Enums from './enums';

// Script DSL Types
export const RoleDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  alignment: z.nativeEnum(Enums.Alignment),
  type: z.nativeEnum(Enums.RoleType),
  ability: z.object({
    id: z.string(),
    when: z.enum(['night', 'day', 'passive']),
    target: z.string(), // DSL expression
    effect: z.array(z.record(z.any()))
  }).optional(),
  visibility: z.object({
    reveals: z.object({
      public: z.enum(['none', 'role', 'alignment']),
      privateTo: z.array(z.string())
    })
  }),
  precedence: z.number(),
  reminderTokens: z.array(z.string()).optional() // Text for reminder tokens
});
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;

// Target selection schema with standardized options (supports both old and new formats)
export const TargetSelectionSchema = z.union([
  // Old format
  z.object({
    minTargets: z.number().min(0),
    maxTargets: z.number().min(0),
    allowSelf: z.boolean().optional(),
    allowDead: z.boolean().optional(),
    requireAlive: z.boolean().optional(),
    restrictByTeam: z.array(z.nativeEnum(PlayerTeam)).optional(),
    restrictByTags: z.array(z.nativeEnum(CharacterTag)).optional(),
    adjacentOnly: z.boolean().optional(),
  }),
  // New parameterized format
  z.object({
    type: z.string(), // Selection type like "ADJACENT_PLAYERS", "ANY_PLAYER", etc.
    criteria: z.record(z.any()).optional(), // Flexible criteria object
  })
]);
export type TargetSelection = z.infer<typeof TargetSelectionSchema>;

// Effect specification schema with standardized types (supports both old and new formats)
export const EffectSpecSchema = z.union([
  // Old format
  z.object({
    status: z.nativeEnum(StatusEffect),
    target: z.nativeEnum(EffectTarget),
    duration: z.nativeEnum(EffectDuration),
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    note: z.string().optional(),
  }),
  // New parameterized format
  z.object({
    type: z.string(), // Effect type like "LEARN_INFORMATION", "KILL_PLAYER", etc.
    target: z.string(), // Target like "SELF", "TARGET", "ALL_PLAYERS", etc.
    duration: z.string(), // Duration like "IMMEDIATE", "NIGHT", "PERMANENT", etc.
    information: z.record(z.any()).optional(), // Information to convey
    statusEffect: z.string().optional(), // Status effect to apply
    newRole: z.string().optional(), // For role changes
    condition: z.string().optional(), // Conditional effects
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    note: z.string().optional(),
  })
]);
export type EffectSpec = z.infer<typeof EffectSpecSchema>;

// Information spec shared with script meta actions
export const InformationSpecSchema = z.object({
  showPlayersByTeam: z.array(z.nativeEnum(PlayerTeam)).optional(),
  showPlayers: z.array(z.string()).optional(),
  showPlayer: z.string().optional(),
  showRoles: z.boolean().optional(),
  giveBluffs: z.number().optional(),
  customMessage: z.string().optional()
});
export type InformationSpec = z.infer<typeof InformationSpecSchema>;
