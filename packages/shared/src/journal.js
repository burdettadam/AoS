"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalSchema = exports.AvailableMoveSchema = exports.JournalEntrySchema = void 0;
const zod_1 = require("zod");
exports.JournalEntrySchema = zod_1.z.object({
    text: zod_1.z.string(),
    timestamp: zod_1.z.date(),
});
exports.AvailableMoveSchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    description: zod_1.z.string(),
});
exports.JournalSchema = zod_1.z.object({
    notes: zod_1.z.array(exports.JournalEntrySchema).default([]),
    moves: zod_1.z.array(exports.AvailableMoveSchema).default([]),
});
//# sourceMappingURL=journal.js.map