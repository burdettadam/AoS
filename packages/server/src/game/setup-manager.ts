import {
  CharacterModification,
  GameState,
  ReminderToken,
  RoleType,
  Script,
  SeatId,
  SetupState,
} from "@ashes-of-salem/shared";
import { randomUUID } from "crypto";
import { NodeScriptDataSource } from "../data/nodeScriptDataSource";
import { logger } from "../utils/logger";
import { resolveLineup } from "./lineup-resolver";

export class SetupManager {
  /**
   * Initialize setup state when entering SETUP phase
   */
  async initializeSetup(game: GameState, script: Script): Promise<SetupState> {
    const setupState: SetupState = {
      selectedCharacters: [],
      characterModifications: [],
      reminderTokens: [],
      distributionOverride: undefined,
      isValidated: false,
      characterPool: [],
    };

    // Initialize grimoire state if not exists
    if (!game.grimoireState) {
      game.grimoireState = {
        characterPositions: {},
        reminderTokens: [],
        nightOrder: [],
        setupState,
      };
    } else {
      game.grimoireState.setupState = setupState;
    }

    game.setupState = setupState;

    // If the script metadata includes a composition policy, pre-seed selection to target counts
    try {
      const playerCount = game.seats.filter(
        (seat) => seat.id !== (game as any).storytellerSeatId,
      ).length;
      const dataSource = new NodeScriptDataSource();
      const rawMeta = await dataSource.loadMetadata(script.id);
      const composition = rawMeta?.composition;
      const loadedScriptLike: any = {
        id: script.id,
        name: script.name,
        characters: script.roles.map((r) => ({
          id: r.id,
          name: r.name,
          team: this.roleTypeToTeam(r.type),
        })) as any,
        meta: {
          characterList: rawMeta?.characters || script.roles.map((r) => r.id),
        },
        composition,
      };
      if (composition) {
        const { selection, counts, notes } = resolveLineup({
          script: loadedScriptLike,
          playerCount,
        });
        setupState.selectedCharacters = selection;
        // Also set distributionOverride so validation matches seeding
        setupState.distributionOverride = counts as any;
        if (notes.length)
          logger.info(`Seeded setup from composition: ${notes.join("; ")}`);
      }
    } catch (e) {
      logger.warn("Failed to seed setup from composition", e as any);
    }
    return setupState;
  }

  /**
   * Storyteller selects specific characters for the game
   */
  selectCharacters(
    game: GameState,
    script: Script,
    characterIds: string[],
    storytellerSeatId: SeatId,
  ): { success: boolean; error?: string } {
    if (!game.setupState) {
      return { success: false, error: "Setup not initialized" };
    }

    // Validate all characters exist in script
    const scriptCharacterIds = new Set(script.roles.map((r) => r.id));
    const invalidCharacters = characterIds.filter(
      (id) => !scriptCharacterIds.has(id),
    );
    if (invalidCharacters.length > 0) {
      return {
        success: false,
        error: `Invalid characters: ${invalidCharacters.join(", ")}`,
      };
    }

    // Set selected characters
    game.setupState.selectedCharacters = [...characterIds];

    // Apply character modifications
    this.applyCharacterModifications(game, script);

    logger.info(
      `Storyteller ${storytellerSeatId} selected characters: ${characterIds.join(", ")}`,
    );
    return { success: true };
  }

  /**
   * Apply character modification rules (e.g., Baron adds Outsiders)
   */
  applyCharacterModifications(game: GameState, script: Script): void {
    if (!game.setupState) return;

    const modifications: CharacterModification[] = [];

    for (const characterId of game.setupState.selectedCharacters) {
      const character = script.roles.find((r) => r.id === characterId);
      if (!character) continue;

      // Check for setup modifications based on character abilities
      switch (characterId) {
        case "baron":
          modifications.push({
            type: "add_outsiders",
            count: 2,
            condition: "Baron is in play",
          });
          modifications.push({
            type: "remove_townsfolk",
            count: 2,
            condition: "Baron is in play",
          });
          break;

        case "drunk":
          // Drunk appears as Townsfolk but doesn't add/remove roles
          // This is handled in role assignment phase
          break;

        // Add more character modifications as needed
      }
    }

    game.setupState.characterModifications = modifications;
    logger.info(`Applied ${modifications.length} character modifications`);
  }

  /**
   * Validate the current setup meets requirements
   */
  validateSetup(
    game: GameState,
    script: Script,
  ): { isValid: boolean; errors: string[] } {
    if (!game.setupState) {
      return { isValid: false, errors: ["Setup not initialized"] };
    }

    const errors: string[] = [];
    // Count players excluding storyteller
    const playerCount = game.seats.filter(
      (seat) => seat.id !== (game as any).storytellerSeatId,
    ).length;

    // Calculate required distribution
    const requiredDistribution = this.calculateRequiredDistribution(
      playerCount,
      game.setupState,
    );

    // Count selected characters by type
    const selectedByType = this.countCharactersByType(
      game.setupState.selectedCharacters,
      script,
    );

    // Validate distribution matches requirements
    if (selectedByType.townsfolk !== requiredDistribution.townsfolk) {
      errors.push(
        `Need ${requiredDistribution.townsfolk} Townsfolk, selected ${selectedByType.townsfolk}`,
      );
    }
    if (selectedByType.outsiders !== requiredDistribution.outsiders) {
      errors.push(
        `Need ${requiredDistribution.outsiders} Outsiders, selected ${selectedByType.outsiders}`,
      );
    }
    if (selectedByType.minions !== requiredDistribution.minions) {
      errors.push(
        `Need ${requiredDistribution.minions} Minions, selected ${selectedByType.minions}`,
      );
    }
    if (selectedByType.demons !== requiredDistribution.demons) {
      errors.push(
        `Need ${requiredDistribution.demons} Demons, selected ${selectedByType.demons}`,
      );
    }

    // Validate player count
    const totalSelected = Object.values(selectedByType).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (totalSelected !== playerCount) {
      errors.push(
        `Selected ${totalSelected} characters for ${playerCount} players`,
      );
    }

    // Check script limits
    if (
      playerCount < script.setup.playerCount.min ||
      playerCount > script.setup.playerCount.max
    ) {
      errors.push(
        `Player count ${playerCount} not supported by script ${script.id}`,
      );
    }

    const isValid = errors.length === 0;
    game.setupState.isValidated = isValid;

    if (isValid) {
      // Create character pool for random distribution
      game.setupState.characterPool = [...game.setupState.selectedCharacters];
      logger.info(`Setup validated successfully for ${playerCount} players`);
    } else {
      logger.warn(`Setup validation failed: ${errors.join("; ")}`);
    }

    return { isValid, errors };
  }

  /**
   * Create reminder tokens for characters that need them
   */
  createReminderTokens(game: GameState, script: Script): void {
    if (!game.setupState || !game.grimoireState) return;

    const reminderTokens: ReminderToken[] = [];

    for (const characterId of game.setupState.selectedCharacters) {
      const character = script.roles.find((r) => r.id === characterId);
      if (!character || !character.reminderTokens) continue;

      // Create reminder tokens for this character
      for (const tokenText of character.reminderTokens) {
        const token: ReminderToken = {
          id: randomUUID(),
          roleId: characterId,
          text: tokenText,
          isActive: true,
        };
        reminderTokens.push(token);
      }
    }

    game.setupState.reminderTokens = reminderTokens;
    game.grimoireState.reminderTokens = [...reminderTokens];

    logger.info(`Created ${reminderTokens.length} reminder tokens`);
  }

  /**
   * Create random character pool from selected characters (the "bag" system)
   */
  createCharacterPool(game: GameState): string[] {
    if (!game.setupState) return [];

    // Shuffle the selected characters for random distribution
    const pool = [...game.setupState.selectedCharacters];
    this.shuffleArray(pool);

    game.setupState.characterPool = pool;
    return pool;
  }

  /**
   * Complete setup process and prepare for role assignment
   */
  completeSetup(
    game: GameState,
    script: Script,
  ): { success: boolean; error?: string } {
    if (!game.setupState) {
      return { success: false, error: "Setup not initialized" };
    }

    const validation = this.validateSetup(game, script);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join("; ") };
    }

    // Create reminder tokens
    this.createReminderTokens(game, script);

    // Create character pool for distribution
    this.createCharacterPool(game);

    // Build night order
    this.buildNightOrder(game, script);

    logger.info(`Setup completed for game ${game.id}`);
    return { success: true };
  }

  /**
   * Build night order from selected characters
   */
  private buildNightOrder(game: GameState, script: Script): void {
    if (!game.grimoireState || !game.setupState) return;

    const nightOrder: string[] = [];

    // Get all characters with night abilities
    for (const characterId of game.setupState.selectedCharacters) {
      const character = script.roles.find((r) => r.id === characterId);
      if (character && character.ability?.when === "night") {
        nightOrder.push(characterId);
      }
    }

    // Sort by precedence (lower numbers go first)
    nightOrder.sort((a, b) => {
      const charA = script.roles.find((r) => r.id === a);
      const charB = script.roles.find((r) => r.id === b);
      return (charA?.precedence || 999) - (charB?.precedence || 999);
    });

    game.grimoireState.nightOrder = nightOrder;
  }

  /**
   * Calculate required character distribution including modifications
   */
  private calculateRequiredDistribution(
    playerCount: number,
    setupState: SetupState,
  ): Record<string, number> {
    // Start with base distribution (composition override if provided)
    const distribution = setupState.distributionOverride
      ? { ...setupState.distributionOverride }
      : this.getBaseDistribution(playerCount);

    // Apply character modifications on top of base/composition
    for (const mod of setupState.characterModifications) {
      switch (mod.type) {
        case "add_outsiders":
          distribution.outsiders += mod.count;
          break;
        case "remove_townsfolk":
          distribution.townsfolk -= mod.count;
          break;
        case "add_minions":
          distribution.minions += mod.count;
          break;
        case "remove_outsiders":
          distribution.outsiders -= mod.count;
          break;
      }
    }

    return distribution;
  }

  /**
   * Get base character distribution for player count
   */
  private getBaseDistribution(playerCount: number): Record<string, number> {
    // Standard Blood on the Clocktower distribution
    if (playerCount >= 5 && playerCount <= 6) {
      return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
    } else if (playerCount >= 7 && playerCount <= 9) {
      return {
        townsfolk: playerCount - 3,
        outsiders: 0,
        minions: 2,
        demons: 1,
      };
    } else if (playerCount >= 10 && playerCount <= 12) {
      return {
        townsfolk: playerCount - 4,
        outsiders: 1,
        minions: 2,
        demons: 1,
      };
    } else if (playerCount >= 13 && playerCount <= 15) {
      return {
        townsfolk: playerCount - 5,
        outsiders: 2,
        minions: 2,
        demons: 1,
      };
    } else {
      // Fallback
      return {
        townsfolk: Math.max(2, playerCount - 3),
        outsiders: Math.max(0, Math.min(2, playerCount - 6)),
        minions: Math.min(2, Math.max(1, Math.floor(playerCount / 4))),
        demons: 1,
      };
    }
  }

  private roleTypeToTeam(
    type: (typeof RoleType)[keyof typeof RoleType],
  ): "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled" {
    switch (type) {
      case RoleType.TOWNSFOLK:
        return "townsfolk";
      case RoleType.OUTSIDER:
        return "outsider";
      case RoleType.MINION:
        return "minion";
      case RoleType.DEMON:
        return "demon";
      case RoleType.TRAVELLER:
        return "traveller";
      case RoleType.FABLED:
        return "fabled";
    }
  }

  /**
   * Count selected characters by type
   */
  private countCharactersByType(
    characterIds: string[],
    script: Script,
  ): Record<string, number> {
    const counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };

    for (const id of characterIds) {
      const character = script.roles.find((r) => r.id === id);
      if (!character) continue;

      switch (character.type) {
        case RoleType.TOWNSFOLK:
          counts.townsfolk++;
          break;
        case RoleType.OUTSIDER:
          counts.outsiders++;
          break;
        case RoleType.MINION:
          counts.minions++;
          break;
        case RoleType.DEMON:
          counts.demons++;
          break;
      }
    }

    return counts;
  }

  /**
   * Shuffle array in place
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
