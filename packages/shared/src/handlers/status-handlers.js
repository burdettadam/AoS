"use strict";
/**
 * Status Effect Action Handlers
 * Handles character abilities that apply status effects, kill, or protect players
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleKillPlayer = handleKillPlayer;
exports.handleProtectPlayer = handleProtectPlayer;
exports.handlePoisonPlayer = handlePoisonPlayer;

const { getSeatDisplayName } = require("../utils/game-utils");
const { EffectProcessor } = require("../action-registry");

/**
 * Kill a player
 */
function handleKillPlayer(action, context, game, actingSeat) {
  const targets = context.targets
    ? context.targets
        .map((id) => game.seats.find((s) => s.id === id))
        .filter(Boolean)
    : [];

  if (targets.length === 0) {
    return {
      actionId: action.id,
      success: false,
      errors: ["No valid targets for kill action"],
    };
  }

  // Apply death effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const killedPlayers = targets.map((t) => getSeatDisplayName(t)).join(", ");

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: "storyteller",
      message: `${killedPlayers} killed by ${getSeatDisplayName(actingSeat)}`,
      killed: targets.map((t) => t.id),
    },
  };
}

/**
 * Protect a player
 */
function handleProtectPlayer(action, context, game, actingSeat) {
  const targets = context.targets
    ? context.targets
        .map((id) => game.seats.find((s) => s.id === id))
        .filter(Boolean)
    : [];

  // Apply protection effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const protectedPlayers = targets.map((t) => getSeatDisplayName(t)).join(", ");
  const information = action.information?.customMessage
    ? action.information.customMessage.replace("[PLAYER]", protectedPlayers)
    : `You protected ${protectedPlayers}`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      protected: targets.map((t) => t.id),
    },
  };
}

/**
 * Poison a player
 */
function handlePoisonPlayer(action, context, game, actingSeat) {
  const targets = context.targets
    ? context.targets
        .map((id) => game.seats.find((s) => s.id === id))
        .filter(Boolean)
    : [];

  // Apply poison effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const poisonedPlayers = targets.map((t) => getSeatDisplayName(t)).join(", ");

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: "storyteller",
      message: `${poisonedPlayers} poisoned by ${getSeatDisplayName(
        actingSeat
      )}`,
      poisoned: targets.map((t) => t.id),
    },
  };
}
