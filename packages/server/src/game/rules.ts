import { GameState, Script, Alignment, RoleType } from '@botc/shared';
import { logger } from '../utils/logger';

export class RulesEngine {
  
  async assignRolesFromSetup(game: GameState, script: Script): Promise<boolean> {
    try {
      if (!game.setupState || !game.setupState.characterPool) {
        logger.error('No character pool available from setup');
        return false;
      }

      // Count players excluding storyteller
      const playerSeats = game.seats.filter(seat => seat.id !== (game as any).storytellerSeatId);
      const playerCount = playerSeats.length;
      const characterPool = [...game.setupState.characterPool];
      
      if (characterPool.length !== playerCount) {
        logger.error(`Character pool size ${characterPool.length} does not match player count ${playerCount}`);
        return false;
      }

      // Shuffle the character pool for random assignment
      this.shuffleArray(characterPool);

      // Create role map for lookups
      const roleMap = new Map(script.roles.map(r => [r.id, r] as const));

      // Assign roles to player seats only (exclude storyteller)
      for (let i = 0; i < playerSeats.length; i++) {
        const seat = playerSeats[i];
        const roleId = characterPool[i];
        const role = roleMap.get(roleId);
        
        if (!role) {
          logger.error(`Role ${roleId} not found in script`);
          return false;
        }

        seat.role = roleId;
        seat.alignment = role.alignment;
      }

      // Update grimoire positions
      if (game.grimoireState) {
        game.grimoireState.characterPositions = {};
        for (const seat of game.seats) {
          if (seat.role) {
            game.grimoireState.characterPositions[seat.id] = seat.role;
          }
        }
      }

      logger.info(`Assigned roles from setup for game ${game.id}: ${characterPool.join(', ')}`);
      return true;
    } catch (error) {
      logger.error(`Failed to assign roles from setup for game ${game.id}:`, error);
      return false;
    }
  }

  async assignRoles(game: GameState, script: Script): Promise<boolean> {
    try {
      // Count players excluding storyteller
      const playerSeats = game.seats.filter(seat => seat.id !== (game as any).storytellerSeatId);
      const playerCount = playerSeats.length;
      
      // Validate player count
      if (playerCount < script.setup.playerCount.min || playerCount > script.setup.playerCount.max) {
        logger.error(`Invalid player count ${playerCount} for script ${script.id}`);
        return false;
      }

      // Calculate role distribution based on player count
      const distribution = this.calculateDistribution(playerCount, script);
      
      // Get available roles by type (respect storyteller selection if provided)
  const rolesByType = this.groupRolesByType(script, (game as any).selectedRoles);
      const roleMap = new Map(script.roles.map(r => [r.id, r] as const));
      
      // Pre-assign claimed roles if any (only for player seats)
  const preAssignments: Array<{ roleId: string; alignment: typeof Alignment[keyof typeof Alignment] } | undefined> = new Array(game.seats.length).fill(undefined);
      if ((game as any).roleClaims) {
        for (const [seatId, roleId] of Object.entries((game as any).roleClaims as Record<string, string>)) {
          const seatIndex = game.seats.findIndex(s => s.id === (seatId as any));
          const role = roleMap.get(roleId as string);
          if (seatIndex >= 0 && role && seatId !== (game as any).storytellerSeatId) {
            // Remove from pools and adjust distribution
            const type = role.type;
            const list = rolesByType[type];
            const i = list.indexOf(roleId as string);
            if (i >= 0) list.splice(i, 1);
            if (distribution[type] > 0) distribution[type] -= 1;
            preAssignments[seatIndex] = { roleId: roleId as string, alignment: role.alignment };
          }
        }
      }
      
      // Assign remaining roles to player seats only
      const assignments = this.assignRolesRandomly(playerSeats, rolesByType, distribution, preAssignments.filter((_, idx) => {
        const seat = game.seats[idx];
        return seat && seat.id !== (game as any).storytellerSeatId;
      }), roleMap);
      
      // Apply assignments to game state (only to player seats)
      let assignmentIndex = 0;
      for (let i = 0; i < game.seats.length; i++) {
        const seat = game.seats[i];
        if (seat.id === (game as any).storytellerSeatId) continue; // Skip storyteller
        
        const assignment = assignments[assignmentIndex];
        seat.role = assignment.roleId;
        seat.alignment = assignment.alignment;
        assignmentIndex++;
      }

      logger.info(`Assigned roles for game ${game.id}: ${JSON.stringify(assignments)}`);
      return true;
    } catch (error) {
      logger.error(`Failed to assign roles for game ${game.id}:`, error);
      return false;
    }
  }

  private calculateDistribution(playerCount: number, script: Script): Record<typeof RoleType[keyof typeof RoleType], number> {
    // Standard Trouble Brewing distribution based on official rules
  let distribution: Record<typeof RoleType[keyof typeof RoleType], number> = {
      [RoleType.TOWNSFOLK]: 0,
      [RoleType.OUTSIDER]: 0,
      [RoleType.MINION]: 0,
      [RoleType.DEMON]: 1,
      [RoleType.TRAVELLER]: 0,
      [RoleType.FABLED]: 0
    };

    // Calculate based on player count (official BotC distribution)
    if (playerCount >= 5 && playerCount <= 6) {
      distribution[RoleType.TOWNSFOLK] = 3;
      distribution[RoleType.OUTSIDER] = 1;
      distribution[RoleType.MINION] = 1;
    } else if (playerCount >= 7 && playerCount <= 9) {
      distribution[RoleType.TOWNSFOLK] = playerCount - 3;
      distribution[RoleType.OUTSIDER] = 0;
      distribution[RoleType.MINION] = 2;
    } else if (playerCount >= 10 && playerCount <= 12) {
      distribution[RoleType.TOWNSFOLK] = playerCount - 4;
      distribution[RoleType.OUTSIDER] = 1;
      distribution[RoleType.MINION] = 2;
    } else if (playerCount >= 13 && playerCount <= 15) {
      distribution[RoleType.TOWNSFOLK] = playerCount - 5;
      distribution[RoleType.OUTSIDER] = 2;
      distribution[RoleType.MINION] = 2;
    } else {
      // Fallback for edge cases
      distribution[RoleType.TOWNSFOLK] = Math.max(2, playerCount - 3);
      distribution[RoleType.OUTSIDER] = Math.max(0, Math.min(2, playerCount - 6));
      distribution[RoleType.MINION] = Math.min(2, Math.max(1, Math.floor(playerCount / 4)));
    }

    return distribution;
  }

  private groupRolesByType(script: Script, selectedRoles?: string[]): Record<typeof RoleType[keyof typeof RoleType], string[]> {
  const groups: Record<typeof RoleType[keyof typeof RoleType], string[]> = {
      [RoleType.TOWNSFOLK]: [],
      [RoleType.OUTSIDER]: [],
      [RoleType.MINION]: [],
      [RoleType.DEMON]: [],
      [RoleType.TRAVELLER]: [],
      [RoleType.FABLED]: []
    };

    for (const role of script.roles) {
      if (selectedRoles && selectedRoles.length > 0 && !selectedRoles.includes(role.id)) continue;
      groups[role.type].push(role.id);
    }

    return groups;
  }

  private assignRolesRandomly(
    playerSeats: any[], 
  rolesByType: Record<typeof RoleType[keyof typeof RoleType], string[]>,
  distribution: Record<typeof RoleType[keyof typeof RoleType], number>,
  preAssignments: Array<{ roleId: string; alignment: typeof Alignment[keyof typeof Alignment] } | undefined>,
  roleMap: Map<string, { alignment: typeof Alignment[keyof typeof Alignment]; type: typeof RoleType[keyof typeof RoleType] }>
  ): Array<{ roleId: string; alignment: typeof Alignment[keyof typeof Alignment] }> {
  const assignments: Array<{ roleId: string; alignment: typeof Alignment[keyof typeof Alignment] }> = [];
    const availableSeats = [...Array(playerSeats.length).keys()];
    
    // Shuffle seats for random assignment
    this.shuffleArray(availableSeats);

    let seatIndex = 0;

    // Place pre-assignments into assignment array and remove those seat positions from available order
    for (const idx of [...availableSeats]) {
      const pre = preAssignments[idx];
      if (pre) {
        assignments[idx] = pre;
        const pos = availableSeats.indexOf(idx);
        if (pos >= 0) availableSeats.splice(pos, 1);
      }
    }

    // Assign demons first
    for (let i = 0; i < distribution[RoleType.DEMON]; i++) {
      const roleId = this.getRandomRole(rolesByType[RoleType.DEMON]);
      assignments[availableSeats[seatIndex]] = {
        roleId,
        alignment: Alignment.EVIL
      };
      seatIndex++;
    }

    // Assign minions
    for (let i = 0; i < distribution[RoleType.MINION]; i++) {
      const roleId = this.getRandomRole(rolesByType[RoleType.MINION]);
      assignments[availableSeats[seatIndex]] = {
        roleId,
        alignment: Alignment.EVIL
      };
      seatIndex++;
    }

    // Assign outsiders
    for (let i = 0; i < distribution[RoleType.OUTSIDER]; i++) {
      const roleId = this.getRandomRole(rolesByType[RoleType.OUTSIDER]);
      assignments[availableSeats[seatIndex]] = {
        roleId,
        alignment: Alignment.GOOD
      };
      seatIndex++;
    }

    // Assign townsfolk
    for (let i = 0; i < distribution[RoleType.TOWNSFOLK]; i++) {
      const roleId = this.getRandomRole(rolesByType[RoleType.TOWNSFOLK]);
      assignments[availableSeats[seatIndex]] = {
        roleId,
        alignment: Alignment.GOOD
      };
      seatIndex++;
    }

    return assignments;
  }

  private getRandomRole(roles: string[]): string {
    return roles[Math.floor(Math.random() * roles.length)];
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
