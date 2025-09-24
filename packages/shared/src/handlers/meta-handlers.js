"use strict";
/**
 * Meta Action Handlers
 * Handles script-level actions that affect multiple players
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleShowTeamToMinions = handleShowTeamToMinions;
exports.handleShowTeamAndBluffsToDemon = handleShowTeamAndBluffsToDemon;

const {
  getSeatDisplayName,
  isMinion,
  isDemon,
} = require("../utils/game-utils");

/**
 * Show team information to minions
 */
function handleShowTeamToMinions(action, context, game) {
  const minions = game.seats.filter((seat) => seat.role && isMinion(seat));
  const evilTeam = game.seats
    .filter((seat) => seat.role && (isMinion(seat) || isDemon(seat)))
    .map((seat) => getSeatDisplayName(seat));

  // Send team information to each minion
  const results = minions.map((minion) => ({
    recipient: minion.id,
    message: `Your evil team: ${evilTeam.join(", ")}`,
    team: evilTeam,
  }));

  return {
    actionId: action.id,
    success: true,
    information: {
      recipients: minions.map((m) => m.id),
      messages: results,
    },
  };
}

/**
 * Show team and bluffs to demon
 */
function handleShowTeamAndBluffsToDemon(action, context, game) {
  const demons = game.seats.filter((seat) => seat.role && isDemon(seat));
  const evilTeam = game.seats
    .filter((seat) => seat.role && (isMinion(seat) || isDemon(seat)))
    .map((seat) => getSeatDisplayName(seat));

  // Generate bluff suggestions (this would be more sophisticated)
  const bluffs = ["Washerwoman", "Librarian", "Investigator"]; // Placeholder

  const results = demons.map((demon) => ({
    recipient: demon.id,
    message: `Your evil team: ${evilTeam.join(
      ", "
    )}. Suggested bluffs: ${bluffs.join(", ")}`,
    team: evilTeam,
    bluffs,
  }));

  return {
    actionId: action.id,
    success: true,
    information: {
      recipients: demons.map((d) => d.id),
      messages: results,
    },
  };
}
