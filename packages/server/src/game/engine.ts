import { GameState, GamePhase, Event, SeatId, GameId } from '@botc/shared';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { RulesEngine } from './rules';
import { ScriptLoader } from './script-loader';
import { SetupManager } from './setup-manager';
import { NightOrderProcessor } from './night-order-processor';
import { ActionSystem } from './action-system';
import { ValidationSystem } from './validation-system';

export class GameEngine {
  private games: Map<GameId, GameState> = new Map();
  private events: Map<GameId, Event[]> = new Map();
  private rulesEngine: RulesEngine;
  private scriptLoader: ScriptLoader;
  private setupManager: SetupManager;
  private nightOrderProcessor: NightOrderProcessor;
  private actionSystem: ActionSystem;
  private validationSystem: ValidationSystem;
  // Ephemeral per-game context not persisted in GameState schema
  private context: Map<GameId, Record<string, any>> = new Map();

  constructor() {
    this.rulesEngine = new RulesEngine();
    this.scriptLoader = new ScriptLoader();
    this.setupManager = new SetupManager();
    this.nightOrderProcessor = new NightOrderProcessor(this.scriptLoader);
    this.actionSystem = new ActionSystem();
    this.validationSystem = new ValidationSystem();
  }

  async createGame(scriptId: string = 'trouble-brewing', options?: { isPublic?: boolean }): Promise<GameId> {
    const gameId = randomUUID() as GameId;
    const seed = this.generateSeed();
    
  const gameState: GameState = {
      id: gameId,
      phase: GamePhase.LOBBY,
      day: 0,
      seed,
      scriptId,
      isPublic: options?.isPublic ?? true,
      seats: [],
      abilities: [],
  storytellerSeatId: undefined as any,
  availableScriptIds: [],
  scriptProposals: [],
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

  /** Set a human-friendly game name (host only in lobby) */
  setGameName(gameId: GameId, storytellerSeatId: SeatId, name: string): { ok: true } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (game.phase !== GamePhase.LOBBY) return { ok: false, error: 'Cannot rename after lobby' };
    if (!game.storytellerSeatId || game.storytellerSeatId !== storytellerSeatId) return { ok: false, error: 'Only storyteller can set name' };
    const trimmed = (name || '').trim();
    if (!trimmed) return { ok: false, error: 'Name required' };
    if (trimmed.length > 60) return { ok: false, error: 'Name too long' };
    (game as any).gameName = trimmed;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'chat_message' as any,
      timestamp: new Date(),
      payload: { system: true, text: `Game named: ${trimmed}` }
    });
    return { ok: true };
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

    // If a non-NPC with the same playerId already exists in the lobby, reuse that seat
    if (!isNPC) {
      const existing = game.seats.find(s => !s.isNPC && s.playerId === playerId);
      if (existing) {
        logger.info(`Player ${playerId} already in game ${gameId} as seat ${existing.id}, reusing seat`);
        return existing.id as SeatId;
      }
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

  /** Remove a player from a lobby. Only allowed in LOBBY phase. */
  removePlayer(gameId: GameId, seatId: SeatId): { ok: true } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (game.phase !== GamePhase.LOBBY) return { ok: false, error: 'Can only leave during lobby' };
    const index = game.seats.findIndex(s => s.id === seatId);
    if (index === -1) return { ok: false, error: 'Seat not found' };

    const wasStoryteller = game.storytellerSeatId === seatId;
    // Remove seat
    game.seats.splice(index, 1);
    // Re-number positions
    game.seats.forEach((s, i) => { (s as any).position = i; });
    // Reassign storyteller if needed
    if (wasStoryteller) {
      const nextHuman = game.seats.find(s => !s.isNPC && !!s.playerId);
      (game as any).storytellerSeatId = nextHuman ? nextHuman.id : undefined;
      for (const s of game.seats) (s as any).isStoryteller = nextHuman ? s.id === nextHuman.id : false;
    }
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'player_left' as any,
      timestamp: new Date(),
      actorId: seatId,
      payload: { seatId }
    });
    logger.info(`Seat ${seatId} left game ${gameId}`);
    return { ok: true };
  }

  proposeScript(gameId: GameId, proposer: SeatId, scriptId: string, active: boolean = true): string | null {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return null;
    const proposals = ((game as any).scriptProposals ??= [] as any[]);
    let proposal = proposals.find((p: any) => p.scriptId === scriptId);

    if (active) {
      if (!proposal) {
        proposal = {
          id: randomUUID(),
          scriptId,
          proposers: [proposer],
          votes: {},
          difficultyVotes: {},
          createdAt: new Date()
        };
        proposals.push(proposal);
      } else {
        proposal.proposers = Array.isArray(proposal.proposers) ? proposal.proposers : [proposal.proposedBy].filter(Boolean);
        if (!proposal.proposers.includes(proposer)) {
          proposal.proposers.push(proposer);
        }
      }
      (proposal.votes as Record<string, boolean>)[proposer] = true;
    } else {
      if (!proposal) {
        return null;
      }
      proposal.proposers = Array.isArray(proposal.proposers) ? proposal.proposers : [proposal.proposedBy].filter(Boolean);
      proposal.proposers = proposal.proposers.filter((seat: SeatId) => seat !== proposer);
      if (proposal.votes) delete proposal.votes[proposer as any];
      if (proposal.difficultyVotes) delete proposal.difficultyVotes[proposer as any];
    }

    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'script_proposed' as any,
      timestamp: new Date(),
      actorId: proposer,
      payload: { scriptId, proposalId: proposal?.id, active }
    });

    if (proposal) {
      this.evaluateScriptSelection(game, proposal);
      this.pruneProposalIfEmpty(game, proposal);
      return proposal.id;
    }
    return null;
  }

  voteOnScript(gameId: GameId, voterSeat: SeatId, proposalId: string, vote: boolean | null | undefined): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
    const proposals = (game as any).scriptProposals ?? [];
    const proposal = proposals.find((p: any) => p.id === proposalId);
    if (!proposal) return false;

    proposal.votes = proposal.votes || {};
    if (vote === null || vote === undefined) {
      delete proposal.votes[voterSeat as any];
    } else {
      (proposal.votes as Record<string, boolean>)[voterSeat as any] = !!vote;
    }

    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'script_vote' as any,
      timestamp: new Date(),
      actorId: voterSeat,
      payload: { proposalId, vote }
    });

    this.evaluateScriptSelection(game, proposal);
    this.pruneProposalIfEmpty(game, proposal);

    return true;
  }

  private evaluateScriptSelection(game: GameState, proposal: any) {
    if (!proposal || !proposal.votes) return;
    const yes = Object.values(proposal.votes).filter(Boolean).length;
    const total = game.seats.length;
    if (yes > total / 2) {
      if (game.scriptId !== proposal.scriptId) {
        game.scriptId = proposal.scriptId;
        this.addEvent(game.id, {
          id: randomUUID(),
          gameId: game.id,
          type: 'script_selected' as any,
          timestamp: new Date(),
          payload: { scriptId: proposal.scriptId }
        });
      }
    }
  }

  private pruneProposalIfEmpty(game: GameState, proposal: any) {
    const votesCount = proposal?.votes ? Object.keys(proposal.votes).length : 0;
    const difficultyCount = proposal?.difficultyVotes ? Object.keys(proposal.difficultyVotes).length : 0;
    const proposerCount = Array.isArray(proposal?.proposers) ? proposal.proposers.length : (proposal?.proposedBy ? 1 : 0);
    if (proposerCount === 0 && votesCount === 0 && difficultyCount === 0) {
      const proposals = (game as any).scriptProposals as any[];
      const idx = proposals.findIndex((p: any) => p.id === proposal.id);
      if (idx >= 0) {
        proposals.splice(idx, 1);
      }
    }
  }

  // Difficulty vote (storyteller-only visibility) does not auto-select; it aggregates preferences
  voteScriptDifficulty(gameId: GameId, voterSeat: SeatId, proposalId: string, difficulty: 'beginner'|'intermediate'|'advanced'): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
    const proposal = (game as any).scriptProposals.find((p: any) => p.id === proposalId);
    if (!proposal) return false;
    (proposal.difficultyVotes as any)[voterSeat] = difficulty;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'script_vote' as any,
      timestamp: new Date(),
      actorId: voterSeat,
      payload: { proposalId, difficulty }
    });
    return true;
  }

  // Storyteller reassignment
  setStoryteller(gameId: GameId, setterSeat: SeatId, targetSeat: SeatId): { ok: true } | { ok: false; error: string } {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return { ok: false, error: 'Can only set storyteller in lobby' };
    if (game.storytellerSeatId !== setterSeat) return { ok: false, error: 'Only current storyteller can assign storyteller' };
    if (!game.seats.some(s => s.id === targetSeat)) return { ok: false, error: 'Invalid target seat' };
    (game as any).storytellerSeatId = targetSeat;
    // Clear old flag, set new if we store isStoryteller on seats
    for (const s of game.seats) (s as any).isStoryteller = s.id === targetSeat;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'storyteller_changed' as any,
      timestamp: new Date(),
      actorId: setterSeat,
      payload: { storytellerSeatId: targetSeat }
    });
    return { ok: true };
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

  // Update which scripts the storyteller has made available to players
  setAvailableScripts(gameId: GameId, storytellerSeatId: SeatId, scriptIds: string[]): boolean {
    const game = this.games.get(gameId);
    if (!game || game.phase !== GamePhase.LOBBY) return false;
    if ((game as any).storytellerSeatId !== storytellerSeatId) return false;
    (game as any).availableScriptIds = scriptIds;
    game.updatedAt = new Date();
    this.addEvent(gameId, {
      id: randomUUID(),
      gameId,
      type: 'available_scripts_updated' as any,
      timestamp: new Date(),
      actorId: storytellerSeatId,
      payload: { scriptIds }
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

  await this.setupManager.initializeSetup(game, script);

    const playerCount = game.seats.filter(seat => seat.id !== (game as any).storytellerSeatId).length;
    logger.info(`Started setup for game ${gameId} with ${playerCount} players`);
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
  await this.setupManager.initializeSetup(game, script);

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

  // Get only public games that can be joined
  getPublicGames(): GameState[] {
    return Array.from(this.games.values()).filter(game => 
      game.isPublic && game.phase === GamePhase.LOBBY
    );
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

  // === New Action System Methods ===

  /**
   * Execute the night order for a game
   */
  async executeNightOrder(gameId: GameId, isFirstNight: boolean = false): Promise<{ ok: true; results: any[] } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };
    if (game.phase !== GamePhase.NIGHT) return { ok: false, error: 'Not in night phase' };

    try {
      const { results, events } = await this.nightOrderProcessor.executeNightOrder(game, isFirstNight);
      
      // Add events to game
      events.forEach(event => this.addEvent(gameId, event));
      
      game.updatedAt = new Date();
      return { ok: true, results };
    } catch (error) {
      logger.error(`Failed to execute night order for game ${gameId}:`, error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get the night order preview for a game
   */
  async getNightOrderPreview(gameId: GameId, isFirstNight: boolean = false): Promise<any[] | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      return await this.nightOrderProcessor.previewNightOrder(game, isFirstNight);
    } catch (error) {
      logger.error(`Failed to get night order preview for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Get active characters for the current night phase
   */
  async getActiveCharacters(gameId: GameId, isFirstNight: boolean = false): Promise<any[] | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      return await this.nightOrderProcessor.getActiveCharacters(game, isFirstNight);
    } catch (error) {
      logger.error(`Failed to get active characters for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Validate the script used by a game
   */
  async validateGameScript(gameId: GameId): Promise<any | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      return await this.scriptLoader.validateScript(game.scriptId);
    } catch (error) {
      logger.error(`Failed to validate script for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Get character actions for a specific character in the game
   */
  async getCharacterActions(gameId: GameId, characterId: string, phase: 'firstNight' | 'otherNights' | 'day'): Promise<any[] | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      return await this.scriptLoader.getCharacterActions(game.scriptId, characterId, phase);
    } catch (error) {
      logger.error(`Failed to get character actions for ${characterId} in game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Get meta actions for the script
   */
  async getMetaActions(gameId: GameId): Promise<any[] | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      return await this.scriptLoader.getMetaActions(game.scriptId);
    } catch (error) {
      logger.error(`Failed to get meta actions for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Generate a validation report for the game's script
   */
  async generateValidationReport(gameId: GameId): Promise<string | null> {
    const game = this.games.get(gameId);
    if (!game) return null;

    try {
      const validationResult = await this.scriptLoader.validateScript(game.scriptId);
      return this.validationSystem.generateReport(validationResult);
    } catch (error) {
      logger.error(`Failed to generate validation report for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Test action execution for development/debugging
   */
  async testActionExecution(gameId: GameId): Promise<{ ok: true; tests: any[] } | { ok: false; error: string }> {
    const game = this.games.get(gameId);
    if (!game) return { ok: false, error: 'Game not found' };

    try {
      const tests = [];
      
      // Test meta actions
      const metaActions = await this.scriptLoader.getMetaActions(game.scriptId);
      for (const metaAction of metaActions) {
        try {
          const context = {
            gameId: game.id,
            phase: game.phase,
            day: game.day
          };
          const result = await this.actionSystem.executeMetaAction(metaAction, context, game);
          tests.push({
            type: 'meta',
            actionId: metaAction.id,
            success: result.success,
            errors: result.errors
          });
        } catch (error) {
          tests.push({
            type: 'meta',
            actionId: metaAction.id,
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }

      // Test character actions for characters in play
      for (const seat of game.seats) {
        if (seat.role && seat.isAlive) {
          const loadedScript = await this.scriptLoader.getLoadedScript(game.scriptId);
          const character = loadedScript?.characters.find(c => c.id === seat.role);
          
          if (character?.actions?.firstNight) {
            for (const action of character.actions.firstNight) {
              try {
                const context = {
                  gameId: game.id,
                  phase: game.phase,
                  day: game.day,
                  acting: seat.id
                };
                const result = await this.actionSystem.executeCharacterAction(action, context, game, character, seat);
                tests.push({
                  type: 'character',
                  characterId: character.id,
                  actionId: action.id,
                  success: result.success,
                  errors: result.errors
                });
              } catch (error) {
                tests.push({
                  type: 'character',
                  characterId: character.id,
                  actionId: action.id,
                  success: false,
                  errors: [error instanceof Error ? error.message : 'Unknown error']
                });
              }
            }
          }
        }
      }

      return { ok: true, tests };
    } catch (error) {
      logger.error(`Failed to test action execution for game ${gameId}:`, error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
