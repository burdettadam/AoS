import { GameState, GamePhase, Event, SeatId, GameId } from '@botc/shared';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { RulesEngine } from './rules';
import { ScriptLoader } from './script-loader';
import { SetupManager } from './setup-manager';

export class GameEngine {
  private games: Map<GameId, GameState> = new Map();
  private events: Map<GameId, Event[]> = new Map();
  private rulesEngine: RulesEngine;
  private scriptLoader: ScriptLoader;
  private setupManager: SetupManager;
  // Ephemeral per-game context not persisted in GameState schema
  private context: Map<GameId, Record<string, any>> = new Map();

  constructor() {
    this.rulesEngine = new RulesEngine();
    this.scriptLoader = new ScriptLoader();
    this.setupManager = new SetupManager();
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
    // initialize day fields not yet in published type (during dev)
    (gameState as any).currentNomination = undefined;
    (gameState as any).currentVote = undefined;

    this.games.set(gameId, gameState);
    this.events.set(gameId, []);
  this.context.set(gameId, { hasExecutedToday: false });

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

    // Transition to setup phase first
    await this.changePhase(gameId, GamePhase.SETUP);
    
    // Initialize setup if not already done
    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) {
      logger.error(`Failed to load script ${game.scriptId}`);
      return false;
    }

    this.setupManager.initializeSetup(game, script);

    logger.info(`Started setup for game ${gameId} with ${game.seats.length} players`);
    return true;
  }

  /**
   * Storyteller enters setup phase from lobby
   */
  async enterSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<{ ok: true } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can enter setup' };
    if (game.phase !== GamePhase.LOBBY) return { ok: false, error: 'Can only enter setup from lobby' };

    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) return { ok: false, error: 'Failed to load script' };

    await this.changePhase(gameId, GamePhase.SETUP);
    this.setupManager.initializeSetup(game, script);

    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'phase_changed',
      timestamp: new Date(),
      actorId: storytellerSeatId,
      payload: { oldPhase: GamePhase.LOBBY, newPhase: GamePhase.SETUP }
    });

    return { ok: true };
  }

  /**
   * Storyteller selects characters during setup
   */
  async selectSetupCharacters(
    gameId: GameId, 
    storytellerSeatId: SeatId, 
    characterIds: string[]
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can select characters' };
    if (game.phase !== GamePhase.SETUP) return { ok: false, error: 'Can only select characters during setup' };

    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) return { ok: false, error: 'Failed to load script' };

    const result = this.setupManager.selectCharacters(game, script, characterIds, storytellerSeatId);
    if (!result.success) {
      return { ok: false, error: result.error! };
    }

    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'setup_characters_selected',
      timestamp: new Date(),
      actorId: storytellerSeatId,
      payload: { characterIds }
    });

    return { ok: true };
  }

  /**
   * Validate current setup
   */
  async validateSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<{ ok: true } | { ok: false; error: string; details?: string[] }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can validate setup' };
    if (game.phase !== GamePhase.SETUP) return { ok: false, error: 'Can only validate during setup' };

    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) return { ok: false, error: 'Failed to load script' };

    const validation = this.setupManager.validateSetup(game, script);
    
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'setup_validated',
      timestamp: new Date(),
      actorId: storytellerSeatId,
      payload: { isValid: validation.isValid, errors: validation.errors }
    });

    if (!validation.isValid) {
      return { ok: false, error: 'Setup validation failed', details: validation.errors };
    }

    return { ok: true };
  }

  /**
   * Complete setup and start the game (move to Night phase)
   */
  async completeSetup(gameId: GameId, storytellerSeatId: SeatId): Promise<{ ok: true } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can complete setup' };
    if (game.phase !== GamePhase.SETUP) return { ok: false, error: 'Can only complete setup from setup phase' };

    const script = await this.scriptLoader.loadScript(game.scriptId);
    if (!script) return { ok: false, error: 'Failed to load script' };

    // Complete setup process
    const setupResult = this.setupManager.completeSetup(game, script);
    if (!setupResult.success) {
      return { ok: false, error: setupResult.error! };
    }

    // Assign roles using the character pool from setup
    const success = await this.rulesEngine.assignRolesFromSetup(game, script);
    if (!success) {
      logger.error(`Failed to assign roles for game ${gameId}`);
      return { ok: false, error: 'Failed to assign roles' };
    }

    // Transition to night phase
    await this.changePhase(gameId, GamePhase.NIGHT);
    game.day = 1;
    this.getContext(gameId).hasExecutedToday = false;

    logger.info(`Completed setup and started game ${gameId} with ${game.seats.length} players`);
    return { ok: true };
  }

  async startGameOriginal(gameId: GameId): Promise<boolean> {
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
    this.getContext(gameId).hasExecutedToday = false;

    logger.info(`Started game ${gameId} with ${game.seats.length} players`);
    return true;
  }

  /**
   * Storyteller manual advance to next phase in the standard cycle.
   */
  async advancePhase(gameId: GameId, storytellerSeatId: SeatId): Promise<{ ok: true } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can advance phase' };
    if (game.phase === GamePhase.END) return { ok: false, error: 'Game already ended' };

  const next = this.getNextPhase(game.phase);
    if (!next) return { ok: false, error: 'No next phase from current phase' };

    // Side-effects around boundaries
    // After EXECUTION, move to NIGHT and increment day
    if (game.phase === GamePhase.EXECUTION && next === GamePhase.NIGHT) {
      game.day += 1;
      this.getContext(gameId).hasExecutedToday = false;
    }

  // Validate preconditions before allowing transition
  const preCheck = this.validatePreconditions(game, next);
  if (!preCheck.ok) return { ok: false, error: preCheck.error };

  await this.changePhase(gameId, next);

    // Validate after phase change
    const issues = this.validateGameState(game);
    if (issues.length > 0) {
      logger.warn(`Validation issues after phase change: ${issues.join('; ')}`);
      this.addEvent(gameId, {
        id: randomUUID(),
        gameId,
        type: 'phase_changed',
        timestamp: new Date(),
        payload: { oldPhase: game.phase, newPhase: next, validationIssues: issues }
      });
    }

    return { ok: true };
  }

  /**
   * Storyteller manual set to a specific next phase or END.
   * Only allows moving to the immediate next phase or to END.
   */
  async setPhase(gameId: GameId, storytellerSeatId: SeatId, target: GamePhase): Promise<{ ok: true } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can set phase' };
    if (game.phase === target) return { ok: true };
    if (target === GamePhase.LOBBY) return { ok: false, error: 'Cannot return to lobby' };

    const next = this.getNextPhase(game.phase);
    if (target !== next && target !== GamePhase.END) {
      return { ok: false, error: `Invalid phase transition ${game.phase} -> ${target}` };
    }

  if (game.phase === GamePhase.EXECUTION && target === GamePhase.NIGHT) {
      game.day += 1;
      this.getContext(gameId).hasExecutedToday = false;
    }

  // Validate preconditions before allowing transition
  const preCheck = this.validatePreconditions(game, target);
  if (!preCheck.ok) return { ok: false, error: preCheck.error };

  await this.changePhase(gameId, target);
    const issues = this.validateGameState(game);
    if (issues.length > 0) {
      logger.warn(`Validation issues after set phase: ${issues.join('; ')}`);
      this.addEvent(gameId, {
        id: randomUUID(),
        gameId,
        type: 'phase_changed',
        timestamp: new Date(),
        payload: { oldPhase: game.phase, newPhase: target, validationIssues: issues }
      });
    }

    return { ok: true };
  }

  /**
   * End the game immediately (Storyteller only).
   */
  async endGame(gameId: GameId, storytellerSeatId: SeatId): Promise<{ ok: true } | { ok: false; error: string }> {
    return this.setPhase(gameId, storytellerSeatId, GamePhase.END);
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
      payload: { oldPhase, newPhase, day: game.day }
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

  // -------- Helpers: validation & context --------

  private getNextPhase(current: GamePhase): GamePhase | null {
    switch (current) {
      case GamePhase.LOBBY:
        return GamePhase.SETUP;
      case GamePhase.SETUP:
        return GamePhase.NIGHT;
      case GamePhase.NIGHT:
        return GamePhase.DAY;
      case GamePhase.DAY:
        return GamePhase.NOMINATION;
      case GamePhase.NOMINATION:
        return GamePhase.VOTE;
      case GamePhase.VOTE:
        return GamePhase.EXECUTION;
      case GamePhase.EXECUTION:
        return GamePhase.NIGHT;
      case GamePhase.END:
        return null;
      default:
        return null;
    }
  }

  private isStoryteller(game: GameState, seatId?: SeatId): boolean {
    return !!seatId && game.storytellerSeatId === seatId;
  }

  private getContext(gameId: GameId): Record<string, any> {
    if (!this.context.has(gameId)) this.context.set(gameId, {});
    return this.context.get(gameId)!;
  }

  /**
   * Validate critical invariants of the game state.
   */
  validateGameState(game: GameState): string[] {
    const issues: string[] = [];
    // Unique seat IDs
    const ids = new Set<string>();
    for (const s of game.seats) {
      if (ids.has(s.id)) issues.push(`Duplicate seat id ${s.id}`);
      ids.add(s.id);
    }
    // Storyteller seat (if set) must exist
    if (game.storytellerSeatId && !game.seats.some(s => s.id === game.storytellerSeatId)) {
      issues.push('storytellerSeatId does not match any seat');
    }
    // Day number non-negative
    if (game.day < 0) issues.push('day must be >= 0');
    // Roles assigned after lobby
    if (game.phase !== GamePhase.LOBBY) {
      const unassigned = game.seats.filter(s => !s.role || !s.alignment);
      if (unassigned.length > 0) issues.push(`unassigned roles for ${unassigned.length} seat(s)`);
    }
    return issues;
  }

  /**
   * Phase preconditions validation for transitions.
   */
  private validatePreconditions(game: GameState, target: GamePhase): { ok: true } | { ok: false; error: string } {
    // From Lobby -> Setup: ensure storyteller is assigned
    if (target === GamePhase.SETUP) {
      if (game.phase !== GamePhase.LOBBY) return { ok: false, error: 'Can only enter setup from lobby' };
      if (!game.storytellerSeatId) return { ok: false, error: 'Storyteller must be assigned before setup' };
    }
    
    // From Setup -> Night: ensure setup is completed and validated
    if (target === GamePhase.NIGHT) {
      if (game.phase === GamePhase.SETUP) {
        if (!game.setupState || !game.setupState.isValidated) {
          return { ok: false, error: 'Setup must be validated before starting game' };
        }
        if (!game.setupState.characterPool || game.setupState.characterPool.length === 0) {
          return { ok: false, error: 'Character pool must be created before starting game' };
        }
      }
    }

    // From Day -> Nomination: ensure no ongoing vote; clear last nomination if closed
    if (target === GamePhase.NOMINATION) {
      if (game.phase !== GamePhase.DAY) return { ok: false, error: 'Can only nominate during Day' };
      if ((game as any).currentVote && !(game as any).currentVote.finished) return { ok: false, error: 'Cannot move to nomination while a vote is active' };
    }
    // From Nomination -> Vote: must have a current nomination
    if (target === GamePhase.VOTE) {
      if (!(game as any).currentNomination || (game as any).currentNomination.closed) return { ok: false, error: 'No open nomination to vote on' };
    }
    // From Vote -> Execution: must have a finished vote
    if (target === GamePhase.EXECUTION) {
      if (!(game as any).currentVote || !(game as any).currentVote.finished) return { ok: false, error: 'No finished vote to execute' };
    }
    // From Execution -> Night: ok; cleanup day artifacts
    if (target === GamePhase.NIGHT && game.phase === GamePhase.EXECUTION) {
      (game as any).currentNomination = undefined;
      (game as any).currentVote = undefined;
    }
    return { ok: true };
  }

  // ------- Day mechanics: nomination & voting -------

  nominate(gameId: GameId, nominator: SeatId, nominee: SeatId): { ok: true; nominationId: string } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (game.phase !== GamePhase.NOMINATION && game.phase !== GamePhase.DAY) return { ok: false, error: 'Not in nomination phase' };
    if (!game.seats.some(s => s.id === nominator) || !game.seats.some(s => s.id === nominee)) return { ok: false, error: 'Invalid seats' };
    if (!game.seats.find(s => s.id === nominator)?.isAlive) return { ok: false, error: 'Nominator is dead' };
    if (!game.seats.find(s => s.id === nominee)?.isAlive) return { ok: false, error: 'Nominee is dead' };
    // Only one open nomination at a time
  if ((game as any).currentNomination && !(game as any).currentNomination.closed) return { ok: false, error: 'Nomination already open' };

    const nominationId = randomUUID();
  (game as any).currentNomination = { id: nominationId, nominator, nominee, createdAt: new Date(), closed: false } as any;
    game.updatedAt = new Date();
    this.addEvent(gameId, { id: randomUUID(), gameId, type: 'nomination_made' as any, timestamp: new Date(), actorId: nominator, payload: { nominee } });
    return { ok: true, nominationId };
  }

  startVote(gameId: GameId, storytellerSeatId: SeatId): { ok: true } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can start vote' };
    if (game.phase !== GamePhase.VOTE) return { ok: false, error: 'Not in vote phase' };
  if (!(game as any).currentNomination || (game as any).currentNomination.closed) return { ok: false, error: 'No open nomination' };
  if ((game as any).currentVote && !(game as any).currentVote.finished) return { ok: false, error: 'Vote already in progress' };

  (game as any).currentNomination.closed = true as any;
  ;(game as any).currentVote = { nominationId: (game as any).currentNomination.id, startedAt: new Date(), votes: [], tally: { yes: 0, no: 0 }, finished: false } as any;
    game.updatedAt = new Date();
    this.addEvent(gameId, { id: randomUUID(), gameId, type: 'vote_cast', timestamp: new Date(), payload: { started: true } });
    return { ok: true };
  }

  castVote(gameId: GameId, voter: SeatId, vote: boolean): { ok: true } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (game.phase !== GamePhase.VOTE) return { ok: false, error: 'Not in vote phase' };
  if (!(game as any).currentVote || (game as any).currentVote.finished) return { ok: false, error: 'No active vote' };
    const seat = game.seats.find(s => s.id === voter);
    if (!seat || !seat.isAlive) return { ok: false, error: 'Invalid voter' };

    // Prevent duplicate votes
  if ((game as any).currentVote.votes.some((v: any) => v.voter === voter)) return { ok: false, error: 'Already voted' };
  (game as any).currentVote.votes.push({ voter, vote, timestamp: new Date() } as any);
  if (vote) (game as any).currentVote.tally.yes += seat.votingPower; else (game as any).currentVote.tally.no += seat.votingPower;
    this.addEvent(gameId, { id: randomUUID(), gameId, type: 'vote_cast', timestamp: new Date(), actorId: voter, payload: { vote } });
    game.updatedAt = new Date();
    return { ok: true };
  }

  finishVote(gameId: GameId, storytellerSeatId: SeatId): { ok: true; executed: boolean; nominee?: SeatId } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' } as any;
    if (!this.isStoryteller(game, storytellerSeatId)) return { ok: false, error: 'Only storyteller can finish vote' } as any;
    if (game.phase !== GamePhase.VOTE) return { ok: false, error: 'Not in vote phase' } as any;
    if (!(game as any).currentVote || !(game as any).currentNomination || (game as any).currentVote.finished) return { ok: false, error: 'No active vote' } as any;

    (game as any).currentVote.finished = true as any;
    const executed = (game as any).currentVote.tally.yes > (game as any).currentVote.tally.no;
    if (executed) {
      const nomineeSeat = game.seats.find(s => s.id === (game as any).currentNomination!.nominee);
      if (nomineeSeat) nomineeSeat.isAlive = false;
      this.addEvent(gameId, { id: randomUUID(), gameId, type: 'execution_occurred', timestamp: new Date(), payload: { seatId: nomineeSeat?.id, tally: (game as any).currentVote.tally } });
      this.getContext(gameId).hasExecutedToday = true;
    }
    game.updatedAt = new Date();
    return { ok: true, executed, nominee: (game as any).currentNomination.nominee } as any;
  }
}
