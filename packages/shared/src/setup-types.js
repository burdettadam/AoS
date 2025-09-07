"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrimoireStateSchema = exports.SetupStateSchema = exports.CharacterModificationSchema = exports.ReminderTokenSchema = void 0;
const zod_1 = require("zod");
const journal_1 = require("./journal");
const core_types_1 = require("./core-types");
// Setup Phase Types
exports.ReminderTokenSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    roleId: zod_1.z.string(),
    text: zod_1.z.string(),
    seatId: core_types_1.SeatIdSchema.optional(), // Which seat this reminder is attached to
    isActive: zod_1.z.boolean().default(true)
});
exports.CharacterModificationSchema = zod_1.z.object({
    type: zod_1.z.enum(['add_outsiders', 'remove_townsfolk', 'add_minions', 'remove_outsiders']),
    count: zod_1.z.number(),
    condition: zod_1.z.string().optional() // Description of when this applies
});
exports.SetupStateSchema = zod_1.z.object({
    selectedCharacters: zod_1.z.array(zod_1.z.string()).default([]), // Character IDs chosen by storyteller
    characterModifications: zod_1.z.array(exports.CharacterModificationSchema).default([]), // From characters like Baron
    reminderTokens: zod_1.z.array(exports.ReminderTokenSchema).default([]),
    distributionOverride: zod_1.z.object({
        townsfolk: zod_1.z.number(),
        outsiders: zod_1.z.number(),
        minions: zod_1.z.number(),
        demons: zod_1.z.number()
    }).optional(), // Override calculated distribution
    isValidated: zod_1.z.boolean().default(false),
    characterPool: zod_1.z.array(zod_1.z.string()).default([]) // Final pool for random distribution
});
exports.GrimoireStateSchema = zod_1.z.object({
    characterPositions: zod_1.z.record(core_types_1.SeatIdSchema, zod_1.z.string()), // seatId -> characterId
    reminderTokens: zod_1.z.array(exports.ReminderTokenSchema).default([]),
    nightOrder: zod_1.z.array(zod_1.z.string()).default([]), // Character IDs in night order
    setupState: exports.SetupStateSchema.optional(),
    journals: zod_1.z.record(core_types_1.SeatIdSchema, journal_1.JournalSchema).optional(),
});
//# sourceMappingURL=setup-types.js.map