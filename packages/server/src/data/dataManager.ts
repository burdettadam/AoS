import {
  ScrapedCharacter,
  ScrapedTown,
  WikiDataTransformer,
} from "@ashes-of-salem/shared";
import { promises as fs } from "fs";
import path from "path";
import { logger } from "../utils/logger";

export interface TownMetadata {
  id: string;
  name: string;
  description: string;
  region: string;
  population: number;
  notableLocations: string[];
  resources: string[];
  governance: string;
  coordinates: { x: number; y: number };
  connections: string[];
  imageUrl: string;
  wikiUrl: string;
  characterCount: number;
  lastUpdated: Date;
}

export interface CharacterMetadata {
  id: string;
  name: string;
  category:
    | "Townsfolk"
    | "Outsider"
    | "Minion"
    | "Demon"
    | "Traveller"
    | "Fabled";
  edition: string[];
  abilitySummary: string;
  firstNightAction?: string | null;
  otherNightsAction?: string | null;
  dayAction?: string | null;
  tags: string[];
  tokensUsed: string[];
  imageUrl?: string;
  wikiUrl?: string;
  lastUpdated: Date;
}

export class DataManager {
  private townsData: Map<string, ScrapedTown> = new Map();
  private charactersData: Map<string, ScrapedCharacter> = new Map();
  private scriptsData: Map<string, any> = new Map(); // Store script metadata and character lists
  private townMetadata: Map<string, TownMetadata> = new Map();
  private characterMetadata: Map<string, CharacterMetadata> = new Map();
  private dataDirectory: string;

  constructor(
    dataDirectory: string = path.join(process.cwd(), "..", "..", "data"),
  ) {
    this.dataDirectory = dataDirectory;
  }

  async initialize(): Promise<void> {
    await this.ensureDataDirectory();
    await this.loadExistingData();
  }

  private async ensureDataDirectory(): Promise<void> {
    await fs.mkdir(this.dataDirectory, { recursive: true });
    await fs.mkdir(path.join(this.dataDirectory, "towns"), { recursive: true });
    await fs.mkdir(path.join(this.dataDirectory, "characters"), {
      recursive: true,
    });
    await fs.mkdir(path.join(this.dataDirectory, "scripts"), {
      recursive: true,
    });
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load characters from individual files
      await this.loadCharactersFromDirectory();

      // Load scripts from scripts directory
      await this.loadScriptsFromDirectory();
    } catch (error) {
      logger.warn("Error loading data:", error);
    }
  }

  private async loadCharactersFromDirectory(): Promise<void> {
    const charactersDir = path.join(this.dataDirectory, "characters");

    try {
      const files = await fs.readdir(charactersDir);
      let loadedCount = 0;

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(charactersDir, file);
          const characterData = await fs.readFile(filePath, "utf8");
          const character = JSON.parse(characterData);

          // Convert to ScrapedCharacter format if needed
          const scrapedChar: ScrapedCharacter = {
            id: character.id,
            name: character.name,
            category: character.team || character.category,
            edition: character.editions || character.edition || [],
            abilitySummary:
              character.ability || character.ability_summary || "",
            firstNightAction: character.firstNight || null,
            otherNightsAction: character.otherNights || null,
            dayAction: character.dayAction || null,
            tags: character.tags || [],
            tokensUsed: character.tokensUsed || character.tokens_used || [],
            imageUrl: character.imageUrl || character.image_url,
            wikiUrl: character.wikiUrl || character.wiki_url,
          };

          this.charactersData.set(character.id, scrapedChar);
          this.characterMetadata.set(
            character.id,
            this.createCharacterMetadata(scrapedChar),
          );
          loadedCount++;
        }
      }

      logger.info(`Loaded ${loadedCount} characters from directory`);
    } catch (error) {
      logger.warn("Error loading characters from directory:", error);
    }
  }

  private async loadScriptsFromDirectory(): Promise<void> {
    const scriptsDir = path.join(this.dataDirectory, "scripts");

    try {
      const files = await fs.readdir(scriptsDir);
      let loadedCount = 0;

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(scriptsDir, file);
          const scriptData = await fs.readFile(filePath, "utf8");
          const script = JSON.parse(scriptData);

          // Store script data
          this.scriptsData.set(script.id, script);

          // Also create a town entry for backward compatibility
          const scrapedTown: ScrapedTown = {
            id: script.id,
            name: script.name,
            description: script.description,
            region: script.id, // Use script id as region
            population: 0,
            notableLocations: [],
            resources: [],
            governance: "",
            coordinates: { x: 0, y: 0 },
            connections: [],
            imageUrl: "",
            wikiUrl: "",
          };

          this.townsData.set(script.id, scrapedTown);
          this.townMetadata.set(
            script.id,
            this.createTownMetadata(scrapedTown),
          );
          loadedCount++;
        }
      }

      logger.info(`Loaded ${loadedCount} scripts from directory`);
    } catch (error) {
      logger.warn("Error loading scripts from directory:", error);
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private createTownMetadata(town: ScrapedTown): TownMetadata {
    return {
      id: town.id,
      name: town.name,
      description: town.description || "",
      region: town.region || "",
      population: town.population || 0,
      notableLocations: town.notableLocations || [],
      resources: town.resources || [],
      governance: town.governance || "",
      coordinates: {
        x: town.coordinates?.x || 0,
        y: town.coordinates?.y || 0,
      },
      connections: town.connections || [],
      imageUrl: town.imageUrl || "",
      wikiUrl: town.wikiUrl || "",
      characterCount: Array.from(this.charactersData.values()).filter((c) =>
        c.edition.includes(town.id),
      ).length,
      lastUpdated: new Date(),
    };
  }

  private createCharacterMetadata(
    character: ScrapedCharacter,
  ): CharacterMetadata {
    return {
      id: character.id,
      name: character.name,
      category: character.category,
      edition: character.edition,
      abilitySummary: character.abilitySummary,
      firstNightAction: character.firstNightAction,
      otherNightsAction: character.otherNightsAction,
      dayAction: character.dayAction,
      tags: character.tags || [],
      tokensUsed: character.tokensUsed || [],
      imageUrl: character.imageUrl,
      wikiUrl: character.wikiUrl,
      lastUpdated: new Date(),
    };
  }

  // Import methods
  async importTownsFromFile(filePath: string): Promise<void> {
    const townsData = await fs.readFile(filePath, "utf8");
    const rawTowns = JSON.parse(townsData);

    let imported = 0;
    const towns: ScrapedTown[] = [];

    for (const rawTown of rawTowns.towns || rawTowns) {
      try {
        const validatedTown = WikiDataTransformer.validateTownData(rawTown);
        this.townsData.set(validatedTown.id, validatedTown);
        this.townMetadata.set(
          validatedTown.id,
          this.createTownMetadata(validatedTown),
        );
        towns.push(validatedTown);
        imported++;
      } catch (error) {
        logger.warn(`Failed to import town ${rawTown.name}:`, error);
      }
    }

    await this.saveTowns();
    logger.info(`Imported ${imported} towns from ${filePath}`);
  }

  async importCharactersFromFile(filePath: string): Promise<void> {
    const charactersData = await fs.readFile(filePath, "utf8");
    const rawCharacters = JSON.parse(charactersData);

    let imported = 0;
    const characters: ScrapedCharacter[] = [];

    for (const rawCharacter of rawCharacters.characters || rawCharacters) {
      try {
        const validatedCharacter =
          WikiDataTransformer.validateCharacterData(rawCharacter);
        this.charactersData.set(validatedCharacter.id, validatedCharacter);
        this.characterMetadata.set(
          validatedCharacter.id,
          this.createCharacterMetadata(validatedCharacter),
        );
        characters.push(validatedCharacter);
        imported++;
      } catch (error) {
        logger.warn(`Failed to import character ${rawCharacter.name}:`, error);
      }
    }

    await this.saveCharacters();
    logger.info(`Imported ${imported} characters from ${filePath}`);
  }

  // Query methods
  async getAllTowns(): Promise<TownMetadata[]> {
    return Array.from(this.townMetadata.values());
  }

  async getAllCharacters(): Promise<CharacterMetadata[]> {
    return Array.from(this.characterMetadata.values());
  }

  async getTownById(id: string): Promise<ScrapedTown | undefined> {
    return this.townsData.get(id);
  }

  async getCharacterById(id: string): Promise<ScrapedCharacter | undefined> {
    return this.charactersData.get(id);
  }

  async getCharactersByTown(townId: string): Promise<CharacterMetadata[]> {
    return Array.from(this.characterMetadata.values()).filter((c) =>
      c.edition.includes(townId),
    );
  }

  async getTownsByRegion(region: string): Promise<TownMetadata[]> {
    return Array.from(this.townMetadata.values()).filter((t) =>
      t.region.toLowerCase().includes(region.toLowerCase()),
    );
  }

  async searchCharacters(query: string): Promise<CharacterMetadata[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.characterMetadata.values()).filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.abilitySummary.toLowerCase().includes(lowerQuery) ||
        c.category.toLowerCase().includes(lowerQuery) ||
        c.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        c.tokensUsed.some((token) => token.toLowerCase().includes(lowerQuery)),
    );
  }

  async searchTowns(query: string): Promise<TownMetadata[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.townMetadata.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.region.toLowerCase().includes(lowerQuery) ||
        t.governance.toLowerCase().includes(lowerQuery),
    );
  }

  // Statistics
  async getStatistics(): Promise<{
    totalTowns: number;
    totalCharacters: number;
    charactersByCategory: Record<string, number>;
    charactersByEdition: Record<string, number>;
    townsByRegion: Record<string, number>;
  }> {
    const characters = Array.from(this.characterMetadata.values());
    const towns = Array.from(this.townMetadata.values());

    const charactersByCategory: Record<string, number> = {};
    const charactersByEdition: Record<string, number> = {};
    const townsByRegion: Record<string, number> = {};

    characters.forEach((char) => {
      charactersByCategory[char.category] =
        (charactersByCategory[char.category] || 0) + 1;
      char.edition.forEach((edition) => {
        charactersByEdition[edition] = (charactersByEdition[edition] || 0) + 1;
      });
    });

    towns.forEach((town) => {
      const region = town.region || "Unknown";
      townsByRegion[region] = (townsByRegion[region] || 0) + 1;
    });

    return {
      totalTowns: towns.length,
      totalCharacters: characters.length,
      charactersByCategory,
      charactersByEdition,
      townsByRegion,
    };
  }

  // Persistence methods
  private async saveTowns(): Promise<void> {
    const towns = Array.from(this.townsData.values());
    const townsFile = { towns };
    const filePath = path.join(this.dataDirectory, "towns.json");
    await fs.writeFile(filePath, JSON.stringify(townsFile, null, 2), "utf8");
  }

  private async saveCharacters(): Promise<void> {
    const characters = Array.from(this.charactersData.values());
    const charactersFile = { characters };
    const filePath = path.join(this.dataDirectory, "characters.json");
    await fs.writeFile(
      filePath,
      JSON.stringify(charactersFile, null, 2),
      "utf8",
    );
  }

  async exportData(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // Export towns
    const townsPath = path.join(outputDir, "towns.json");
    await this.saveTowns();
    await fs.copyFile(path.join(this.dataDirectory, "towns.json"), townsPath);

    // Export characters
    const charactersPath = path.join(outputDir, "characters.json");
    await this.saveCharacters();
    await fs.copyFile(
      path.join(this.dataDirectory, "characters.json"),
      charactersPath,
    );

    // Export metadata
    const metadataPath = path.join(outputDir, "metadata.json");
    const metadata = {
      towns: Array.from(this.townMetadata.values()),
      characters: Array.from(this.characterMetadata.values()),
      statistics: await this.getStatistics(),
      exportedAt: new Date(),
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf8");

    logger.info(`Exported data to ${outputDir}`);
  }
}

// Singleton instance
export const dataManager = new DataManager();
