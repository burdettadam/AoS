import { z } from 'zod';

// Core Types
export const SeatIdSchema = z.string().uuid();
export type SeatId = z.infer<typeof SeatIdSchema>;

export const PlayerIdSchema = z.string().uuid();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

export const GameIdSchema = z.string().uuid();
export type GameId = z.infer<typeof GameIdSchema>;
