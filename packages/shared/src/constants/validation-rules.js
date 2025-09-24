"use strict";
/**
 * Validation Rules
 * Common validation patterns for actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_RULES = void 0;

/**
 * Common validation patterns for actions
 */
exports.VALIDATION_RULES = {
  ONCE_PER_GAME: {
    maxUses: 1,
    scope: "game",
  },
  ONCE_PER_NIGHT: {
    maxUses: 1,
    scope: "night",
  },
  ONCE_PER_DAY: {
    maxUses: 1,
    scope: "day",
  },
  UNLIMITED: {
    maxUses: -1,
    scope: "none",
  },
};
