"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InformationSpecSchema = exports.EffectSpecSchema = exports.TargetSelectionSchema = exports.RoleDefinitionSchema = void 0;
const zod_1 = require("zod");
const game_definitions_1 = require("./game-definitions");
const enums_1 = require("./enums");
// Script DSL Types
exports.RoleDefinitionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    alignment: zod_1.z.nativeEnum(enums_1.Alignment),
    type: zod_1.z.nativeEnum(enums_1.RoleType),
    ability: zod_1.z.object({
        id: zod_1.z.string(),
        when: zod_1.z.enum(['night', 'day', 'passive']),
        target: zod_1.z.string(), // DSL expression
        effect: zod_1.z.array(zod_1.z.record(zod_1.z.any()))
    }).optional(),
    visibility: zod_1.z.object({
        reveals: zod_1.z.object({
            public: zod_1.z.enum(['none', 'role', 'alignment']),
            privateTo: zod_1.z.array(zod_1.z.string())
        })
    }),
    precedence: zod_1.z.number(),
    reminderTokens: zod_1.z.array(zod_1.z.string()).optional() // Text for reminder tokens
});
// Target selection schema with standardized options (supports both old and new formats)
exports.TargetSelectionSchema = zod_1.z.union([
    // Old format
    zod_1.z.object({
        minTargets: zod_1.z.number().min(0),
        maxTargets: zod_1.z.number().min(0),
        allowSelf: zod_1.z.boolean().optional(),
        allowDead: zod_1.z.boolean().optional(),
        requireAlive: zod_1.z.boolean().optional(),
        restrictByTeam: zod_1.z.array(zod_1.z.nativeEnum(game_definitions_1.PlayerTeam)).optional(),
        restrictByTags: zod_1.z.array(zod_1.z.nativeEnum(game_definitions_1.CharacterTag)).optional(),
        adjacentOnly: zod_1.z.boolean().optional(),
    }),
    // New parameterized format
    zod_1.z.object({
        type: zod_1.z.string(), // Selection type like "ADJACENT_PLAYERS", "ANY_PLAYER", etc.
        criteria: zod_1.z.record(zod_1.z.any()).optional(), // Flexible criteria object
    })
]);
// Effect specification schema with standardized types (supports both old and new formats)
exports.EffectSpecSchema = zod_1.z.union([
    // Old format
    zod_1.z.object({
        status: zod_1.z.nativeEnum(game_definitions_1.StatusEffect),
        target: zod_1.z.nativeEnum(game_definitions_1.EffectTarget),
        duration: zod_1.z.nativeEnum(game_definitions_1.EffectDuration),
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]).optional(),
        note: zod_1.z.string().optional(),
    }),
    // New parameterized format
    zod_1.z.object({
        type: zod_1.z.string(), // Effect type like "LEARN_INFORMATION", "KILL_PLAYER", etc.
        target: zod_1.z.string(), // Target like "SELF", "TARGET", "ALL_PLAYERS", etc.
        duration: zod_1.z.string(), // Duration like "IMMEDIATE", "NIGHT", "PERMANENT", etc.
        information: zod_1.z.record(zod_1.z.any()).optional(), // Information to convey
        statusEffect: zod_1.z.string().optional(), // Status effect to apply
        newRole: zod_1.z.string().optional(), // For role changes
        condition: zod_1.z.string().optional(), // Conditional effects
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]).optional(),
        note: zod_1.z.string().optional(),
    })
]);
// Information spec shared with script meta actions
exports.InformationSpecSchema = zod_1.z.object({
    showPlayersByTeam: zod_1.z.array(zod_1.z.nativeEnum(game_definitions_1.PlayerTeam)).optional(),
    showPlayers: zod_1.z.array(zod_1.z.string()).optional(),
    showPlayer: zod_1.z.string().optional(),
    showRoles: zod_1.z.boolean().optional(),
    giveBluffs: zod_1.z.number().optional(),
    customMessage: zod_1.z.string().optional()
});
//# sourceMappingURL=script-dsl.js.map