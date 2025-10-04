import { Character } from "@ashes-of-salem/shared";
import { promises as fs } from "fs";
import path from "path";
import { logger } from "../utils/logger";

interface CentralizedCharacter {
  id: string;
  name: string;
  team?: "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled";
  category?:
    | "townsfolk"
    | "outsider"
    | "minion"
    | "demon"
    | "traveller"
    | "fabled";
  editions?: string[];
  ability?: string;
  ability_summary?: string;
  ability_description?: string;
  firstNight?: number | null;
  otherNights?: number | null;
  firstNightDescription?: string;
  otherNightReminder?: string;
  first_night_reminder?: string;
  other_night_reminder?: string;
  setup?: boolean;
  reminders?: string[];
  tokens_used?: string[];
  tags?: string[];
  wikiUrl?: string;
  wiki_url?: string;
  imageUrl?: string | null;
  image_url?: string;
  howToRun?: string;
  tipsAndTricks?: string;
  bluffing?: string;
  legacy?: any;
  actions?: any;
  goal?: any;
}

class CharacterDatabase {
  private characterCache = new Map<string, Character>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info("📚 Initializing centralized character database...");
    const startTime = Date.now();

    await this.loadAllCharacters();

    const endTime = Date.now();
    logger.info(
      `✅ Character database initialized in ${endTime - startTime}ms - ${this.characterCache.size} characters loaded`,
    );
    this.initialized = true;
  }

  private async loadAllCharacters(): Promise<void> {
    const charactersPath = path.join(__dirname, "../../../../data/characters");

    try {
      const files = await fs.readdir(charactersPath);
      const characterFiles = files.filter(
        (file) => file.endsWith(".json") && file !== "README.md",
      );

      const loadPromises = characterFiles.map(async (file) => {
        try {
          const filePath = path.join(charactersPath, file);
          const content = await fs.readFile(filePath, "utf-8");
          const charData: CentralizedCharacter = JSON.parse(content);

          const character: Character =
            this.transformCentralizedCharacter(charData);
          this.characterCache.set(character.id, character);
        } catch (error) {
          logger.warn(
            `⚠️  Failed to load character from ${file}:`,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      logger.error(
        "Failed to load character database:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private transformCentralizedCharacter(char: CentralizedCharacter): Character {
    return {
      id: char.id,
      name: char.name,
      team: this.mapCategoryToTeam((char.team || char.category) ?? "townsfolk"),
      ability:
        char.ability || char.ability_summary || char.ability_description || "",
      firstNight: char.firstNight || this.deriveFirstNightIndex(char),
      otherNights: char.otherNights || this.deriveOtherNightsIndex(char),
      reminders: char.reminders || char.tokens_used || [],
      setup: char.setup || char.tags?.includes("setup") || false,
      // Legacy fields for compatibility
      category: (char.team || char.category) ?? "townsfolk",
      edition: char.editions || [],
      abilitySummary: char.ability_summary,
      firstNightAction: char.firstNightDescription || char.first_night_reminder,
      otherNightsAction: char.otherNightReminder || char.other_night_reminder,
      dayAction: null, // Not stored in centralized format yet
      tags: char.tags || [],
      tokensUsed: char.reminders || char.tokens_used || [],
      wikiUrl: char.wikiUrl || char.wiki_url,
      imageUrl: char.imageUrl || char.image_url,
    };
  }

  private mapCategoryToTeam(
    category: string,
  ): "townsfolk" | "outsider" | "minion" | "demon" | "traveller" | "fabled" {
    const cat = category?.toLowerCase();
    switch (cat) {
      case "townsfolk":
        return "townsfolk";
      case "outsider":
      case "outsiders":
        return "outsider";
      case "minion":
      case "minions":
        return "minion";
      case "demon":
      case "demons":
        return "demon";
      case "fabled":
        return "fabled";
      case "traveller":
      case "travellers":
        return "traveller";
      default:
        return "townsfolk"; // Default fallback
    }
  }

  private deriveFirstNightIndex(
    char: CentralizedCharacter,
  ): number | undefined {
    // Simple heuristic based on tags and reminders
    if (
      char.tags?.includes("setup") ||
      char.first_night_reminder ||
      char.firstNightDescription
    ) {
      if (char.tags?.includes("information")) return 10;
      const category = char.team || char.category;
      if (category === "townsfolk") return 20;
      if (category === "outsider") return 30;
      if (category === "minion") return 40;
      if (category === "demon") return 50;
    }
    return undefined;
  }

  private deriveOtherNightsIndex(
    char: CentralizedCharacter,
  ): number | undefined {
    // Simple heuristic
    if (char.other_night_reminder || char.otherNightReminder) {
      const category = char.team || char.category;
      if (category === "townsfolk") return 20;
      if (category === "outsider") return 30;
      if (category === "minion") return 40;
      if (category === "demon") return 50;
    }
    return undefined;
  }

  /**
   * Get a character by ID from the centralized database
   */
  getCharacter(id: string): Character | undefined {
    return this.characterCache.get(id);
  }

  /**
   * Get multiple characters by IDs
   */
  getCharacters(ids: string[]): Character[] {
    return ids
      .map((id) => this.getCharacter(id))
      .filter(Boolean) as Character[];
  }

  /**
   * Get all characters from a specific edition
   */
  getCharactersByEdition(edition: string): Character[] {
    return Array.from(this.characterCache.values()).filter((char) =>
      char.edition?.includes(edition),
    );
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characterCache.values());
  }

  /**
   * Check if the database has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const characterDatabase = new CharacterDatabase();
