"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionResultSchema = exports.ActionContextSchema = exports.NightOrderEntrySchema = exports.MetaActionSchema = exports.CharacterActionSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const core_types_1 = require("./core-types");
const game_definitions_1 = require("./game-definitions");
const script_dsl_1 = require("./script-dsl");
exports.CharacterActionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    // Support both old and new formats during migration
    type: zod_1.z.enum(['character', 'meta']).default('character').optional(),
    // Old format (to be deprecated)
    action: zod_1.z.union([zod_1.z.nativeEnum(game_definitions_1.CharacterActionType), zod_1.z.nativeEnum(game_definitions_1.MetaActionType), zod_1.z.string()]).optional(),
    description: zod_1.z.string(),
    targets: zod_1.z.array(zod_1.z.string()).optional(),
    // New parameterized format
    actionType: zod_1.z.union([zod_1.z.nativeEnum(game_definitions_1.CharacterActionType), zod_1.z.nativeEnum(game_definitions_1.MetaActionType), zod_1.z.string()]).optional(),
    selection: script_dsl_1.TargetSelectionSchema.optional(),
    effects: zod_1.z.array(script_dsl_1.EffectSpecSchema).optional(),
    information: script_dsl_1.InformationSpecSchema.optional(),
    order: zod_1.z.number().optional(),
    condition: zod_1.z.string().optional()
}).refine((data) => {
    // Ensure either old format OR new format is used
    const hasOldFormat = data.action !== undefined && data.targets !== undefined;
    const hasNewFormat = data.actionType !== undefined && data.selection !== undefined && data.effects !== undefined;
    return hasOldFormat || hasNewFormat;
}, {
    message: "Action must use either old format (action + targets) or new format (actionType + selection + effects)"
});
// Meta action schema for script-level actions (minion info, demon info, etc.)
exports.MetaActionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.literal('meta').optional(),
    // Old format (to be deprecated)
    action: zod_1.z.union([zod_1.z.nativeEnum(game_definitions_1.MetaActionType), zod_1.z.string()]).optional(),
    description: zod_1.z.string(),
    targets: zod_1.z.array(zod_1.z.enum(['townsfolk', 'outsiders', 'minions', 'demons', 'all'])).optional(),
    // New parameterized format
    actionType: zod_1.z.nativeEnum(game_definitions_1.MetaActionType).optional(),
    selection: script_dsl_1.TargetSelectionSchema.optional(),
    effects: zod_1.z.array(script_dsl_1.EffectSpecSchema).optional(),
    information: script_dsl_1.InformationSpecSchema.optional(),
    order: zod_1.z.number()
}).refine((data) => {
    // Ensure either old format OR new format is used
    const hasOldFormat = data.action !== undefined && data.targets !== undefined;
    const hasNewFormat = data.actionType !== undefined && data.selection !== undefined && data.effects !== undefined;
    return hasOldFormat || hasNewFormat;
}, {
    message: "Meta action must use either old format (action + targets) or new format (actionType + selection + effects)"
});
// Union type for night order entries (can be character ID or meta action)
exports.NightOrderEntrySchema = zod_1.z.union([
    zod_1.z.string(), // Character ID
    exports.MetaActionSchema
]);
// Action execution context for the engine
exports.ActionContextSchema = zod_1.z.object({
    gameId: core_types_1.GameIdSchema,
    phase: zod_1.z.nativeEnum(enums_1.GamePhase),
    day: zod_1.z.number(),
    acting: core_types_1.SeatIdSchema.optional(), // The seat performing the action
    targets: zod_1.z.array(core_types_1.SeatIdSchema).optional(), // Target seats
    metadata: zod_1.z.record(zod_1.z.any()).optional() // Additional context
});
// Action result for tracking what happened
exports.ActionResultSchema = zod_1.z.object({
    actionId: zod_1.z.string(),
    success: zod_1.z.boolean(),
    information: zod_1.z.record(zod_1.z.any()).optional(), // Information delivered
    events: zod_1.z.array(zod_1.z.string()).optional(), // Event IDs generated
    errors: zod_1.z.array(zod_1.z.string()).optional()
});
//# sourceMappingURL=action-types.js.map