"use strict";
/**
 * Game Configuration Constants
 * Standard selections, effects, and patterns used throughout the game
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TARGET_SELECTIONS =
  exports.COMMON_EFFECTS =
  exports.INFO_PATTERNS =
    void 0;

const {
  StatusEffect,
  EffectTarget,
  EffectDuration,
} = require("./status-effects");

/**
 * Standard target selection configurations
 */
exports.TARGET_SELECTIONS = {
  SINGLE_PLAYER: {
    minTargets: 1,
    maxTargets: 1,
    allowSelf: false,
    requireAlive: true,
  },
  SINGLE_PLAYER_ALLOW_SELF: {
    minTargets: 1,
    maxTargets: 1,
    allowSelf: true,
    requireAlive: true,
  },
  SINGLE_PLAYER_ALLOW_DEAD: {
    minTargets: 1,
    maxTargets: 1,
    allowSelf: false,
    allowDead: true,
  },
  TWO_PLAYERS: {
    minTargets: 2,
    maxTargets: 2,
    allowSelf: false,
    requireAlive: true,
  },
  THREE_PLAYERS: {
    minTargets: 3,
    maxTargets: 3,
    allowSelf: false,
    requireAlive: true,
  },
  ADJACENT_NEIGHBORS: {
    minTargets: 2,
    maxTargets: 2,
    allowSelf: false,
    adjacentOnly: true,
    requireAlive: true,
  },
  ANY_PLAYER_INCLUDING_DEAD: {
    minTargets: 1,
    maxTargets: 1,
    allowSelf: true,
    allowDead: true,
  },
};

/**
 * Standard effect configurations
 */
exports.COMMON_EFFECTS = {
  POISON_TONIGHT: {
    status: StatusEffect.POISONED,
    target: EffectTarget.SELECTED,
    duration: EffectDuration.TONIGHT,
  },
  POISON_PERMANENT: {
    status: StatusEffect.POISONED,
    target: EffectTarget.SELECTED,
    duration: EffectDuration.PERMANENT,
  },
  PROTECT_TONIGHT: {
    status: StatusEffect.PROTECTED,
    target: EffectTarget.SELECTED,
    duration: EffectDuration.TONIGHT,
  },
  KILL_INSTANTLY: {
    status: StatusEffect.DEAD,
    target: EffectTarget.SELECTED,
    duration: EffectDuration.INSTANT,
  },
  SET_AS_MASTER: {
    status: StatusEffect.MASTER,
    target: EffectTarget.SELECTED,
    duration: EffectDuration.ONE_DAY,
  },
  VOTING_RESTRICTION: {
    status: StatusEffect.CAN_VOTE_ONLY_WITH_MASTER,
    target: EffectTarget.SELF,
    duration: EffectDuration.ONE_DAY,
  },
  MARK_ABILITY_USED: {
    status: StatusEffect.SLAYER_USED,
    target: EffectTarget.SELF,
    duration: EffectDuration.PERMANENT,
  },
};

/**
 * Common information delivery patterns
 */
exports.INFO_PATTERNS = {
  COUNT_MESSAGE: "You see [COUNT] {description}",
  PLAYER_IDENTITY: "You learn that [PLAYER] is the {role}",
  YES_NO_ANSWER: "{question}: [YES/NO]",
  PLAYER_LIST: "These players are {description}: [PLAYERS]",
  CUSTOM_TEMPLATE: "[CUSTOM_MESSAGE]",
};
