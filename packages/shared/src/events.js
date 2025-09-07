"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSMessageSchema = exports.EventSchema = void 0;
const zod_1 = require("zod");
const core_types_1 = require("./core-types");
// Events
exports.EventSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    gameId: core_types_1.GameIdSchema,
    type: zod_1.z.enum([
        'game_created',
        'player_joined',
        'player_left',
        'phase_changed',
        'ability_used',
        'vote_cast',
        'nomination_made',
        'execution_occurred',
        'chat_message',
        'script_proposed',
        'script_vote',
        'script_selected',
        'storyteller_changed',
        'available_scripts_updated',
        'roles_selected',
        'setup_characters_selected',
        'setup_validated',
        'character_modifications_applied',
        'reminder_token_added',
        'reminder_token_removed',
        'character_pool_created'
    ]),
    timestamp: zod_1.z.date(),
    actorId: core_types_1.SeatIdSchema.optional(),
    payload: zod_1.z.record(zod_1.z.any())
});
// WebSocket Messages
exports.WSMessageSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('subscribe'),
        gameId: core_types_1.GameIdSchema,
        viewerSeatId: core_types_1.SeatIdSchema.optional()
    }),
    zod_1.z.object({
        type: zod_1.z.literal('event'),
        event: exports.EventSchema
    }),
    zod_1.z.object({
        type: zod_1.z.literal('cmd'),
        cmd: zod_1.z.object({
            kind: zod_1.z.enum(['nominate', 'vote', 'chat', 'ability']),
            payload: zod_1.z.record(zod_1.z.any())
        })
    })
]);
//# sourceMappingURL=events.js.map