"use strict";
/**
 * Action Type Definitions
 * Character and meta action types for game mechanics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterActionType = exports.MetaActionType = void 0;
exports.isCharacterAction = isCharacterAction;
exports.isMetaAction = isMetaAction;
exports.getAllActionTypes = getAllActionTypes;

/**
 * Character action types - what characters can do
 */
let CharacterActionType;
(function (CharacterActionType) {
  // Information gathering
  CharacterActionType["LEARN_EVIL_PAIRS_COUNT"] = "learnEvilPairsCount";
  CharacterActionType["LEARN_EVIL_NEIGHBOR_COUNT"] = "learnEvilNeighborCount";
  CharacterActionType["LEARN_PLAYER_INFO"] = "learnPlayerInfo";
  CharacterActionType["LEARN_CHARACTER_TYPE"] = "learnCharacterType";
  CharacterActionType["LEARN_ROLE_IDENTITY"] = "learnRoleIdentity";
  CharacterActionType["DETECT_OUTSIDER"] = "detectOutsider";
  CharacterActionType["DETECT_MINION"] = "detectMinion";
  CharacterActionType["DETECT_DEMON"] = "detectDemon";
  // Player targeting/selection
  CharacterActionType["CHOOSE_PLAYER"] = "choosePlayer";
  CharacterActionType["CHOOSE_PLAYERS"] = "choosePlayers";
  CharacterActionType["CHOOSE_3_PLAYERS"] = "choose3Players";
  CharacterActionType["CHOOSE_MASTER"] = "chooseMaster";
  CharacterActionType["CHOOSE_CHARACTER_TYPE"] = "chooseCharacterType";
  CharacterActionType["CHOOSE_MINION_OR_DEMON"] = "chooseMinion-OrDemon";
  // Killing and protection
  CharacterActionType["KILL_PLAYER"] = "killPlayer";
  CharacterActionType["CHOOSE_PLAYER_KILL"] = "choosePlayerKill";
  CharacterActionType["KILL_CHOSEN_PLAYER_ONCE"] = "killChosenPlayerOnce";
  CharacterActionType["PROTECT_PLAYER"] = "protectPlayer";
  CharacterActionType["PROTECT_GOOD_NEIGHBORS_PASSIVE"] =
    "protectGoodNeighborsPassive";
  CharacterActionType["FIRST_DEATH_SURVIVE"] = "firstDeathSurvive";
  // Status effects
  CharacterActionType["POISON_PLAYER"] = "poisonPlayer";
  CharacterActionType["MADNESS_PLAYER"] = "madnessPlayer";
  CharacterActionType["DRUNK_PLAYER"] = "drunkPlayer";
  CharacterActionType["CHOOSE_CHARACTER_TO_BE_DRUNK"] =
    "chooseCharacterToBeDeunk";
  // Voting and nominations
  CharacterActionType["NOMINATE"] = "nominate";
  CharacterActionType["NOMINATE_AGAIN"] = "nominateAgain";
  CharacterActionType["VOTE_MANIPULATION"] = "voteManipulation";
  CharacterActionType["ENFORCE_VOTING_RESTRICTION"] =
    "enforceVotingRestriction";
  CharacterActionType["RESTRICT_OWN_VOTE"] = "restrictOwnVote";
  CharacterActionType["DEAD_REGAIN_VOTE"] = "deadRegainVote";
  // Information sharing
  CharacterActionType["SHARE_LEARNED_INFO"] = "shareLearnedInfo";
  CharacterActionType["GIVE_INCORRECT_INFO"] = "giveIncorrectInfo";
  CharacterActionType["SAY_PHRASE"] = "sayPhrase";
  // Special abilities
  CharacterActionType["GAIN_ABILITY"] = "gainAbility";
  CharacterActionType["BLOCK_DEMON"] = "blockDemon";
  CharacterActionType["DEMON_MAY_CHOOSE_NOT_TO_ATTACK"] =
    "demonMayChooseNotToAttack";
  CharacterActionType["STORYTELLER_GAINS_MINION_ABILITY"] =
    "storytellerGainsMinion-Ability";
  CharacterActionType["KILLED_MINION_KEEPS_ABILITY_POISON_NEIGHBOR"] =
    "killedMinionKeepsAbilityPoisonNeighbor";
  // Legion specific
  CharacterActionType["CHOOSE_PLAYER_TO_DIE"] = "choosePlayerToDie";
})(
  CharacterActionType ||
    (exports.CharacterActionType = CharacterActionType = {})
);

/**
 * Meta action types - script-level actions
 */
let MetaActionType;
(function (MetaActionType) {
  MetaActionType["SHOW_TEAM_TO_MINIONS"] = "showTeamToMinions";
  MetaActionType["SHOW_TEAM_AND_BLUFFS_TO_DEMON"] = "showTeamAndBluffsToDemon";
  MetaActionType["SETUP_MADNESS"] = "setupMadness";
  MetaActionType["DISTRIBUTE_ROLES"] = "distributeRoles";
  MetaActionType["APPLY_FIRST_NIGHT_INFO"] = "applyFirstNightInfo";
  MetaActionType["ASSIGN_RED_HERRING"] = "assignRedHerring";
  MetaActionType["RECEIVE_BLUFF_CHARACTERS"] = "receiveBluffCharacters";
  MetaActionType["COORDINATE_EVIL_TEAM"] = "coordinateEvilTeam";
  MetaActionType["MAINTAIN_BLUFF"] = "maintainBluff";
  MetaActionType["DEFLECT_ATTENTION"] = "deflectAttention";
  MetaActionType["VOTE_TO_SURVIVE"] = "voteToSurvive";
  MetaActionType["AVOID_EXECUTION"] = "avoidExecution";
  MetaActionType["SACRIFICE_MINIONS"] = "sacrificeMinions";
})(MetaActionType || (exports.MetaActionType = MetaActionType = {}));

/**
 * Check if an action type is a character action
 */
function isCharacterAction(actionType) {
  return Object.values(CharacterActionType).includes(actionType);
}

/**
 * Check if an action type is a meta action
 */
function isMetaAction(actionType) {
  return Object.values(MetaActionType).includes(actionType);
}

/**
 * Get all action types (both character and meta)
 */
function getAllActionTypes() {
  return [
    ...Object.values(CharacterActionType),
    ...Object.values(MetaActionType),
  ];
}
