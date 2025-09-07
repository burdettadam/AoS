"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameIdSchema = exports.PlayerIdSchema = exports.SeatIdSchema = void 0;
const zod_1 = require("zod");
// Core Types
exports.SeatIdSchema = zod_1.z.string().uuid();
exports.PlayerIdSchema = zod_1.z.string().uuid();
exports.GameIdSchema = zod_1.z.string().uuid();
//# sourceMappingURL=core-types.js.map