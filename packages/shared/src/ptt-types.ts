import { z } from 'zod';
import * as CoreTypes from './core-types';

// PTT-related types
export const PTTModeSchema = z.enum(['hold', 'toggle']);
export type PTTMode = z.infer<typeof PTTModeSchema>;

export const PTTSessionSchema = z.object({
  id: z.string().uuid(),
  seatId: CoreTypes.SeatIdSchema,
  startTime: z.date(),
  endTime: z.date().optional(),
  audioUri: z.string().optional(),
  transcript: z.string().optional(),
  wordLevelTranscript: z.array(z.object({
    word: z.string(),
    start: z.number(),
    end: z.number(),
    confidence: z.number()
  })).optional()
});
export type PTTSession = z.infer<typeof PTTSessionSchema>;

export const GameEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['nomination', 'vote', 'claim', 'contradiction', 'other']),
  seatId: CoreTypes.SeatIdSchema,
  timestamp: z.date(),
  content: z.string(),
  confidence: z.number().optional(),
  relatedSeats: z.array(CoreTypes.SeatIdSchema).optional()
});
export type GameEvent = z.infer<typeof GameEventSchema>;

export const PTTJournalEntrySchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  phase: z.string(),
  highlights: z.array(z.string()),
  watchlist: z.array(z.object({
  seatId: CoreTypes.SeatIdSchema,
    reason: z.string(),
    priority: z.enum(['low', 'medium', 'high'])
  })),
  summary: z.string(),
  redactedContent: z.record(z.any()).optional() // For night info redaction
});
export type PTTJournalEntry = z.infer<typeof PTTJournalEntrySchema>;

export const PTTStateSchema = z.object({
  isMuted: z.boolean(),
  isSpeaking: z.boolean(),
  mode: PTTModeSchema,
  cooldownEndTime: z.date().optional(),
  currentSession: PTTSessionSchema.optional(),
  lastSession: PTTSessionSchema.optional()
});
export type PTTState = z.infer<typeof PTTStateSchema>;

export const VideoTileStateSchema = z.object({
  seatId: CoreTypes.SeatIdSchema,
  isMuted: z.boolean(),
  isSpeaking: z.boolean(),
  volume: z.number(), // 0-1
  isDucked: z.boolean()
});
export type VideoTileState = z.infer<typeof VideoTileStateSchema>;

// API request/response types
export const ASRSummaryRequestSchema = z.object({
  turns: z.array(PTTSessionSchema),
  events: z.array(GameEventSchema),
  viewerRole: z.string(),
  phase: z.string()
});
export type ASRSummaryRequest = z.infer<typeof ASRSummaryRequestSchema>;

export const ASRSummaryResponseSchema = z.object({
  highlights: z.array(z.string()),
  watchlist: z.array(z.object({
  seatId: CoreTypes.SeatIdSchema,
    reason: z.string(),
    priority: z.enum(['low', 'medium', 'high'])
  })),
  summary: z.string()
});
export type ASRSummaryResponse = z.infer<typeof ASRSummaryResponseSchema>;
