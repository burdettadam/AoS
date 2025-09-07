/**
 * Game Action System - Comprehensive index for all action-related functionality
 * This provides a single entry point for the new action system
 */

// Core definitions
export * from './game-definitions';

// Action registry and validation
export * from './action-registry';

// Standard action handlers  
export * from './action-handlers';

// Legacy bridge functionality (for transitional compatibility)
export class ActionSystemBridge {
  /**
   * Convert legacy string action to enum if possible
   */
  static normalizeActionType(action: string): string {
    // Map common legacy actions to new enum values
    const actionMap: Record<string, string> = {
      'learnEvilPairsCount': 'learnEvilPairsCount',
      'learnEvilNeighborCount': 'learnEvilNeighborCount',
      'chooseMaster': 'chooseMaster',
      'killPlayer': 'killPlayer',
      'protectPlayer': 'protectPlayer',
      'poisonPlayer': 'poisonPlayer',
      'enforceVotingRestriction': 'enforceVotingRestriction',
      'showTeamToMinions': 'showTeamToMinions',
      'showTeamAndBluffsToDemon': 'showTeamAndBluffsToDemon',
    };

    return actionMap[action] || action;
  }

  /**
   * Check if action type exists in our system
   */
  static isKnownAction(action: string): boolean {
    return this.normalizeActionType(action) !== action;
  }
}
