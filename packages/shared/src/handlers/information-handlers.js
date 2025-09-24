"use strict";
/**
 * Information Gathering Action Handlers
 * Handles character abilities that provide information to players
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLearnEvilPairsCount = handleLearnEvilPairsCount;
exports.handleLearnEvilNeighborCount = handleLearnEvilNeighborCount;
exports.handleLearnPlayerInfo = handleLearnPlayerInfo;

const {
  getPlayerSeats,
  getSeatDisplayName,
  isEvil,
} = require("../utils/game-utils");

/**
 * Chef: Count pairs of neighboring evil players
 */
function handleLearnEvilPairsCount(action, context, game, actingSeat) {
  const playerSeats = getPlayerSeats(game);
  let pairCount = 0;

  for (let i = 0; i < playerSeats.length; i++) {
    const current = playerSeats[i];
    const next = playerSeats[(i + 1) % playerSeats.length];
    if (isEvil(current) && isEvil(next)) {
      pairCount++;
    }
  }

  const information = action.information?.customMessage
    ? action.information.customMessage.replace("[COUNT]", pairCount.toString())
    : `You see ${pairCount} pairs of neighboring evil players`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      count: pairCount,
    },
  };
}

/**
 * Empath: Count evil neighbors
 */
function handleLearnEvilNeighborCount(action, context, game, actingSeat) {
  const playerSeats = getPlayerSeats(game);
  const actingIndex = playerSeats.findIndex((s) => s.id === actingSeat.id);

  if (actingIndex === -1) {
    return {
      actionId: action.id,
      success: false,
      errors: ["Acting seat not found among players"],
    };
  }

  const leftNeighbor =
    playerSeats[(actingIndex - 1 + playerSeats.length) % playerSeats.length];
  const rightNeighbor = playerSeats[(actingIndex + 1) % playerSeats.length];
  const evilCount =
    (isEvil(leftNeighbor) ? 1 : 0) + (isEvil(rightNeighbor) ? 1 : 0);

  const information = action.information?.customMessage
    ? action.information.customMessage.replace("[COUNT]", evilCount.toString())
    : `You see ${evilCount} evil neighbors`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      count: evilCount,
    },
  };
}

/**
 * Investigative actions (Washerwoman, Librarian, Investigator, etc.)
 */
function handleLearnPlayerInfo(action, context, game, actingSeat) {
  // This is a more complex action that would need character-specific logic
  // For now, return a placeholder implementation
  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: "You learn information about a player",
    },
  };
}
