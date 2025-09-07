"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringMetricsSchema = void 0;
const zod_1 = require("zod");
// Scoring Types
exports.ScoringMetricsSchema = zod_1.z.object({
    informationGain: zod_1.z.number().min(0).max(100),
    controlBalance: zod_1.z.number().min(0).max(100),
    timeCushion: zod_1.z.number().min(0).max(100),
    redundancyRobustness: zod_1.z.number().min(0).max(100),
    volatility: zod_1.z.number().min(0).max(100),
    momentum: zod_1.z.number().min(-100).max(100)
});
//# sourceMappingURL=scoring.js.map