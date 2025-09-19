"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
const core_types_1 = require("./core-types");
const game_state_types_1 = require("./game-state-types");
const setup_types_1 = require("./setup-types");
exports.GameStateSchema = zod_1.z.object({
    id: core_types_1.GameIdSchema,
    phase: zod_1.z.nativeEnum(enums_1.GamePhase),
    day: zod_1.z.number(),
    seed: zod_1.z.string(),
    // Human-friendly name for the game (set by host)
    gameName: zod_1.z.string().optional(),
    // Whether this game is visible in public game lists (default: true)
    isPublic: zod_1.z.boolean().default(true),
    scriptId: zod_1.z.string(),
    seats: zod_1.z.array(game_state_types_1.SeatSchema),
    abilities: zod_1.z.array(game_state_types_1.AbilitySchema),
    // Day phase structures
    currentNomination: game_state_types_1.NominationSchema.optional(),
    currentVote: game_state_types_1.VoteSessionSchema.optional(),
    // Storyteller seat (if any)
    storytellerSeatId: core_types_1.SeatIdSchema.optional(),
    // Scripts made available by storyteller for players to see/propose
    availableScriptIds: zod_1.z.array(zod_1.z.string()).default([]),
    // Script proposals and voting while in lobby
    scriptProposals: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        scriptId: zod_1.z.string(),
    proposers: zod_1.z.array(core_types_1.SeatIdSchema).default([]),
        // Legacy yes/no votes (kept for compatibility)
        votes: zod_1.z.record(zod_1.z.boolean()).default({}),
        // New difficulty votes per seat
        difficultyVotes: zod_1.z.record(zod_1.z.enum(['beginner', 'intermediate', 'advanced'])).default({}),
        createdAt: zod_1.z.date()
    })).default([]),
    // Optional list of role IDs selected by the storyteller for this game
    selectedRoles: zod_1.z.array(zod_1.z.string()).optional(),
    // Optional map of seatId -> roleId claimed/picked before start
    roleClaims: zod_1.z.record(zod_1.z.string()).optional(),
    // Setup state for SETUP phase
    setupState: setup_types_1.SetupStateSchema.optional(),
    // Grimoire state for storyteller
    grimoireState: setup_types_1.GrimoireStateSchema.optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
//# sourceMappingURL=game-state.js.map
