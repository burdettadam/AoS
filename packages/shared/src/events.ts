import { z } from 'zod';
import { GameIdSchema, SeatIdSchema } from './core-types';

// Events
export const EventSchema = z.object({
  id: z.string().uuid(),
  gameId: GameIdSchema,
  type: z.enum([
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
    'character_pool_created',
    'ptt_session_started',
    'ptt_session_ended',
    'ptt_transcript_ready',
    'game_event_extracted',
    'journal_entry_created'
  ]),
  timestamp: z.date(),
  actorId: SeatIdSchema.optional(),
  payload: z.record(z.any())
});
export type Event = z.infer<typeof EventSchema>;

// WebSocket Messages
export const WSMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subscribe'),
  gameId: GameIdSchema,
  viewerSeatId: SeatIdSchema.optional()
  }),
  z.object({
    type: z.literal('event'),
    event: EventSchema
  }),
  z.object({
    type: z.literal('cmd'),
    cmd: z.object({
      kind: z.enum(['nominate', 'vote', 'chat', 'ability', 'ptt_start', 'ptt_end', 'ptt_toggle']),
      payload: z.record(z.any())
    })
  })
]);
export type WSMessage = z.infer<typeof WSMessageSchema>;
