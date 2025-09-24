"use strict";
/**
 * Player Targeting Action Handlers
 * Handles character abilities that involve selecting players
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChoosePlayer = handleChoosePlayer;
exports.handleChooseMaster = handleChooseMaster;

const { getSeatDisplayName } = require("../utils/game-utils");
const { EffectProcessor } = require("../action-registry");

/**
 * Choose a player (generic targeting)
 */
function handleChoosePlayer(action, context, game, actingSeat) {
  // Apply any effects specified in the action
  const targets = context.targets
    ? context.targets
        .map((id) => game.seats.find((s) => s.id === id))
        .filter(Boolean)
    : [];

  if (action.effects) {
    EffectProcessor.applyEffects(action, targets, actingSeat, game);
  }

  const targetNames = targets.map((t) => getSeatDisplayName(t)).join(", ");
  const information = action.information?.customMessage
    ? action.information.customMessage.replace("[PLAYER]", targetNames)
    : `You chose ${targetNames}`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      targets: targets.map((t) => t.id),
    },
  };
}

/**
 * Butler: Choose master player
 */
function handleChooseMaster(action, context, game, actingSeat) {
  const targets = context.targets
    ? context.targets
        .map((id) => game.seats.find((s) => s.id === id))
        .filter(Boolean)
    : [];

  if (targets.length !== 1) {
    return {
      actionId: action.id,
      success: false,
      errors: ["Butler must choose exactly one master"],
    };
  }

  const master = targets[0];

  // Apply master status to selected player and voting restriction to butler
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const information = action.information?.customMessage
    ? action.information.customMessage.replace(
        "[PLAYER]",
        getSeatDisplayName(master)
      )
    : `You chose ${getSeatDisplayName(master)} as your Master`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      master: master.id,
    },
  };
}
