import { z } from 'zod';
import { SeatIdSchema, GameIdSchema } from './core-types';

// LLM Tool Schemas
export const GameStateReadInputSchema = z.object({
  mask: z.enum(['seat', 'public', 'narrator']),
  includeChat: z.boolean().optional()
});
export type GameStateReadInput = z.infer<typeof GameStateReadInputSchema>;

export const NightActionInputSchema = z.object({
  abilityId: z.string(),
  targets: z.array(SeatIdSchema)
});
export type NightActionInput = z.infer<typeof NightActionInputSchema>;

export const VoteCastInputSchema = z.object({
  nominee: SeatIdSchema,
  vote: z.boolean()
});
export type VoteCastInput = z.infer<typeof VoteCastInputSchema>;

export const TalkSendInputSchema = z.object({
  channel: z.enum(['table', 'whisper']),
  text: z.string().optional(),
  emotion: z.string().optional()
});
export type TalkSendInput = z.infer<typeof TalkSendInputSchema>;
