import { z } from 'zod';

export const JournalEntrySchema = z.object({
  text: z.string(),
  timestamp: z.date(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const AvailableMoveSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
});
export type AvailableMove = z.infer<typeof AvailableMoveSchema>;

export const JournalSchema = z.object({
  notes: z.array(JournalEntrySchema).default([]),
  moves: z.array(AvailableMoveSchema).default([]),
});
export type Journal = z.infer<typeof JournalSchema>;
