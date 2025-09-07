"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadedScriptSchema = exports.CharacterSchema = exports.ScriptSchema = exports.ScriptMetadataSchema = void 0;
const zod_1 = require("zod");
const script_dsl_1 = require("./script-dsl");
const action_types_1 = require("./action-types");
exports.ScriptMetadataSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    author: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    version: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    playerCount: zod_1.z.object({
        min: zod_1.z.number(),
        max: zod_1.z.number(),
        optimal: zod_1.z.string().optional()
    }).optional(),
    complexity: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedTime: zod_1.z.string().optional(),
    characterList: zod_1.z.array(zod_1.z.string()).optional(),
    characterDistribution: zod_1.z.record(zod_1.z.number()).optional(),
    scriptNotes: zod_1.z.string().optional(),
    // Legacy fields
    region: zod_1.z.string().optional(),
    population: zod_1.z.number().optional(),
    notableLocations: zod_1.z.array(zod_1.z.string()).optional(),
    resources: zod_1.z.array(zod_1.z.string()).optional(),
    governance: zod_1.z.string().optional(),
    coordinates: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number()
    }).optional(),
    connections: zod_1.z.array(zod_1.z.string()).optional(),
    wikiUrl: zod_1.z.string().url().optional(),
    imageUrl: zod_1.z.string().url().optional()
});
exports.ScriptSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    version: zod_1.z.string(),
    roles: zod_1.z.array(script_dsl_1.RoleDefinitionSchema),
    setup: zod_1.z.object({
        playerCount: zod_1.z.object({
            min: zod_1.z.number(),
            max: zod_1.z.number()
        }),
        distribution: zod_1.z.record(zod_1.z.number()) // roleType -> count
    }),
    // Structured night order with meta actions and character actions
    firstNight: zod_1.z.array(action_types_1.NightOrderEntrySchema).optional(),
    nightOrder: zod_1.z.array(action_types_1.NightOrderEntrySchema).optional(),
    // Metadata about the script
    meta: exports.ScriptMetadataSchema.optional()
});
// Enhanced Character Types for better data representation
exports.CharacterSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    team: zod_1.z.enum(['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled']),
    ability: zod_1.z.string(),
    firstNight: zod_1.z.number().optional(),
    otherNights: zod_1.z.number().optional(),
    reminders: zod_1.z.array(zod_1.z.string()).optional(),
    setup: zod_1.z.boolean().optional(),
    special: zod_1.z.object({
        type: zod_1.z.enum(['bag-disabled', 'bag-duplicate', 'selection-disabled']),
        description: zod_1.z.string().optional()
    }).optional(),
    jinx: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        reason: zod_1.z.string()
    })).optional(),
    // Legacy fields for compatibility with existing JSON data
    category: zod_1.z.string().optional(),
    edition: zod_1.z.array(zod_1.z.string()).optional(),
    abilitySummary: zod_1.z.string().optional(),
    firstNightAction: zod_1.z.string().nullable().optional(),
    otherNightsAction: zod_1.z.string().nullable().optional(),
    dayAction: zod_1.z.string().nullable().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    tokensUsed: zod_1.z.array(zod_1.z.string()).optional(),
    wikiUrl: zod_1.z.string().url().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    // New fields for programmatic game engine
    goal: zod_1.z.object({
        action: zod_1.z.string(),
        description: zod_1.z.string(),
        targets: zod_1.z.array(zod_1.z.string()).optional(),
        effect: zod_1.z.string().optional(),
        frequency: zod_1.z.string().optional()
    }).optional(),
    actions: zod_1.z.object({
        firstNight: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional(),
        otherNights: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional(),
        day: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional(),
        nominations: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional(),
        voting: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional(),
        execution: zod_1.z.array(zod_1.z.lazy(() => action_types_1.CharacterActionSchema)).optional()
    }).optional()
});
exports.LoadedScriptSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    characters: zod_1.z.array(exports.CharacterSchema),
    meta: exports.ScriptMetadataSchema.optional(),
    modifiers: zod_1.z.array(zod_1.z.any()).optional(),
    // Night order with structured actions
    firstNight: zod_1.z.array(action_types_1.NightOrderEntrySchema).optional(),
    nightOrder: zod_1.z.array(action_types_1.NightOrderEntrySchema).optional(),
    // Legacy fields for compatibility
    firstNightOrder: zod_1.z.array(zod_1.z.string()).optional(),
    otherNightOrder: zod_1.z.array(zod_1.z.string()).optional()
});
//# sourceMappingURL=script.js.map