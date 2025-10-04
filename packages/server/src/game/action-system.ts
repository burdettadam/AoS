import {
  ActionContext,
  ActionResult,
  Character,
  CharacterAction,
  GameState,
  MetaAction,
  RoleType,
  Seat,
} from "@ashes-of-salem/shared";

// Import from the new action system modules
import {
  ActionValidator,
  CHARACTER_ACTION_HANDLERS,
  CharacterActionType,
  META_ACTION_HANDLERS,
  MetaActionType,
  globalActionRegistry,
  isCharacterAction,
  isMetaAction,
} from "@ashes-of-salem/shared";

import { logger } from "../utils/logger";

/**
 * Action execution system for handling both character actions and meta actions
 * This system processes the structured action metadata from characters and scripts
 */
export class ActionSystem {
  constructor() {
    // Register all standard action handlers
    this.initializeActionHandlers();
  }

  /**
   * Initialize the action registry with standard handlers
   */
  private initializeActionHandlers(): void {
    // Register character action handlers
    for (const [actionType, handler] of Object.entries(
      CHARACTER_ACTION_HANDLERS,
    )) {
      globalActionRegistry.registerCharacterAction(
        actionType as CharacterActionType,
        handler,
      );
    }

    // Register meta action handlers
    for (const [actionType, handler] of Object.entries(META_ACTION_HANDLERS)) {
      globalActionRegistry.registerMetaAction(
        actionType as MetaActionType,
        handler,
      );
    }

    logger.info(
      `Registered ${globalActionRegistry.getRegisteredCharacterActions().length} character actions`,
    );
    logger.info(
      `Registered ${globalActionRegistry.getRegisteredMetaActions().length} meta actions`,
    );
  }

  /**
   * Execute a character action based on the action metadata
   */
  async executeCharacterAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    character: Character,
    actingSeat: Seat,
  ): Promise<ActionResult> {
    logger.info(
      `Executing character action ${action.id} for ${character.name} in game ${game.id}`,
    );

    try {
      // Validate action before execution
      const validation = ActionValidator.canPerformAction(
        action,
        context,
        game,
        actingSeat,
      );
      if (!validation.valid) {
        return {
          actionId: action.id,
          success: false,
          errors: [validation.reason || "Action validation failed"],
        };
      }

      // Check if we have a registered handler for this action type
      const actionType = action.action as CharacterActionType;
      if (!isCharacterAction(actionType)) {
        return {
          actionId: action.id,
          success: false,
          errors: [`Invalid character action type: ${action.action}`],
        };
      }

      const handler =
        globalActionRegistry.getCharacterActionHandler(actionType);
      if (!handler) {
        logger.warn(
          `No handler registered for character action: ${action.action}`,
        );
        return {
          actionId: action.id,
          success: false,
          errors: [`No handler registered for action type: ${action.action}`],
        };
      }

      // Execute the action using the registered handler
      const typedAction = { ...action, action: actionType };
      return await handler(typedAction, context, game, actingSeat);
    } catch (error) {
      logger.error(`Error executing character action ${action.id}:`, error);
      return {
        actionId: action.id,
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Execute a meta action (script-level action like minion-info, demon-info)
   */
  async executeMetaAction(
    action: MetaAction,
    context: ActionContext,
    game: GameState,
  ): Promise<ActionResult> {
    logger.info(`Executing meta action ${action.id} in game ${game.id}`);

    try {
      // Check if we have a registered handler for this action type
      if (!action.action || !isMetaAction(action.action)) {
        return {
          actionId: action.id,
          success: false,
          errors: [`Invalid meta action type: ${action.action}`],
        };
      }

      const handler = globalActionRegistry.getMetaActionHandler(action.action);
      if (!handler) {
        logger.warn(`No handler registered for meta action: ${action.action}`);
        return {
          actionId: action.id,
          success: false,
          errors: [`No handler registered for action type: ${action.action}`],
        };
      }

      // Execute the action using the registered handler
      return await handler(action, context, game);
    } catch (error) {
      logger.error(`Error executing meta action ${action.id}:`, error);
      return {
        actionId: action.id,
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Chef: Count pairs of neighboring evil players
   */
  private executeChefAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    const playerSeats = this.getPlayerSeats(game);
    let pairCount = 0;

    for (let i = 0; i < playerSeats.length; i++) {
      const current = playerSeats[i];
      const next = playerSeats[(i + 1) % playerSeats.length];

      if (this.isEvil(current) && this.isEvil(next)) {
        pairCount++;
      }
    }

    const information = action.information?.customMessage
      ? action.information.customMessage.replace(
          "[COUNT]",
          pairCount.toString(),
        )
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
  private executeEmpathAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    const playerSeats = this.getPlayerSeats(game);
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
      (this.isEvil(leftNeighbor) ? 1 : 0) +
      (this.isEvil(rightNeighbor) ? 1 : 0);

    const information = action.information?.customMessage
      ? action.information.customMessage.replace(
          "[COUNT]",
          evilCount.toString(),
        )
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
   * Investigative actions like Washerwoman, Librarian, Investigator
   */
  private executeInvestigativeAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    // This would need specific implementation based on the character
    // For now, return a placeholder
    return {
      actionId: action.id,
      success: true,
      information: {
        recipient: actingSeat.id,
        message: "Investigative information delivered",
        // Would include specific player/role information
      },
    };
  }

  /**
   * Show team information to minions
   */
  private executeShowTeamToMinions(
    action: MetaAction,
    context: ActionContext,
    game: GameState,
  ): ActionResult {
    const minions = this.getSeatsByTeam(game, "minion");
    const demons = this.getSeatsByTeam(game, "demon");
    const information: Record<string, any> = {};

    for (const minion of minions) {
      const teammates = [
        ...minions.filter((m) => m.id !== minion.id),
        ...demons,
      ];
      information[minion.id] = {
        message: "You learn who your fellow evil players are",
        teammates: teammates.map((t) => ({
          seatId: t.id,
          role: action.information?.showRoles ? t.role : undefined,
        })),
      };
    }

    return {
      actionId: action.id,
      success: true,
      information,
    };
  }

  /**
   * Show team and bluffs to demon
   */
  private executeShowTeamAndBluffsToDemon(
    action: MetaAction,
    context: ActionContext,
    game: GameState,
  ): ActionResult {
    const demons = this.getSeatsByTeam(game, "demon");
    const minions = this.getSeatsByTeam(game, "minion");
    const information: Record<string, any> = {};

    if (demons.length === 0) {
      return {
        actionId: action.id,
        success: false,
        errors: ["No demon found in game"],
      };
    }

    const demon = demons[0]; // Assume single demon for now
    const bluffs = this.generateBluffs(
      game,
      action.information?.giveBluffs || 3,
    );

    information[demon.id] = {
      message: "You learn who your minions are and receive bluff characters",
      minions: minions.map((m) => ({
        seatId: m.id,
        role: action.information?.showRoles ? m.role : undefined,
      })),
      bluffs,
    };

    return {
      actionId: action.id,
      success: true,
      information,
    };
  }

  /**
   * Generic kill action
   */
  private executeKillAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    // Implementation would depend on targeting rules and game state
    return {
      actionId: action.id,
      success: true,
      information: {
        recipient: actingSeat.id,
        message: "Kill action executed",
      },
    };
  }

  /**
   * Generic protection action
   */
  private executeProtectionAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    return {
      actionId: action.id,
      success: true,
      information: {
        recipient: actingSeat.id,
        message: "Protection applied",
      },
    };
  }

  /**
   * Generic poison action
   */
  private executePoisonAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    return {
      actionId: action.id,
      success: true,
      information: {
        recipient: actingSeat.id,
        message: "Poison applied",
      },
    };
  }

  /**
   * Vote manipulation actions
   */
  private executeVoteManipulationAction(
    action: CharacterAction,
    context: ActionContext,
    game: GameState,
    actingSeat: Seat,
  ): ActionResult {
    return {
      actionId: action.id,
      success: true,
      information: {
        recipient: actingSeat.id,
        message: "Vote manipulation applied",
      },
    };
  }

  /**
   * Setup madness action for special scripts
   */
  private executeSetupMadness(
    action: MetaAction,
    context: ActionContext,
    game: GameState,
  ): ActionResult {
    return {
      actionId: action.id,
      success: true,
      information: {
        message: "Madness setup completed",
      },
    };
  }

  // Helper methods

  private getPlayerSeats(game: GameState): Seat[] {
    return game.seats.filter(
      (seat) => seat.id !== (game as any).storytellerSeatId,
    );
  }

  private getSeatsByTeam(game: GameState, team: string): Seat[] {
    const roleTypeMap: Record<
      string,
      (typeof RoleType)[keyof typeof RoleType]
    > = {
      townsfolk: RoleType.TOWNSFOLK,
      outsider: RoleType.OUTSIDER,
      minion: RoleType.MINION,
      demon: RoleType.DEMON,
    };

    const targetRoleType = roleTypeMap[team];
    if (!targetRoleType) return [];

    return this.getPlayerSeats(game).filter((seat) => {
      // This would need to be improved with proper role type mapping from character data
      return seat.role && this.getRoleType(seat.role) === targetRoleType;
    });
  }

  private isEvil(seat: Seat): boolean {
    return seat.alignment === "evil";
  }

  private getRoleType(
    roleId: string,
  ): (typeof RoleType)[keyof typeof RoleType] {
    // This is a simplified mapping - in real implementation,
    // this would look up the role in the script data
    const evilRoles = ["imp", "poisoner", "spy", "scarlet-woman", "baron"];
    const outsiderRoles = ["drunk", "recluse", "saint", "butler"];

    if (evilRoles.includes(roleId)) {
      return roleId === "imp" ? RoleType.DEMON : RoleType.MINION;
    }
    if (outsiderRoles.includes(roleId)) {
      return RoleType.OUTSIDER;
    }
    return RoleType.TOWNSFOLK;
  }

  private generateBluffs(game: GameState, count: number): string[] {
    // Generate bluff characters not in play
    const inPlayRoles = new Set(
      this.getPlayerSeats(game)
        .map((s) => s.role)
        .filter(Boolean),
    );
    const allRoles = [
      "washerwoman",
      "librarian",
      "investigator",
      "chef",
      "empath",
      "fortune-teller",
      "undertaker",
      "monk",
      "ravenkeeper",
      "virgin",
      "slayer",
      "soldier",
      "mayor",
    ];
    const availableBluffs = allRoles.filter((role) => !inPlayRoles.has(role));

    // Shuffle and take the requested count
    const shuffled = [...availableBluffs].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
