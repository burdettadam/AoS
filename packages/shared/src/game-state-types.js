"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoteSessionSchema = exports.VoteRecordSchema = exports.NominationSchema = exports.AbilitySchema = exports.SeatSchema = void 0;
const zod_1 = require("zod");
const journal_1 = require("./journal");
const core_types_1 = require("./core-types");
const enums_1 = require("./enums");
// Game State Types
exports.SeatSchema = zod_1.z.object({
    id: core_types_1.SeatIdSchema,
    playerId: core_types_1.PlayerIdSchema.optional(),
    isNPC: zod_1.z.boolean(),
    position: zod_1.z.number(),
    alignment: zod_1.z.nativeEnum(enums_1.Alignment).optional(), // Hidden from clients
    role: zod_1.z.string().optional(), // Hidden from clients
    statuses: zod_1.z.array(zod_1.z.string()).default([]),
    isAlive: zod_1.z.boolean().default(true),
    votingPower: zod_1.z.number().default(1),
    // Marks this seat as the storyteller in the lobby (storyteller gets full grimoire view)
    isStoryteller: zod_1.z.boolean().optional(),
    journal: journal_1.JournalSchema.optional(),
});
exports.AbilitySchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    roleId: zod_1.z.string(),
    actorSeat: core_types_1.SeatIdSchema,
    targets: zod_1.z.array(core_types_1.SeatIdSchema),
    timing: zod_1.z.enum(['night', 'day', 'passive']),
    remainingUses: zod_1.z.number().optional(),
    precedence: zod_1.z.number() // Lower = earlier in night order
});
// Day Phase: Nominations & Votes
exports.NominationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    nominator: core_types_1.SeatIdSchema,
    nominee: core_types_1.SeatIdSchema,
    createdAt: zod_1.z.date(),
    closed: zod_1.z.boolean().default(false)
});
exports.VoteRecordSchema = zod_1.z.object({
    voter: core_types_1.SeatIdSchema,
    vote: zod_1.z.boolean(),
    timestamp: zod_1.z.date()
});
exports.VoteSessionSchema = zod_1.z.object({
    nominationId: zod_1.z.string().uuid(),
    startedAt: zod_1.z.date(),
    votes: zod_1.z.array(exports.VoteRecordSchema),
    tally: zod_1.z.object({ yes: zod_1.z.number(), no: zod_1.z.number() }).default({ yes: 0, no: 0 }),
    finished: zod_1.z.boolean().default(false)
});
//# sourceMappingURL=game-state-types.js.map