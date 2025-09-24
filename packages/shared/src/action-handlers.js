"use strict";
/**
 * Action Handlers - Centralized registry and exports
 * This replaces the original action-handlers.js file
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHARACTER_ACTION_HANDLERS = exports.META_ACTION_HANDLERS = void 0;

// Import all handler functions from modular files
const informationHandlers = require("./handlers/information-handlers");
const targetingHandlers = require("./handlers/targeting-handlers");
const statusHandlers = require("./handlers/status-handlers");
const votingHandlers = require("./handlers/voting-handlers");
const metaHandlers = require("./handlers/meta-handlers");

// Import action types
const {
  CharacterActionType,
  MetaActionType,
} = require("./constants/action-types");

// Re-export individual handler functions for backward compatibility
exports.handleLearnEvilPairsCount =
  informationHandlers.handleLearnEvilPairsCount;
exports.handleLearnEvilNeighborCount =
  informationHandlers.handleLearnEvilNeighborCount;
exports.handleLearnPlayerInfo = informationHandlers.handleLearnPlayerInfo;
exports.handleChoosePlayer = targetingHandlers.handleChoosePlayer;
exports.handleChooseMaster = targetingHandlers.handleChooseMaster;
exports.handleKillPlayer = statusHandlers.handleKillPlayer;
exports.handleProtectPlayer = statusHandlers.handleProtectPlayer;
exports.handlePoisonPlayer = statusHandlers.handlePoisonPlayer;
exports.handleEnforceVotingRestriction =
  votingHandlers.handleEnforceVotingRestriction;
exports.handleShowTeamToMinions = metaHandlers.handleShowTeamToMinions;
exports.handleShowTeamAndBluffsToDemon =
  metaHandlers.handleShowTeamAndBluffsToDemon;

/**
 * Map of action types to their handler functions
 */
exports.CHARACTER_ACTION_HANDLERS = {
  [CharacterActionType.LEARN_EVIL_PAIRS_COUNT]:
    informationHandlers.handleLearnEvilPairsCount,
  [CharacterActionType.LEARN_EVIL_NEIGHBOR_COUNT]:
    informationHandlers.handleLearnEvilNeighborCount,
  [CharacterActionType.LEARN_PLAYER_INFO]:
    informationHandlers.handleLearnPlayerInfo,
  [CharacterActionType.CHOOSE_PLAYER]: targetingHandlers.handleChoosePlayer,
  [CharacterActionType.CHOOSE_MASTER]: targetingHandlers.handleChooseMaster,
  [CharacterActionType.KILL_PLAYER]: statusHandlers.handleKillPlayer,
  [CharacterActionType.PROTECT_PLAYER]: statusHandlers.handleProtectPlayer,
  [CharacterActionType.POISON_PLAYER]: statusHandlers.handlePoisonPlayer,
  [CharacterActionType.ENFORCE_VOTING_RESTRICTION]:
    votingHandlers.handleEnforceVotingRestriction,
};

exports.META_ACTION_HANDLERS = {
  [MetaActionType.SHOW_TEAM_TO_MINIONS]: metaHandlers.handleShowTeamToMinions,
  [MetaActionType.SHOW_TEAM_AND_BLUFFS_TO_DEMON]:
    metaHandlers.handleShowTeamAndBluffsToDemon,
};
