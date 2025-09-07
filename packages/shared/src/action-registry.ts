/**
 * Action Registry - Maps action types to their implementation functions
 * This provides a pluggable system for extending game actions without modifying core engine code
 */

import {
  CharacterActionType,
  MetaActionType,
  StatusEffect,
  EffectDuration,
  EffectTarget,
  createEffect,
} from './game-definitions';
import {
  GameState,
  Seat,
  CharacterAction,
  MetaAction,
  ActionContext,
  ActionResult,
} from './types';

// ============================================================================
// ACTION HANDLER TYPES
// ============================================================================

export type CharacterActionHandler = (
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
) => Promise<ActionResult> | ActionResult;

export type MetaActionHandler = (
  action: MetaAction,
  context: ActionContext,
  game: GameState
) => Promise<ActionResult> | ActionResult;

// ============================================================================
// ACTION REGISTRY
// ============================================================================

/**
 * Registry that maps action types to their handler functions
 */
export class ActionRegistry {
  private characterActionHandlers = new Map<CharacterActionType, CharacterActionHandler>();
  private metaActionHandlers = new Map<MetaActionType, MetaActionHandler>();

  /**
   * Register a character action handler
   */
  registerCharacterAction(actionType: CharacterActionType, handler: CharacterActionHandler): void {
    this.characterActionHandlers.set(actionType, handler);
  }

  /**
   * Register a meta action handler
   */
  registerMetaAction(actionType: MetaActionType, handler: MetaActionHandler): void {
    this.metaActionHandlers.set(actionType, handler);
  }

  /**
   * Get character action handler
   */
  getCharacterActionHandler(actionType: CharacterActionType): CharacterActionHandler | undefined {
    return this.characterActionHandlers.get(actionType);
  }

  /**
   * Get meta action handler
   */
  getMetaActionHandler(actionType: MetaActionType): MetaActionHandler | undefined {
    return this.metaActionHandlers.get(actionType);
  }

  /**
   * Check if character action is supported
   */
  hasCharacterAction(actionType: CharacterActionType): boolean {
    return this.characterActionHandlers.has(actionType);
  }

  /**
   * Check if meta action is supported
   */
  hasMetaAction(actionType: MetaActionType): boolean {
    return this.metaActionHandlers.has(actionType);
  }

  /**
   * Get all registered character action types
   */
  getRegisteredCharacterActions(): CharacterActionType[] {
    return Array.from(this.characterActionHandlers.keys());
  }

  /**
   * Get all registered meta action types
   */
  getRegisteredMetaActions(): MetaActionType[] {
    return Array.from(this.metaActionHandlers.keys());
  }
}

// ============================================================================
// STANDARD ACTION CONFIGURATIONS
// ============================================================================

/**
 * Standard action configurations that can be reused across characters
 */
export const STANDARD_ACTIONS = {
  // Information gathering actions
  LEARN_EVIL_PAIRS: {
    type: CharacterActionType.LEARN_EVIL_PAIRS_COUNT,
    effects: [],
    information: {
      customMessage: "You see [COUNT] pairs of neighbouring evil players"
    }
  },
  
  LEARN_EVIL_NEIGHBORS: {
    type: CharacterActionType.LEARN_EVIL_NEIGHBOR_COUNT,
    effects: [],
    information: {
      customMessage: "You see [COUNT] evil neighbors"
    }
  },

  // Player targeting actions
  CHOOSE_MASTER: {
    type: CharacterActionType.CHOOSE_MASTER,
    effects: [
      createEffect(StatusEffect.MASTER, EffectTarget.SELECTED, EffectDuration.ONE_DAY)
    ],
    information: {
      customMessage: "You chose [PLAYER] as your Master"
    }
  },

  // Killing actions
  KILL_PLAYER: {
    type: CharacterActionType.KILL_PLAYER,
    effects: [
      createEffect(StatusEffect.DEAD, EffectTarget.SELECTED, EffectDuration.INSTANT)
    ]
  },

  // Protection actions
  PROTECT_PLAYER: {
    type: CharacterActionType.PROTECT_PLAYER,
    effects: [
      createEffect(StatusEffect.PROTECTED, EffectTarget.SELECTED, EffectDuration.TONIGHT)
    ]
  },

  // Status effect actions
  POISON_PLAYER: {
    type: CharacterActionType.POISON_PLAYER,
    effects: [
      createEffect(StatusEffect.POISONED, EffectTarget.SELECTED, EffectDuration.TONIGHT)
    ]
  },

  // Voting restrictions
  VOTING_RESTRICTION: {
    type: CharacterActionType.ENFORCE_VOTING_RESTRICTION,
    effects: [
      createEffect(StatusEffect.CAN_VOTE_ONLY_WITH_MASTER, EffectTarget.SELF, EffectDuration.ONE_DAY)
    ]
  },
} as const;

// ============================================================================
// ACTION VALIDATION HELPERS
// ============================================================================

/**
 * Validate action requirements before execution
 */
export class ActionValidator {
  /**
   * Check if an action can be performed based on game state
   */
  static canPerformAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat
  ): { valid: boolean; reason?: string } {
    // Check if player is alive (unless action allows dead players)
    if (!actingSeat.isAlive && !this.actionAllowsDead(action)) {
      return { valid: false, reason: 'Dead players cannot perform this action' };
    }

    // Check if player has already used a once-per-game ability
    if (this.isOncePerGame(action) && this.hasUsedAbility(actingSeat, action.id)) {
      return { valid: false, reason: 'This ability can only be used once per game' };
    }

    // Check if action is valid for current phase
    if (!this.isValidPhase(action, context)) {
      return { valid: false, reason: 'Action not valid in current phase' };
    }

    return { valid: true };
  }

  private static actionAllowsDead(action: CharacterAction): boolean {
    // Check if action has any effects that indicate it can be used by dead players
    return action.effects?.some(effect => 
      ('status' in effect && effect.status === StatusEffect.DEAD_VOTE_USED) ||
      ('statusEffect' in effect && effect.statusEffect === 'DEAD_VOTE_USED') ||
      ('target' in effect && effect.target === EffectTarget.STORYTELLER) ||
      ('target' in effect && effect.target === 'STORYTELLER')
    ) ?? false;
  }

  private static isOncePerGame(action: CharacterAction): boolean {
    // This would check character tags or action metadata
    return action.description?.includes('once per game') ?? false;
  }

  private static hasUsedAbility(seat: Seat, actionId: string): boolean {
    // This would check seat's action history
    // Implementation depends on how we track used abilities
    return false; // Placeholder
  }

  private static isValidPhase(action: CharacterAction, context: ActionContext): boolean {
    // This would validate the action phase against the current game phase
    // Implementation depends on how we map phases
    return true; // Placeholder
  }
}

// ============================================================================
// EFFECT PROCESSOR
// ============================================================================

/**
 * Processes and applies effects from actions
 */
export class EffectProcessor {
  /**
   * Apply all effects from an action
   */
  static applyEffects(
    action: CharacterAction | MetaAction,
    targets: Seat[],
    actingSeat: Seat | null,
    game: GameState
  ): void {
    if (!('effects' in action) || !action.effects) {
      return;
    }

    for (const effect of action.effects) {
      this.applyEffect(effect, targets, actingSeat, game);
    }
  }

  /**
   * Apply a single effect
   */
  private static applyEffect(
    effect: any, // EffectSpec from types
    targets: Seat[],
    actingSeat: Seat | null,
    game: GameState
  ): void {
    const targetSeats = this.resolveEffectTargets(effect.target, targets, actingSeat);
    
    for (const seat of targetSeats) {
      this.applyEffectToSeat(seat, effect, game);
    }
  }

  /**
   * Resolve which seats should receive the effect
   */
  private static resolveEffectTargets(
    targetType: EffectTarget,
    selectedTargets: Seat[],
    actingSeat: Seat | null
  ): Seat[] {
    switch (targetType) {
      case EffectTarget.SELF:
        return actingSeat ? [actingSeat] : [];
      case EffectTarget.SELECTED:
        return selectedTargets;
      case EffectTarget.ONE_OF_SELECTED:
        return selectedTargets.length > 0 ? [selectedTargets[0]] : [];
      case EffectTarget.ALL_SELECTED:
        return selectedTargets;
      default:
        return [];
    }
  }

  /**
   * Apply effect to a specific seat
   */
  private static applyEffectToSeat(
    seat: Seat,
    effect: any, // EffectSpec
    game: GameState
  ): void {
    // This would apply the status effect to the seat
    // Implementation depends on how we store seat status
    // For now, just log the effect
    const status = ('status' in effect) ? effect.status : effect.statusEffect;
    const duration = ('duration' in effect) ? effect.duration : effect.duration;
    console.log(`Applying effect ${status} to seat ${seat.id} for ${duration}`);
  }
}

// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================

/**
 * Global action registry instance
 */
export const globalActionRegistry = new ActionRegistry();
