"use strict";
/**
 * Game Definitions - Centralized exports
 * This replaces the original game-definitions.js file
 */
Object.defineProperty(exports, "__esModule", { value: true });

// Re-export everything from the modular files
const actionTypes = require("./constants/action-types");
const statusEffects = require("./constants/status-effects");
const selectionCriteria = require("./constants/selection-criteria");
const gameConstants = require("./constants/game-constants");
const validationRules = require("./constants/validation-rules");

// Export action types
exports.CharacterActionType = actionTypes.CharacterActionType;
exports.MetaActionType = actionTypes.MetaActionType;
exports.isCharacterAction = actionTypes.isCharacterAction;
exports.isMetaAction = actionTypes.isMetaAction;
exports.getAllActionTypes = actionTypes.getAllActionTypes;

// Export status effects
exports.StatusEffect = statusEffects.StatusEffect;
exports.EffectDuration = statusEffects.EffectDuration;
exports.EffectTarget = statusEffects.EffectTarget;
exports.isValidStatusEffect = statusEffects.isValidStatusEffect;
exports.isValidEffectDuration = statusEffects.isValidEffectDuration;
exports.isValidEffectTarget = statusEffects.isValidEffectTarget;
exports.createEffect = statusEffects.createEffect;

// Export selection criteria
exports.PlayerTeam = selectionCriteria.PlayerTeam;
exports.SelectionModifier = selectionCriteria.SelectionModifier;
exports.CharacterTag = selectionCriteria.CharacterTag;
exports.ActionPhase = selectionCriteria.ActionPhase;
exports.createSelection = selectionCriteria.createSelection;

// Export game constants
exports.TARGET_SELECTIONS = gameConstants.TARGET_SELECTIONS;
exports.COMMON_EFFECTS = gameConstants.COMMON_EFFECTS;
exports.INFO_PATTERNS = gameConstants.INFO_PATTERNS;

// Export validation rules
exports.VALIDATION_RULES = validationRules.VALIDATION_RULES;
