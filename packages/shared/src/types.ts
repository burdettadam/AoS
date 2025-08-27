import { z } from 'zod';

// Game State Enums
export enum GamePhase {
  LOBBY = 'lobby',
  NIGHT = 'night',
  DAY = 'day',
  NOMINATION = 'nomination',
  VOTE = 'vote',
  EXECUTION = 'execution',
  END = 'end'
}

export enum Alignment {
  GOOD = 'good',
  EVIL = 'evil'
}

export enum RoleType {
  TOWNSFOLK = 'townsfolk',
  OUTSIDER = 'outsider',
  MINION = 'minion',
  DEMON = 'demon'
}

// Core Types
export const SeatIdSchema = z.string().uuid();
export type SeatId = z.infer<typeof SeatIdSchema>;

export const PlayerIdSchema = z.string().uuid();
export type PlayerId = z.infer<typeof PlayerIdSchema>;

export const GameIdSchema = z.string().uuid();
export type GameId = z.infer<typeof GameIdSchema>;

// Game State Types
export const SeatSchema = z.object({
  id: SeatIdSchema,
  playerId: PlayerIdSchema.optional(),
  isNPC: z.boolean(),
  position: z.number(),
  alignment: z.nativeEnum(Alignment).optional(), // Hidden from clients
  role: z.string().optional(), // Hidden from clients
  statuses: z.array(z.string()).default([]),
  isAlive: z.boolean().default(true),
  votingPower: z.number().default(1),
  // Marks this seat as the storyteller in the lobby (storyteller gets full grimoire view)
  isStoryteller: z.boolean().optional()
});
export type Seat = z.infer<typeof SeatSchema>;

export const AbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  roleId: z.string(),
  actorSeat: SeatIdSchema,
  targets: z.array(SeatIdSchema),
  timing: z.enum(['night', 'day', 'passive']),
  remainingUses: z.number().optional(),
  precedence: z.number() // Lower = earlier in night order
});
export type Ability = z.infer<typeof AbilitySchema>;

export const GameStateSchema = z.object({
  id: GameIdSchema,
  phase: z.nativeEnum(GamePhase),
  day: z.number(),
  seed: z.string(),
  scriptId: z.string(),
  seats: z.array(SeatSchema),
  abilities: z.array(AbilitySchema),
  // Storyteller seat (if any)
  storytellerSeatId: SeatIdSchema.optional(),
  // Script proposals and voting while in lobby
  scriptProposals: z.array(z.object({
    id: z.string().uuid(),
    scriptId: z.string(),
    proposedBy: SeatIdSchema,
    votes: z.record(z.boolean()).default({}),
    createdAt: z.date()
  })).default([]),
  // Optional list of role IDs selected by the storyteller for this game
  selectedRoles: z.array(z.string()).optional(),
  // Optional map of seatId -> roleId claimed/picked before start
  roleClaims: z.record(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type GameState = z.infer<typeof GameStateSchema>;

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
  'roles_selected'
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
      kind: z.enum(['nominate', 'vote', 'chat', 'ability']),
      payload: z.record(z.any())
    })
  })
]);
export type WSMessage = z.infer<typeof WSMessageSchema>;

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

// Script DSL Types
export const RoleDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  alignment: z.nativeEnum(Alignment),
  type: z.nativeEnum(RoleType),
  ability: z.object({
    id: z.string(),
    when: z.enum(['night', 'day', 'passive']),
    target: z.string(), // DSL expression
    effect: z.array(z.record(z.any()))
  }).optional(),
  visibility: z.object({
    reveals: z.object({
      public: z.enum(['none', 'role', 'alignment']),
      privateTo: z.array(z.string())
    })
  }),
  precedence: z.number()
});
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;

export const ScriptSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  roles: z.array(RoleDefinitionSchema),
  setup: z.object({
    playerCount: z.object({
      min: z.number(),
      max: z.number()
    }),
    distribution: z.record(z.number()) // roleType -> count
  })
});
export type Script = z.infer<typeof ScriptSchema>;
