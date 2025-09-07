import { z } from 'zod';
import { RoleDefinitionSchema } from './script-dsl';
import { NightOrderEntrySchema, CharacterActionSchema } from './action-types';

export const ScriptMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  playerCount: z.object({
    min: z.number(),
    max: z.number(),
    optimal: z.string().optional()
  }).optional(),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.string().optional(),
  characterList: z.array(z.string()).optional(),
  characterDistribution: z.record(z.number()).optional(),
  scriptNotes: z.string().optional(),
  // Legacy fields
  region: z.string().optional(),
  population: z.number().optional(),
  notableLocations: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  governance: z.string().optional(),
  coordinates: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  connections: z.array(z.string()).optional(),
  wikiUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional()
});
export type ScriptMetadata = z.infer<typeof ScriptMetadataSchema>;

export const ScriptSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  roles: z.array(RoleDefinitionSchema),
  setup: z.object({
    playerCount: z.object({
      min: z.number(),
      max: z.number()
    }),
    distribution: z.record(z.number()) // roleType -> count
  }),
  // Structured night order with meta actions and character actions
  firstNight: z.array(NightOrderEntrySchema).optional(),
  nightOrder: z.array(NightOrderEntrySchema).optional(),
  // Metadata about the script
  meta: ScriptMetadataSchema.optional()
});
export type Script = z.infer<typeof ScriptSchema>;

// Enhanced Character Types for better data representation
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.enum(['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled']),
  ability: z.string(),
  firstNight: z.number().optional(),
  otherNights: z.number().optional(),
  reminders: z.array(z.string()).optional(),
  setup: z.boolean().optional(),
  special: z.object({
    type: z.enum(['bag-disabled', 'bag-duplicate', 'selection-disabled']),
    description: z.string().optional()
  }).optional(),
  jinx: z.array(z.object({
    id: z.string(),
    reason: z.string()
  })).optional(),
  // Legacy fields for compatibility with existing JSON data
  category: z.string().optional(),
  edition: z.array(z.string()).optional(),
  abilitySummary: z.string().optional(),
  firstNightAction: z.string().nullable().optional(),
  otherNightsAction: z.string().nullable().optional(),
  dayAction: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  tokensUsed: z.array(z.string()).optional(),
  wikiUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  // New fields for programmatic game engine
  goal: z.object({
    action: z.string(),
    description: z.string(),
    targets: z.array(z.string()).optional(),
    effect: z.string().optional(),
    frequency: z.string().optional()
  }).optional(),
  actions: z.object({
  firstNight: z.array(z.lazy(() => CharacterActionSchema)).optional(),
  night: z.array(z.lazy(() => CharacterActionSchema)).optional(),
  day: z.array(z.lazy(() => CharacterActionSchema)).optional(),
  nominations: z.array(z.lazy(() => CharacterActionSchema)).optional(),
  voting: z.array(z.lazy(() => CharacterActionSchema)).optional(),
  execution: z.array(z.lazy(() => CharacterActionSchema)).optional()
  }).optional()
});
export type Character = z.infer<typeof CharacterSchema>;

export const LoadedScriptSchema = z.object({
  id: z.string(),
  name: z.string(),
  characters: z.array(CharacterSchema),
  meta: ScriptMetadataSchema.optional(),
  modifiers: z.array(z.any()).optional(),
  // Night order with structured actions
  firstNight: z.array(NightOrderEntrySchema).optional(),
  nightOrder: z.array(NightOrderEntrySchema).optional(),
  // Legacy fields for compatibility
  firstNightOrder: z.array(z.string()).optional(),
  otherNightOrder: z.array(z.string()).optional()
});
export type LoadedScript = z.infer<typeof LoadedScriptSchema>;
