/**
 * Standard Action Handlers - Implementation of common game actions
 * These handlers implement the core mechanics for character abilities
 */

import {
  CharacterActionType,
  MetaActionType,
  StatusEffect,
  createEffect,
} from './game-definitions';
import {
  GameState,
  Seat,
  CharacterAction,
  MetaAction,
  ActionContext,
  ActionResult,
  RoleType,
} from './types';
import { EffectProcessor } from './action-registry';

// ============================================================================
// INFORMATION GATHERING ACTIONS
// ============================================================================

/**
 * Chef: Count pairs of neighboring evil players
 */
export function handleLearnEvilPairsCount(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
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
    ? action.information.customMessage.replace('[COUNT]', pairCount.toString())
    : `You see ${pairCount} pairs of neighboring evil players`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      count: pairCount
    }
  };
}

/**
 * Empath: Count evil neighbors
 */
export function handleLearnEvilNeighborCount(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  const playerSeats = getPlayerSeats(game);
  const actingIndex = playerSeats.findIndex(s => s.id === actingSeat.id);
  
  if (actingIndex === -1) {
    return {
      actionId: action.id,
      success: false,
      errors: ['Acting seat not found among players']
    };
  }

  const leftNeighbor = playerSeats[(actingIndex - 1 + playerSeats.length) % playerSeats.length];
  const rightNeighbor = playerSeats[(actingIndex + 1) % playerSeats.length];
  
  const evilCount = (isEvil(leftNeighbor) ? 1 : 0) + (isEvil(rightNeighbor) ? 1 : 0);

  const information = action.information?.customMessage 
    ? action.information.customMessage.replace('[COUNT]', evilCount.toString())
    : `You see ${evilCount} evil neighbors`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      count: evilCount
    }
  };
}

/**
 * Investigative actions (Washerwoman, Librarian, Investigator, etc.)
 */
export function handleLearnPlayerInfo(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  // This is a more complex action that would need character-specific logic
  // For now, return a placeholder implementation
  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: "You learn information about a player",
    }
  };
}

// ============================================================================
// PLAYER TARGETING ACTIONS
// ============================================================================

/**
 * Choose a player (generic targeting)
 */
export function handleChoosePlayer(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  // Apply any effects specified in the action
  const targets = context.targets ? context.targets.map(id => game.seats.find(s => s.id === id)).filter(Boolean) as Seat[] : [];
  
  if (action.effects) {
    EffectProcessor.applyEffects(action, targets, actingSeat, game);
  }

  const targetNames = targets.map(t => getSeatDisplayName(t)).join(', ');
  const information = action.information?.customMessage 
    ? action.information.customMessage.replace('[PLAYER]', targetNames)
    : `You chose ${targetNames}`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      targets: targets.map(t => t.id)
    }
  };
}

/**
 * Butler: Choose master player
 */
export function handleChooseMaster(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  const targets = context.targets ? context.targets.map(id => game.seats.find(s => s.id === id)).filter(Boolean) as Seat[] : [];
  
  if (targets.length !== 1) {
    return {
      actionId: action.id,
      success: false,
      errors: ['Butler must choose exactly one master']
    };
  }

  const master = targets[0];
  
  // Apply master status to selected player and voting restriction to butler
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const information = action.information?.customMessage 
    ? action.information.customMessage.replace('[PLAYER]', getSeatDisplayName(master))
    : `You chose ${getSeatDisplayName(master)} as your Master`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      master: master.id
    }
  };
}

// ============================================================================
// KILLING AND PROTECTION ACTIONS
// ============================================================================

/**
 * Kill a player
 */
export function handleKillPlayer(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  const targets = context.targets ? context.targets.map(id => game.seats.find(s => s.id === id)).filter(Boolean) as Seat[] : [];
  
  if (targets.length === 0) {
    return {
      actionId: action.id,
      success: false,
      errors: ['No valid targets for kill action']
    };
  }

  // Apply death effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const killedPlayers = targets.map(t => getSeatDisplayName(t)).join(', ');

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: 'storyteller',
      message: `${killedPlayers} killed by ${getSeatDisplayName(actingSeat)}`,
      killed: targets.map(t => t.id)
    }
  };
}

/**
 * Protect a player
 */
export function handleProtectPlayer(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  const targets = context.targets ? context.targets.map(id => game.seats.find(s => s.id === id)).filter(Boolean) as Seat[] : [];
  
  // Apply protection effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const protectedPlayers = targets.map(t => getSeatDisplayName(t)).join(', ');
  const information = action.information?.customMessage 
    ? action.information.customMessage.replace('[PLAYER]', protectedPlayers)
    : `You protected ${protectedPlayers}`;

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: actingSeat.id,
      message: information,
      protected: targets.map(t => t.id)
    }
  };
}

// ============================================================================
// STATUS EFFECT ACTIONS
// ============================================================================

/**
 * Poison a player
 */
export function handlePoisonPlayer(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  const targets = context.targets ? context.targets.map(id => game.seats.find(s => s.id === id)).filter(Boolean) as Seat[] : [];
  
  // Apply poison effect to targets
  EffectProcessor.applyEffects(action, targets, actingSeat, game);

  const poisonedPlayers = targets.map(t => getSeatDisplayName(t)).join(', ');

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: 'storyteller',
      message: `${poisonedPlayers} poisoned by ${getSeatDisplayName(actingSeat)}`,
      poisoned: targets.map(t => t.id)
    }
  };
}

// ============================================================================
// VOTING ACTIONS
// ============================================================================

/**
 * Enforce voting restriction (Butler)
 */
export function handleEnforceVotingRestriction(
  action: CharacterAction,
  context: ActionContext,
  game: GameState,
  actingSeat: Seat
): ActionResult {
  // This would check if the master is voting and allow/deny the butler's vote
  // For now, just apply the restriction effect
  EffectProcessor.applyEffects(action, [], actingSeat, game);

  return {
    actionId: action.id,
    success: true,
    information: {
      recipient: 'storyteller',
      message: `${getSeatDisplayName(actingSeat)} voting restriction enforced`,
    }
  };
}

// ============================================================================
// META ACTIONS
// ============================================================================

/**
 * Show team information to minions
 */
export function handleShowTeamToMinions(
  action: MetaAction,
  context: ActionContext,
  game: GameState
): ActionResult {
  const minions = game.seats.filter(seat => 
    seat.role && isMinion(seat)
  );

  const evilTeam = game.seats.filter(seat => 
    seat.role && (isMinion(seat) || isDemon(seat))
  ).map(seat => getSeatDisplayName(seat));

  // Send team information to each minion
  const results = minions.map(minion => ({
    recipient: minion.id,
    message: `Your evil team: ${evilTeam.join(', ')}`,
    team: evilTeam
  }));

  return {
    actionId: action.id,
    success: true,
    information: {
      recipients: minions.map(m => m.id),
      messages: results
    }
  };
}

/**
 * Show team and bluffs to demon
 */
export function handleShowTeamAndBluffsToDemon(
  action: MetaAction,
  context: ActionContext,
  game: GameState
): ActionResult {
  const demons = game.seats.filter(seat => 
    seat.role && isDemon(seat)
  );

  const evilTeam = game.seats.filter(seat => 
    seat.role && (isMinion(seat) || isDemon(seat))
  ).map(seat => getSeatDisplayName(seat));

  // Generate bluff suggestions (this would be more sophisticated)
  const bluffs = ['Washerwoman', 'Librarian', 'Investigator']; // Placeholder

  const results = demons.map(demon => ({
    recipient: demon.id,
    message: `Your evil team: ${evilTeam.join(', ')}. Suggested bluffs: ${bluffs.join(', ')}`,
    team: evilTeam,
    bluffs: bluffs
  }));

  return {
    actionId: action.id,
    success: true,
    information: {
      recipients: demons.map(d => d.id),
      messages: results
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getPlayerSeats(game: GameState): Seat[] {
  return game.seats.filter(seat => !seat.isStoryteller);
}

function getSeatDisplayName(seat: Seat): string {
  // For now, use the seat ID or position as display name
  // In a real implementation, this would look up the player name
  return seat.playerId || `Player ${seat.position}` || `Seat ${seat.id.slice(-4)}`;
}

function isEvil(seat: Seat): boolean {
  if (!seat.role) return false;
  return isMinion(seat) || isDemon(seat);
}

function isMinion(seat: Seat): boolean {
  // This would check the character's team/type
  // Implementation depends on how we store role information
  return seat.role?.includes('minion') ?? false; // Placeholder
}

function isDemon(seat: Seat): boolean {
  // This would check the character's team/type
  // Implementation depends on how we store role information
  return seat.role?.includes('demon') ?? false; // Placeholder
}

// ============================================================================
// ACTION HANDLER MAP
// ============================================================================

/**
 * Map of action types to their handler functions
 */
export const CHARACTER_ACTION_HANDLERS = {
  [CharacterActionType.LEARN_EVIL_PAIRS_COUNT]: handleLearnEvilPairsCount,
  [CharacterActionType.LEARN_EVIL_NEIGHBOR_COUNT]: handleLearnEvilNeighborCount,
  [CharacterActionType.LEARN_PLAYER_INFO]: handleLearnPlayerInfo,
  [CharacterActionType.CHOOSE_PLAYER]: handleChoosePlayer,
  [CharacterActionType.CHOOSE_MASTER]: handleChooseMaster,
  [CharacterActionType.KILL_PLAYER]: handleKillPlayer,
  [CharacterActionType.PROTECT_PLAYER]: handleProtectPlayer,
  [CharacterActionType.POISON_PLAYER]: handlePoisonPlayer,
  [CharacterActionType.ENFORCE_VOTING_RESTRICTION]: handleEnforceVotingRestriction,
} as const;

export const META_ACTION_HANDLERS = {
  [MetaActionType.SHOW_TEAM_TO_MINIONS]: handleShowTeamToMinions,
  [MetaActionType.SHOW_TEAM_AND_BLUFFS_TO_DEMON]: handleShowTeamAndBluffsToDemon,
} as const;
