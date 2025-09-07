/**
 * Common definitions for game actions, selections, effects, and modifiers
 * This module reduces tight coupling by centralizing all game mechanic constants
 */

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Character action types - what characters can do
 */
export enum CharacterActionType {
  // Information gathering
  LEARN_EVIL_PAIRS_COUNT = 'learnEvilPairsCount',
  LEARN_EVIL_NEIGHBOR_COUNT = 'learnEvilNeighborCount', 
  LEARN_PLAYER_INFO = 'learnPlayerInfo',
  LEARN_CHARACTER_TYPE = 'learnCharacterType',
  LEARN_ROLE_IDENTITY = 'learnRoleIdentity',
  DETECT_OUTSIDER = 'detectOutsider',
  DETECT_MINION = 'detectMinion',
  DETECT_DEMON = 'detectDemon',
  
  // Player targeting/selection
  CHOOSE_PLAYER = 'choosePlayer',
  CHOOSE_PLAYERS = 'choosePlayers',
  CHOOSE_3_PLAYERS = 'choose3Players',
  CHOOSE_MASTER = 'chooseMaster',
  CHOOSE_CHARACTER_TYPE = 'chooseCharacterType',
  CHOOSE_MINION_OR_DEMON = 'chooseMinion-OrDemon',
  
  // Killing and protection
  KILL_PLAYER = 'killPlayer',
  CHOOSE_PLAYER_KILL = 'choosePlayerKill',
  KILL_CHOSEN_PLAYER_ONCE = 'killChosenPlayerOnce',
  PROTECT_PLAYER = 'protectPlayer',
  PROTECT_GOOD_NEIGHBORS_PASSIVE = 'protectGoodNeighborsPassive',
  FIRST_DEATH_SURVIVE = 'firstDeathSurvive',
  
  // Status effects
  POISON_PLAYER = 'poisonPlayer',
  MADNESS_PLAYER = 'madnessPlayer',
  DRUNK_PLAYER = 'drunkPlayer',
  CHOOSE_CHARACTER_TO_BE_DRUNK = 'chooseCharacterToBeDeunk',
  
  // Voting and nominations
  NOMINATE = 'nominate',
  NOMINATE_AGAIN = 'nominateAgain',
  VOTE_MANIPULATION = 'voteManipulation',
  ENFORCE_VOTING_RESTRICTION = 'enforceVotingRestriction',
  RESTRICT_OWN_VOTE = 'restrictOwnVote',
  DEAD_REGAIN_VOTE = 'deadRegainVote',
  
  // Information sharing
  SHARE_LEARNED_INFO = 'shareLearnedInfo',
  GIVE_INCORRECT_INFO = 'giveIncorrectInfo',
  SAY_PHRASE = 'sayPhrase',
  
  // Special abilities
  GAIN_ABILITY = 'gainAbility',
  BLOCK_DEMON = 'blockDemon',
  DEMON_MAY_CHOOSE_NOT_TO_ATTACK = 'demonMayChooseNotToAttack',
  STORYTELLER_GAINS_MINION_ABILITY = 'storytellerGainsMinion-Ability',
  KILLED_MINION_KEEPS_ABILITY_POISON_NEIGHBOR = 'killedMinionKeepsAbilityPoisonNeighbor',
  
  // Legion specific
  CHOOSE_PLAYER_TO_DIE = 'choosePlayerToDie',
}

/**
 * Meta action types - script-level actions
 */
export enum MetaActionType {
  SHOW_TEAM_TO_MINIONS = 'showTeamToMinions',
  SHOW_TEAM_AND_BLUFFS_TO_DEMON = 'showTeamAndBluffsToDemon',
  SETUP_MADNESS = 'setupMadness',
  DISTRIBUTE_ROLES = 'distributeRoles',
  APPLY_FIRST_NIGHT_INFO = 'applyFirstNightInfo',
  ASSIGN_RED_HERRING = 'assignRedHerring',
  RECEIVE_BLUFF_CHARACTERS = 'receiveBluffCharacters',
  COORDINATE_EVIL_TEAM = 'coordinateEvilTeam',
  MAINTAIN_BLUFF = 'maintainBluff',
  DEFLECT_ATTENTION = 'deflectAttention',
  VOTE_TO_SURVIVE = 'voteToSurvive',
  AVOID_EXECUTION = 'avoidExecution',
  SACRIFICE_MINIONS = 'sacrificeMinions',
}

// ============================================================================
// EFFECT TYPES AND STATUS CONDITIONS
// ============================================================================

/**
 * Status effects that can be applied to players
 */
export enum StatusEffect {
  // Basic status conditions
  POISONED = 'poisoned',
  DRUNK = 'drunk',
  MAD = 'mad',
  PROTECTED = 'protected',
  DEAD = 'dead',
  
  // Voting restrictions and modifications
  MASTER = 'master',
  CAN_VOTE_ONLY_WITH_MASTER = 'canVoteOnlyWithMaster',
  VOTE_COUNTS_NEGATIVELY = 'voteCountsNegatively',
  CANNOT_VOTE = 'cannotVote',
  DEAD_VOTE_USED = 'deadVoteUsed',
  
  // Character-specific statuses
  SLAYER_USED = 'slayerUsed',
  VIRGIN_TRIGGERED = 'virginTriggered',
  BUTLER_MASTER_SET = 'butlerMasterSet',
  INNKEEPER_PROTECTION = 'innkeeperProtection',
  SOLDIER_PROTECTION = 'soldierProtection',
  TEA_LADY_PROTECTION = 'teaLadyProtection',
  
  // Information tracking
  LEARNED_INFO = 'learnedInfo',
  BLUFF_GIVEN = 'bluffGiven',
  FALSE_INFO_GIVEN = 'falseInfoGiven',
  
  // Game state modifiers
  NOMINATED_TODAY = 'nominatedToday',
  EXECUTED_TODAY = 'executedToday',
  ACTED_TONIGHT = 'actedTonight',
  
  // Special conditions
  STARPASS_CANDIDATE = 'starpassCandidate',
  DEMON_INFO_RECEIVED = 'demonInfoReceived',
  MINION_INFO_RECEIVED = 'minionInfoReceived',
}

/**
 * Duration types for effects
 */
export enum EffectDuration {
  INSTANT = 'instant',
  TONIGHT = 'tonight',
  UNTIL_DUSK = 'untilDusk',
  ONE_DAY = 'oneDay',
  ONE_NIGHT = 'oneNight',
  PERMANENT = 'permanent',
  UNTIL_DEATH = 'untilDeath',
  UNTIL_ABILITY_USED = 'untilAbilityUsed',
}

/**
 * Effect target types
 */
export enum EffectTarget {
  SELF = 'self',
  SELECTED = 'selected',
  ONE_OF_SELECTED = 'oneOfSelected',
  ALL_SELECTED = 'allSelected',
  ALL_PLAYERS = 'allPlayers',
  NEIGHBORS = 'neighbors',
  STORYTELLER = 'storyteller',
}

// ============================================================================
// SELECTION CRITERIA
// ============================================================================

/**
 * Player teams for selection restrictions
 */
export enum PlayerTeam {
  TOWNSFOLK = 'townsfolk',
  OUTSIDERS = 'outsiders', 
  MINIONS = 'minions',
  DEMONS = 'demons',
  TRAVELLER = 'traveller',
  FABLED = 'fabled',
}

/**
 * Selection modifiers
 */
export enum SelectionModifier {
  ALLOW_SELF = 'allowSelf',
  ALLOW_DEAD = 'allowDead',
  REQUIRE_ALIVE = 'requireAlive',
  ADJACENT_ONLY = 'adjacentOnly',
  DIFFERENT_TEAM = 'differentTeam',
  SAME_TEAM = 'sameTeam',
  NOT_STORYTELLER = 'notStoryteller',
}

/**
 * Common character tags for selection restrictions
 */
export enum CharacterTag {
  ACTIVE = 'active',
  PASSIVE = 'passive',
  ONCE_PER_GAME = 'once-per-game',
  EACH_NIGHT = 'each-night',
  INFORMATION = 'information',
  KILL = 'kill',
  PROTECT = 'protect',
  MANIPULATE = 'manipulate',
  VOTE_MODIFIER = 'vote-modifier',
  SETUP_MODIFIER = 'setup-modifier',
  CHARACTER_CHANGE = 'character-change',
  STATUS_EFFECT = 'status-effect',
}

// ============================================================================
// GAME PHASE DEFINITIONS
// ============================================================================

/**
 * Game phases when actions can occur
 */
export enum ActionPhase {
  FIRST_NIGHT = 'firstNight',
  OTHER_NIGHTS = 'otherNights', 
  DAY = 'day',
  NOMINATIONS = 'nominations',
  VOTING = 'voting',
  EXECUTION = 'execution',
}

// ============================================================================
// TARGET SELECTION DEFINITIONS  
// ============================================================================

/**
 * Standard target selection configurations
 */
export const TARGET_SELECTIONS = {
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
} as const;

// ============================================================================
// COMMON EFFECT DEFINITIONS
// ============================================================================

/**
 * Standard effect configurations
 */
export const COMMON_EFFECTS = {
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
} as const;

// ============================================================================
// INFORMATION PATTERNS
// ============================================================================

/**
 * Common information delivery patterns
 */
export const INFO_PATTERNS = {
  COUNT_MESSAGE: "You see [COUNT] {description}",
  PLAYER_IDENTITY: "You learn that [PLAYER] is the {role}",
  YES_NO_ANSWER: "{question}: [YES/NO]",
  PLAYER_LIST: "These players are {description}: [PLAYERS]",
  CUSTOM_TEMPLATE: "[CUSTOM_MESSAGE]",
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Common validation patterns for actions
 */
export const VALIDATION_RULES = {
  ONCE_PER_GAME: {
    maxUses: 1,
    scope: 'game',
  },
  ONCE_PER_NIGHT: {
    maxUses: 1,
    scope: 'night',
  },
  ONCE_PER_DAY: {
    maxUses: 1,
    scope: 'day',
  },
  UNLIMITED: {
    maxUses: -1,
    scope: 'none',
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an action type is a character action
 */
export function isCharacterAction(actionType: string): actionType is CharacterActionType {
  return Object.values(CharacterActionType).includes(actionType as CharacterActionType);
}

/**
 * Check if an action type is a meta action
 */
export function isMetaAction(actionType: string): actionType is MetaActionType {
  return Object.values(MetaActionType).includes(actionType as MetaActionType);
}

/**
 * Get all action types (both character and meta)
 */
export function getAllActionTypes(): string[] {
  return [...Object.values(CharacterActionType), ...Object.values(MetaActionType)];
}

/**
 * Validate that a status effect exists
 */
export function isValidStatusEffect(status: string): status is StatusEffect {
  return Object.values(StatusEffect).includes(status as StatusEffect);
}

/**
 * Validate that an effect duration exists
 */
export function isValidEffectDuration(duration: string): duration is EffectDuration {
  return Object.values(EffectDuration).includes(duration as EffectDuration);
}

/**
 * Validate that an effect target exists
 */
export function isValidEffectTarget(target: string): target is EffectTarget {
  return Object.values(EffectTarget).includes(target as EffectTarget);
}

/**
 * Create a standardized effect object
 */
export function createEffect(
  status: StatusEffect,
  target: EffectTarget,
  duration: EffectDuration,
  value?: string | number | boolean
) {
  return {
    status,
    target,
    duration,
    ...(value !== undefined && { value }),
  };
}

/**
 * Create a standardized selection object
 */
export function createSelection(
  minTargets: number,
  maxTargets: number,
  modifiers: Partial<{
    allowSelf: boolean;
    allowDead: boolean;
    requireAlive: boolean;
    adjacentOnly: boolean;
    restrictByTeam: PlayerTeam[];
    restrictByTags: CharacterTag[];
  }> = {}
) {
  return {
    minTargets,
    maxTargets,
    ...modifiers,
  };
}
