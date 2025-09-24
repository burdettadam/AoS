"use strict";
/**
 * Voting Action Handlers
 * Handles character abilities related to voting and nominations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEnforceVotingRestriction = handleEnforceVotingRestriction;

const { getSeatDisplayName } = require("../utils/game-utils");
const { EffectProcessor } = require("../action-registry");

/**
 * Enforce voting restriction (Butler)
 */
function handleEnforceVotingRestriction(action, context, game, actingSeat) {
  // This would check if the master is voting and allow/deny the butler's vote
  // For now, just apply the restriction effect
  EffectProcessor.applyEffects(action, [], actingSeat, game);

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: "storyteller",
      message: `${getSeatDisplayName(actingSeat)} voting restriction enforced`,
    },
  };
}
