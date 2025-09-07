"use strict";
/**
 * Action Registry - Maps action types to their implementation functions
 * This provides a pluggable system for extending game actions without modifying core engine code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalActionRegistry = exports.EffectProcessor = exports.ActionValidator = exports.STANDARD_ACTIONS = exports.ActionRegistry = void 0;
const game_definitions_1 = require("./game-definitions");
// ============================================================================
// ACTION REGISTRY
// ============================================================================
/**
 * Registry that maps action types to their handler functions
 */
class ActionRegistry {
    constructor() {
        this.characterActionHandlers = new Map();
        this.metaActionHandlers = new Map();
    }
    /**
     * Register a character action handler
     */
    registerCharacterAction(actionType, handler) {
        this.characterActionHandlers.set(actionType, handler);
    }
    /**
     * Register a meta action handler
     */
    registerMetaAction(actionType, handler) {
        this.metaActionHandlers.set(actionType, handler);
    }
    /**
     * Get character action handler
     */
    getCharacterActionHandler(actionType) {
        return this.characterActionHandlers.get(actionType);
    }
    /**
     * Get meta action handler
     */
    getMetaActionHandler(actionType) {
        return this.metaActionHandlers.get(actionType);
    }
    /**
     * Check if character action is supported
     */
    hasCharacterAction(actionType) {
        return this.characterActionHandlers.has(actionType);
    }
    /**
     * Check if meta action is supported
     */
    hasMetaAction(actionType) {
        return this.metaActionHandlers.has(actionType);
    }
    /**
     * Get all registered character action types
     */
    getRegisteredCharacterActions() {
        return Array.from(this.characterActionHandlers.keys());
    }
    /**
     * Get all registered meta action types
     */
    getRegisteredMetaActions() {
        return Array.from(this.metaActionHandlers.keys());
    }
}
exports.ActionRegistry = ActionRegistry;
// ============================================================================
// STANDARD ACTION CONFIGURATIONS
// ============================================================================
/**
 * Standard action configurations that can be reused across characters
 */
exports.STANDARD_ACTIONS = {
    // Information gathering actions
    LEARN_EVIL_PAIRS: {
        type: game_definitions_1.CharacterActionType.LEARN_EVIL_PAIRS_COUNT,
        effects: [],
        information: {
            customMessage: "You see [COUNT] pairs of neighbouring evil players"
        }
    },
    LEARN_EVIL_NEIGHBORS: {
        type: game_definitions_1.CharacterActionType.LEARN_EVIL_NEIGHBOR_COUNT,
        effects: [],
        information: {
            customMessage: "You see [COUNT] evil neighbors"
        }
    },
    // Player targeting actions
    CHOOSE_MASTER: {
        type: game_definitions_1.CharacterActionType.CHOOSE_MASTER,
        effects: [
            (0, game_definitions_1.createEffect)(game_definitions_1.StatusEffect.MASTER, game_definitions_1.EffectTarget.SELECTED, game_definitions_1.EffectDuration.ONE_DAY)
        ],
        information: {
            customMessage: "You chose [PLAYER] as your Master"
        }
    },
    // Killing actions
    KILL_PLAYER: {
        type: game_definitions_1.CharacterActionType.KILL_PLAYER,
        effects: [
            (0, game_definitions_1.createEffect)(game_definitions_1.StatusEffect.DEAD, game_definitions_1.EffectTarget.SELECTED, game_definitions_1.EffectDuration.INSTANT)
        ]
    },
    // Protection actions
    PROTECT_PLAYER: {
        type: game_definitions_1.CharacterActionType.PROTECT_PLAYER,
        effects: [
            (0, game_definitions_1.createEffect)(game_definitions_1.StatusEffect.PROTECTED, game_definitions_1.EffectTarget.SELECTED, game_definitions_1.EffectDuration.TONIGHT)
        ]
    },
    // Status effect actions
    POISON_PLAYER: {
        type: game_definitions_1.CharacterActionType.POISON_PLAYER,
        effects: [
            (0, game_definitions_1.createEffect)(game_definitions_1.StatusEffect.POISONED, game_definitions_1.EffectTarget.SELECTED, game_definitions_1.EffectDuration.TONIGHT)
        ]
    },
    // Voting restrictions
    VOTING_RESTRICTION: {
        type: game_definitions_1.CharacterActionType.ENFORCE_VOTING_RESTRICTION,
        effects: [
            (0, game_definitions_1.createEffect)(game_definitions_1.StatusEffect.CAN_VOTE_ONLY_WITH_MASTER, game_definitions_1.EffectTarget.SELF, game_definitions_1.EffectDuration.ONE_DAY)
        ]
    },
};
// ============================================================================
// ACTION VALIDATION HELPERS
// ============================================================================
/**
 * Validate action requirements before execution
 */
class ActionValidator {
    /**
     * Check if an action can be performed based on game state
     */
    static canPerformAction(action, context, game, actingSeat) {
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
    static actionAllowsDead(action) {
        // Check if action has any effects that indicate it can be used by dead players
        return action.effects?.some(effect => ('status' in effect && effect.status === game_definitions_1.StatusEffect.DEAD_VOTE_USED) ||
            ('statusEffect' in effect && effect.statusEffect === 'DEAD_VOTE_USED') ||
            ('target' in effect && effect.target === game_definitions_1.EffectTarget.STORYTELLER) ||
            ('target' in effect && effect.target === 'STORYTELLER')) ?? false;
    }
    static isOncePerGame(action) {
        // This would check character tags or action metadata
        return action.description?.includes('once per game') ?? false;
    }
    static hasUsedAbility(seat, actionId) {
        // This would check seat's action history
        // Implementation depends on how we track used abilities
        return false; // Placeholder
    }
    static isValidPhase(action, context) {
        // This would validate the action phase against the current game phase
        // Implementation depends on how we map phases
        return true; // Placeholder
    }
}
exports.ActionValidator = ActionValidator;
// ============================================================================
// EFFECT PROCESSOR
// ============================================================================
/**
 * Processes and applies effects from actions
 */
class EffectProcessor {
    /**
     * Apply all effects from an action
     */
    static applyEffects(action, targets, actingSeat, game) {
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
    static applyEffect(effect, // EffectSpec from types
    targets, actingSeat, game) {
        const targetSeats = this.resolveEffectTargets(effect.target, targets, actingSeat);
        for (const seat of targetSeats) {
            this.applyEffectToSeat(seat, effect, game);
        }
    }
    /**
     * Resolve which seats should receive the effect
     */
    static resolveEffectTargets(targetType, selectedTargets, actingSeat) {
        switch (targetType) {
            case game_definitions_1.EffectTarget.SELF:
                return actingSeat ? [actingSeat] : [];
            case game_definitions_1.EffectTarget.SELECTED:
                return selectedTargets;
            case game_definitions_1.EffectTarget.ONE_OF_SELECTED:
                return selectedTargets.length > 0 ? [selectedTargets[0]] : [];
            case game_definitions_1.EffectTarget.ALL_SELECTED:
                return selectedTargets;
            default:
                return [];
        }
    }
    /**
     * Apply effect to a specific seat
     */
    static applyEffectToSeat(seat, effect, // EffectSpec
    game) {
        // This would apply the status effect to the seat
        // Implementation depends on how we store seat status
        // For now, just log the effect
        const status = ('status' in effect) ? effect.status : effect.statusEffect;
        const duration = ('duration' in effect) ? effect.duration : effect.duration;
        console.log(`Applying effect ${status} to seat ${seat.id} for ${duration}`);
    }
}
exports.EffectProcessor = EffectProcessor;
// ============================================================================
// GLOBAL REGISTRY INSTANCE
// ============================================================================
/**
 * Global action registry instance
 */
exports.globalActionRegistry = new ActionRegistry();
//# sourceMappingURL=action-registry.js.map