"use strict";
/**
 * Game Utility Functions
 * Common helper functions used across action handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerSeats = getPlayerSeats;
exports.getSeatDisplayName = getSeatDisplayName;
exports.isEvil = isEvil;
exports.isMinion = isMinion;
exports.isDemon = isDemon;

function getPlayerSeats(game) {
  return game.seats.filter((seat) => !seat.isStoryteller);
}

function getSeatDisplayName(seat) {
  // For now, use the seat ID or position as display name
  // In a real implementation, this would look up the player name
  return (
    seat.playerId || `Player ${seat.position}` || `Seat ${seat.id.slice(-4)}`
  );
}

function isEvil(seat) {
  if (!seat.role) return false;
  return isMinion(seat) || isDemon(seat);
}

function isMinion(seat) {
  // This would check the character's team/type
  // Implementation depends on how we store role information
  return seat.role?.includes("minion") ?? false; // Placeholder
}

function isDemon(seat) {
  // This would check the character's team/type
  // Implementation depends on how we store role information
  return seat.role?.includes("demon") ?? false; // Placeholder
}
