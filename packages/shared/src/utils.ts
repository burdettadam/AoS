import { GameState, SeatId, Seat } from './types';

/**
 * Utility functions for game logic
 */

export function generateSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array];
  // Simple seeded shuffle - in production, use a proper seeded RNG
  let currentIndex = shuffled.length;
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}

export function getSeatById(gameState: GameState, seatId: SeatId): Seat | undefined {
  return gameState.seats.find(seat => seat.id === seatId);
}

export function getAlivePlayers(gameState: GameState): Seat[] {
  return gameState.seats.filter(seat => seat.isAlive);
}

export function getPlayersByAlignment(gameState: GameState, alignment: 'good' | 'evil'): Seat[] {
  return gameState.seats.filter(seat => seat.alignment === alignment);
}

export function calculateParity(gameState: GameState): { goodCount: number; evilCount: number; atParity: boolean } {
  const aliveSeats = getAlivePlayers(gameState);
  const goodCount = aliveSeats.filter(seat => seat.alignment === 'good').length;
  const evilCount = aliveSeats.filter(seat => seat.alignment === 'evil').length;
  
  return {
    goodCount,
    evilCount,
    atParity: goodCount <= evilCount
  };
}

export function isValidTarget(gameState: GameState, actorId: SeatId, targetId: SeatId, targetExpression: string): boolean {
  // Simple target validation - in production, implement full DSL parser
  const actor = getSeatById(gameState, actorId);
  const target = getSeatById(gameState, targetId);
  
  if (!actor || !target) return false;
  
  // Basic rules
  if (targetExpression.includes('seat!=self') && actorId === targetId) {
    return false;
  }
  
  if (targetExpression.includes('alive') && !target.isAlive) {
    return false;
  }
  
  return true;
}

export function maskGameStateForSeat(gameState: GameState, seatId: SeatId): Partial<GameState> {
  const seat = getSeatById(gameState, seatId);
  if (!seat) throw new Error('Seat not found');
  
  // Return a masked version that only includes public information and own seat details
  const withTallies = (p: any) => {
    const voteVals = Object.values(p.votes || {}) as boolean[];
    const yes = voteVals.filter(Boolean).length;
    const no = voteVals.length - yes;
    const diffs = Object.values(p.difficultyVotes || {}) as string[];
    const diffCounts: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const d of diffs) if (diffCounts[d] !== undefined) diffCounts[d]++;
    return {
      id: p.id,
      scriptId: p.scriptId,
      proposedBy: p.proposedBy,
      votes: {},
      difficultyVotes: {},
      createdAt: p.createdAt,
      tallies: { yes, no, difficulty: diffCounts }
    };
  };
  return {
    id: gameState.id,
    phase: gameState.phase,
    day: gameState.day,
  gameName: (gameState as any).gameName,
  storytellerSeatId: (gameState as any).storytellerSeatId,
  // Publicly visible list of scripts the storyteller has made available
  availableScriptIds: (gameState as any).availableScriptIds || [],
    seats: gameState.seats.map(s => ({
      ...s,
      // Hide alignment and role for other players
      alignment: s.id === seatId ? s.alignment : undefined,
      role: s.id === seatId ? s.role : undefined
    })),
    // Don't include abilities that this seat shouldn't know about
    abilities: gameState.abilities.filter(ability => 
      ability.actorSeat === seatId || 
      // Include publicly known abilities
      false
    ),
    scriptId: gameState.scriptId,
  // Show proposals with aggregate tallies only
  scriptProposals: gameState.scriptProposals?.map(withTallies) || [],
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt
  };
}

export function maskGameStatePublic(gameState: GameState): Partial<GameState> {
  const withTallies = (p: any) => {
    const voteVals = Object.values(p.votes || {}) as boolean[];
    const yes = voteVals.filter(Boolean).length;
    const no = voteVals.length - yes;
    const diffs = Object.values(p.difficultyVotes || {}) as string[];
    const diffCounts: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const d of diffs) if (diffCounts[d] !== undefined) diffCounts[d]++;
    return {
      id: p.id,
      scriptId: p.scriptId,
      proposedBy: p.proposedBy,
      votes: {},
      difficultyVotes: {},
      createdAt: p.createdAt,
      tallies: { yes, no, difficulty: diffCounts }
    };
  };
  return {
    id: gameState.id,
    phase: gameState.phase,
    day: gameState.day,
  gameName: (gameState as any).gameName,
  storytellerSeatId: (gameState as any).storytellerSeatId,
  // Publicly visible list of scripts the storyteller has made available
  availableScriptIds: (gameState as any).availableScriptIds || [],
    seats: gameState.seats.map(s => ({
      id: s.id,
      playerId: s.playerId,
      isNPC: s.isNPC,
      position: s.position,
      statuses: s.statuses,
      isAlive: s.isAlive,
      votingPower: s.votingPower
    })),
    createdAt: gameState.createdAt,
    updatedAt: gameState.updatedAt,
    scriptId: gameState.scriptId,
  // expose proposals with tallies only
  scriptProposals: gameState.scriptProposals?.map(withTallies) || []
  } as Partial<GameState>;
}

export function isStorytellerSeat(gameState: GameState, seatId?: SeatId): boolean {
  return !!seatId && gameState.storytellerSeatId === seatId;
}
