"use strict";
/**
 * Status Effects and Effect System
 * Definitions for status effects, durations, and targets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusEffect = exports.EffectDuration = exports.EffectTarget = void 0;
exports.isValidStatusEffect = isValidStatusEffect;
exports.isValidEffectDuration = isValidEffectDuration;
exports.isValidEffectTarget = isValidEffectTarget;
exports.createEffect = createEffect;

/**
 * Status effects that can be applied to players
 */
let StatusEffect;
(function (StatusEffect) {
  // Basic status conditions
  StatusEffect["POISONED"] = "poisoned";
  StatusEffect["DRUNK"] = "drunk";
  StatusEffect["MAD"] = "mad";
  StatusEffect["PROTECTED"] = "protected";
  StatusEffect["DEAD"] = "dead";
  // Voting restrictions and modifications
  StatusEffect["MASTER"] = "master";
  StatusEffect["CAN_VOTE_ONLY_WITH_MASTER"] = "canVoteOnlyWithMaster";
  StatusEffect["VOTE_COUNTS_NEGATIVELY"] = "voteCountsNegatively";
  StatusEffect["CANNOT_VOTE"] = "cannotVote";
  StatusEffect["DEAD_VOTE_USED"] = "deadVoteUsed";
  // Character-specific statuses
  StatusEffect["SLAYER_USED"] = "slayerUsed";
  StatusEffect["VIRGIN_TRIGGERED"] = "virginTriggered";
  StatusEffect["BUTLER_MASTER_SET"] = "butlerMasterSet";
  StatusEffect["INNKEEPER_PROTECTION"] = "innkeeperProtection";
  StatusEffect["SOLDIER_PROTECTION"] = "soldierProtection";
  StatusEffect["TEA_LADY_PROTECTION"] = "teaLadyProtection";
  // Information tracking
  StatusEffect["LEARNED_INFO"] = "learnedInfo";
  StatusEffect["BLUFF_GIVEN"] = "bluffGiven";
  StatusEffect["FALSE_INFO_GIVEN"] = "falseInfoGiven";
  // Game state modifiers
  StatusEffect["NOMINATED_TODAY"] = "nominatedToday";
  StatusEffect["EXECUTED_TODAY"] = "executedToday";
  StatusEffect["ACTED_TONIGHT"] = "actedTonight";
  // Special conditions
  StatusEffect["STARPASS_CANDIDATE"] = "starpassCandidate";
  StatusEffect["DEMON_INFO_RECEIVED"] = "demonInfoReceived";
  StatusEffect["MINION_INFO_RECEIVED"] = "minionInfoReceived";
})(StatusEffect || (exports.StatusEffect = StatusEffect = {}));

/**
 * Duration types for effects
 */
let EffectDuration;
(function (EffectDuration) {
  EffectDuration["INSTANT"] = "instant";
  EffectDuration["TONIGHT"] = "tonight";
  EffectDuration["UNTIL_DUSK"] = "untilDusk";
  EffectDuration["ONE_DAY"] = "oneDay";
  EffectDuration["ONE_NIGHT"] = "oneNight";
  EffectDuration["PERMANENT"] = "permanent";
  EffectDuration["UNTIL_DEATH"] = "untilDeath";
  EffectDuration["UNTIL_ABILITY_USED"] = "untilAbilityUsed";
})(EffectDuration || (exports.EffectDuration = EffectDuration = {}));

/**
 * Effect target types
 */
let EffectTarget;
(function (EffectTarget) {
  EffectTarget["SELF"] = "self";
  EffectTarget["SELECTED"] = "selected";
  EffectTarget["ONE_OF_SELECTED"] = "oneOfSelected";
  EffectTarget["ALL_SELECTED"] = "allSelected";
  EffectTarget["ALL_PLAYERS"] = "allPlayers";
  EffectTarget["NEIGHBORS"] = "neighbors";
  EffectTarget["STORYTELLER"] = "storyteller";
})(EffectTarget || (exports.EffectTarget = EffectTarget = {}));

/**
 * Validate that a status effect exists
 */
function isValidStatusEffect(status) {
  return Object.values(StatusEffect).includes(status);
}

/**
 * Validate that an effect duration exists
 */
function isValidEffectDuration(duration) {
  return Object.values(EffectDuration).includes(duration);
}

/**
 * Validate that an effect target exists
 */
function isValidEffectTarget(target) {
  return Object.values(EffectTarget).includes(target);
}

/**
 * Create a standardized effect object
 */
function createEffect(status, target, duration, value) {
  return {
    status,
    target,
    duration,
    ...(value !== undefined && { value }),
  };
}
