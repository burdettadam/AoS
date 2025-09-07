import { z } from 'zod';

// Scoring Types
export const ScoringMetricsSchema = z.object({
  informationGain: z.number().min(0).max(100),
  controlBalance: z.number().min(0).max(100),
  timeCushion: z.number().min(0).max(100),
  redundancyRobustness: z.number().min(0).max(100),
  volatility: z.number().min(0).max(100),
  momentum: z.number().min(-100).max(100)
});
export type ScoringMetrics = z.infer<typeof ScoringMetricsSchema>;
