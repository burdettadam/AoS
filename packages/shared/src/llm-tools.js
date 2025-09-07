"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalkSendInputSchema = exports.VoteCastInputSchema = exports.NightActionInputSchema = exports.GameStateReadInputSchema = void 0;
const zod_1 = require("zod");
const core_types_1 = require("./core-types");
// LLM Tool Schemas
exports.GameStateReadInputSchema = zod_1.z.object({
    mask: zod_1.z.enum(['seat', 'public', 'narrator']),
    includeChat: zod_1.z.boolean().optional()
});
exports.NightActionInputSchema = zod_1.z.object({
    abilityId: zod_1.z.string(),
    targets: zod_1.z.array(core_types_1.SeatIdSchema)
});
exports.VoteCastInputSchema = zod_1.z.object({
    nominee: core_types_1.SeatIdSchema,
    vote: zod_1.z.boolean()
});
exports.TalkSendInputSchema = zod_1.z.object({
    channel: zod_1.z.enum(['table', 'whisper']),
    text: zod_1.z.string().optional(),
    emotion: zod_1.z.string().optional()
});
//# sourceMappingURL=llm-tools.js.map