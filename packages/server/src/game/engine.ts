import { GameState, GamePhase, Event, SeatId, GameId } from '@botc/shared';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { RulesEngine } from './rules';
import { ScriptLoader } from './script-loader';

export class GameEngine {
  private games: Map<GameId, GameState> = new Map();
  private events: Map<GameId, Event[]> = new Map();
  private rulesEngine: RulesEngine;
  private scriptLoader: ScriptLoader;

  constructor() {
    this.rulesEngine = new RulesEngine();
    this.scriptLoader = new ScriptLoader();
  }

  async createGame(scriptId: string = 'trouble-brewing'): Promise<GameId> {
    const gameId = randomUUID() as GameId;
    const seed = this.generateSeed();
    
  const gameState: GameState = {
      id: gameId,
      phase: GamePhase.LOBBY,
      day: 0,
      seed,
      scriptId,
      seats: [],
      abilities: [],
  storytellerSeatId: undefined as any,
  scriptProposals: [] as any,
  selectedRoles: undefined as any,
  roleClaims: {} as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.games.set(gameId, gameState);
    this.events.set(gameId, []);

    logger.info(`Created game ${gameId} with script ${scriptId}`);
    
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'game_created',
      timestamp: new Date(),
      payload: { scriptId, seed }
    });

    return gameId;
  }

  getGame(gameId: GameId): GameState | undefined {
    return this.games.get(gameId);
  }

  getGameEvents(gameId: GameId): Event[] {
    return this.events.get(gameId) || [];
  }

  async addPlayer(gameId: GameId, playerId: string, isNPC: boolean = false): Promise<SeatId | null> {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) {
      return null;
    }

  const seatId = randomUUID() as SeatId;
    const position = game.seats.length;

    const seat = {
      id: seatId,
      playerId: isNPC ? undefined : playerId,
      isNPC,
      position,
      statuses: [],
      isAlive: true,
      votingPower: 1
    } as any;

    // First human player becomes storyteller by default
    if (!isNPC && !(game as any).storytellerSeatId) {
      seat.isStoryteller = true;
      (game as any).storytellerSeatId = seatId;
    }

    game.seats.push(seat);

    game.updatedAt = new Date();

  this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'player_joined',
      timestamp: new Date(),
      actorId: seatId,
      payload: { playerId, isNPC, position }
    });

    logger.info(`Player ${playerId} joined game ${gameId} as seat ${seatId}`);
  return seatId;
  }

  proposeScript(gameId: GameId, proposer: SeatId, scriptId: string): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
    const proposal = {
      id: randomUUID(),
      scriptId,
      proposedBy: proposer,
      votes: {},
      createdAt: new Date()
    };
  (game as any).scriptProposals.push(proposal as any);
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'script_proposed' as any,
      timestamp: new Date(),
      actorId: proposer,
      payload: { proposal }
    });
    return true;
  }

  voteOnScript(gameId: GameId, voterSeat: SeatId, proposalId: string, vote: boolean): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
  const proposal = (game as any).scriptProposals.find((p: any) => p.id === proposalId);
    if (!proposal) return false;
    (proposal.votes as any)[voterSeat] = vote;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'script_vote' as any,
      timestamp: new Date(),
      actorId: voterSeat,
      payload: { proposalId, vote }
    });
    // Simple rule: if >50% of occupied seats vote yes, select script
    const total = game.seats.length;
    const yes = Object.values(proposal.votes).filter(Boolean).length;
    if (yes > total / 2) {
      game.scriptId = proposal.scriptId;
      this.addEvent(gameId, {
        id: randomUUID(),
        gameId,
        type: 'script_selected' as any,
        timestamp: new Date(),
        actorId: voterSeat,
        payload: { scriptId: proposal.scriptId }
      });
    }
    return true;
  }

  selectRoles(gameId: GameId, storytellerSeatId: SeatId, roleIds: string[]): boolean {
    const game = this.games.get(gameId);
  if (!game || game.phase !== GamePhase.LOBBY) return false;
  if ((game as any).storytellerSeatId !== storytellerSeatId) return false;
  (game as any).selectedRoles = roleIds;
  game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'roles_selected' as any,
      timestamp: new Date(),
      actorId: storytellerSeatId,
      payload: { roleIds }
    });
    return true;
  }

  claimRole(gameId: GameId, seatId: SeatId, roleId: string): boolean {
  const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
    // Ensure seat exists
    if (!game.seats.some(s => s.id === seatId)) return false;
    // Ensure role available
  const pool = (game as any).selectedRoles && (game as any).selectedRoles.length > 0 ? (game as any).selectedRoles as string[] : undefined;
    if (pool && !pool.includes(roleId)) return false;
    // Ensure not already claimed
  (game as any).roleClaims = (game as any).roleClaims || {} as any;
  if (Object.values((game as any).roleClaims as Record<string, string>).includes(roleId)) return false;
  ((game as any).roleClaims as any)[seatId] = roleId;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'chat_message',
      timestamp: new Date(),
      actorId: seatId,
      payload: { system: true, text: `Seat claimed role ${roleId}` }
    });
    return true;
  }

  listScripts(): Array<{ id: string; name: string; version: string }> {
    return (this.scriptLoader as any).listScripts();
  }

  async getScript(scriptId: string) {
    return this.scriptLoader.loadScript(scriptId);
  }

  async claimRandomRole(gameId: GameId, seatId: SeatId): Promise<string | null> {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return null;
    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) return null;
    const pool = ((game as any).selectedRoles && (game as any).selectedRoles.length > 0)
      ? new Set((game as any).selectedRoles as string[])
      : new Set(script.roles.map((r: any) => r.id as string));
    // Remove already claimed
    if ((game as any).roleClaims) {
      for (const rid of Object.values((game as any).roleClaims as Record<string, string>)) pool.delete(rid as any);
    }
    const remaining = Array.from(pool);
    if (remaining.length === 0) return null;
  const pick: string = remaining[Math.floor(Math.random() * remaining.length)] as string;
  return this.claimRole(gameId, seatId, pick) ? pick : null;
  }

  async startGame(gameId: GameId): Promise<boolean> {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) {
      return false;
    }

    // Load script and assign roles
    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) {
      logger.error(`Failed to load script ${game.scriptId}`);
      return false;
    }

    // Assign roles using rules engine
    const success = await this.rulesEngine.assignRoles(game, script);
    if (!success) {
      logger.error(`Failed to assign roles for game ${gameId}`);
      return false;
    }

    // Transition to night phase
    await this.changePhase(gameId, GamePhase.NIGHT);
    game.day = 1;

    logger.info(`Started game ${gameId} with ${game.seats.length} players`);
    return true;
  }

  private async changePhase(gameId: GameId, newPhase: GamePhase): Promise<void> {
    const game = this.games.get(gameId);
    if (!game) return;

    const oldPhase = game.phase;
    game.phase = newPhase;
    game.updatedAt = new Date();

    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'phase_changed',
      timestamp: new Date(),
      payload: { oldPhase, newPhase }
    });
  }

  private addEvent(gameId: GameId, event: Event): void {
    const events = this.events.get(gameId);
    if (events) {
      events.push(event);
    }
  }

  private generateSeed(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Get all active games
  getActiveGames(): GameState[] {
    return Array.from(this.games.values());
  }

  // Cleanup finished games
  cleanupGame(gameId: GameId): void {
    this.games.delete(gameId);
    this.events.delete(gameId);
    logger.info(`Cleaned up game ${gameId}`);
  }
}
