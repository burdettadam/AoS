#!/usr/bin/env node

/**
 * Migration script to extract characters from script-specific files
 * and create a centralized character database
 */

const fs = require("fs").promises;
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const CHARACTERS_DIR = path.join(DATA_DIR, "characters");
const SCRIPTS_DIR = path.join(DATA_DIR, "scripts");
const LEGACY_DIR = path.join(DATA_DIR, "legacy");

class CharacterMigrator {
  constructor() {
    this.characters = new Map(); // id -> character definition
    this.scriptCharacters = new Map(); // scriptId -> array of character IDs
    this.errors = [];
  }

  async migrate() {
    console.log("🔄 Starting character database migration...\n");

    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Extract characters from all scripts
      await this.extractCharacters();

      // Write centralized character files
      await this.writeCharacterFiles();

      // Create new script reference files
      await this.writeScriptFiles();

      // Move old files to legacy
      await this.moveToLegacy();

      console.log("✅ Migration completed successfully!");
      console.log(`📊 Statistics:`);
      console.log(`   - ${this.characters.size} unique characters`);
      console.log(`   - ${this.scriptCharacters.size} scripts migrated`);

      if (this.errors.length > 0) {
        console.log(`⚠️  ${this.errors.length} warnings/errors:`);
        this.errors.forEach((error) => console.log(`   - ${error}`));
      }
    } catch (error) {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    }
  }

  async ensureDirectories() {
    await fs.mkdir(CHARACTERS_DIR, { recursive: true });
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
    await fs.mkdir(LEGACY_DIR, { recursive: true });
  }

  async extractCharacters() {
    console.log("📂 Scanning script directories...");

    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const scriptDirs = entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !["characters", "scripts", "legacy"].includes(entry.name),
      )
      .map((entry) => entry.name);

    for (const scriptId of scriptDirs) {
      if (scriptId === "custom-scripts") {
        await this.processCustomScripts();
      } else {
        await this.processScript(scriptId);
      }
    }
  }

  async processScript(scriptId) {
    const scriptPath = path.join(DATA_DIR, scriptId);
    const charactersFile = path.join(scriptPath, "characters.json");

    console.log(`📜 Processing ${scriptId}...`);

    try {
      const exists = await fs
        .access(charactersFile)
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        console.log(`   ⏭️  No characters.json found, skipping`);
        return;
      }

      const data = await fs.readFile(charactersFile, "utf8");
      const parsed = JSON.parse(data);

      let characters = [];

      // Handle different formats
      if (Array.isArray(parsed)) {
        characters = parsed;
      } else if (parsed.characters && Array.isArray(parsed.characters)) {
        characters = parsed.characters;
      } else {
        this.errors.push(`${scriptId}: Unknown character format`);
        return;
      }

      const characterIds = [];

      for (const char of characters) {
        if (!char.id) {
          this.errors.push(
            `${scriptId}: Character missing ID: ${JSON.stringify(char)}`,
          );
          continue;
        }

        characterIds.push(char.id);

        // Check if we already have this character
        if (this.characters.has(char.id)) {
          const existing = this.characters.get(char.id);

          // Add this script to the character's editions if not already present
          if (!existing.editions.includes(scriptId)) {
            existing.editions.push(scriptId);
          }

          // TODO: Could add conflict detection here
        } else {
          // Normalize character data
          const normalized = this.normalizeCharacter(char, scriptId);
          this.characters.set(char.id, normalized);
        }
      }

      this.scriptCharacters.set(scriptId, characterIds);
      console.log(`   ✅ Found ${characterIds.length} characters`);
    } catch (error) {
      this.errors.push(`${scriptId}: Failed to process - ${error.message}`);
    }
  }

  async processCustomScripts() {
    console.log("📜 Processing custom scripts...");

    const customScriptsPath = path.join(DATA_DIR, "custom-scripts");
    const entries = await fs.readdir(customScriptsPath, {
      withFileTypes: true,
    });
    const customScriptDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const customScriptId of customScriptDirs) {
      const scriptPath = path.join(customScriptsPath, customScriptId);
      const charactersFile = path.join(scriptPath, "characters.json");
      const townFile = path.join(scriptPath, "town.json");

      try {
        // Read characters (array of IDs)
        let characterIds = [];
        if (
          await fs
            .access(charactersFile)
            .then(() => true)
            .catch(() => false)
        ) {
          const charactersData = await fs.readFile(charactersFile, "utf8");
          characterIds = JSON.parse(charactersData);
        }

        // Read town metadata
        let metadata = {};
        if (
          await fs
            .access(townFile)
            .then(() => true)
            .catch(() => false)
        ) {
          const townData = await fs.readFile(townFile, "utf8");
          metadata = JSON.parse(townData);

          // If town.json has character_list, use that instead
          if (
            metadata.character_list &&
            Array.isArray(metadata.character_list)
          ) {
            characterIds = metadata.character_list;
          }
        }

        // Check if all characters exist, if not, try to find their definitions
        for (const charId of characterIds) {
          if (!this.characters.has(charId)) {
            // Try to find character definition in other scripts
            await this.findMissingCharacter(charId);
          }
        }

        const fullScriptId = `custom-scripts/${customScriptId}`;
        this.scriptCharacters.set(fullScriptId, characterIds);
        console.log(
          `   ✅ Processed ${fullScriptId} with ${characterIds.length} characters`,
        );
      } catch (error) {
        this.errors.push(
          `custom-scripts/${customScriptId}: Failed to process - ${error.message}`,
        );
      }
    }
  }

  async findMissingCharacter(charId) {
    // Search through legacy directories for character definitions
    const legacyPath = path.join(DATA_DIR, "legacy");
    const entries = await fs.readdir(legacyPath, { withFileTypes: true });
    const legacyDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const legacyDir of legacyDirs) {
      const charactersFile = path.join(
        legacyPath,
        legacyDir,
        "characters.json",
      );
      if (
        await fs
          .access(charactersFile)
          .then(() => true)
          .catch(() => false)
      ) {
        try {
          const data = await fs.readFile(charactersFile, "utf8");
          const parsed = JSON.parse(data);
          let characters = [];

          if (Array.isArray(parsed)) {
            characters = parsed;
          } else if (parsed.characters && Array.isArray(parsed.characters)) {
            characters = parsed.characters;
          }

          const foundChar = characters.find((char) => char.id === charId);
          if (foundChar) {
            const normalized = this.normalizeCharacter(foundChar, legacyDir);
            this.characters.set(charId, normalized);
            console.log(
              `   🔍 Found missing character ${charId} in ${legacyDir}`,
            );
            return;
          }
        } catch (error) {
          // Continue searching
        }
      }
    }

    this.errors.push(`Character ${charId} not found in any script`);
  }

  normalizeCharacter(char, sourceScript) {
    return {
      id: char.id,
      name: char.name || this.formatName(char.id),
      team: this.normalizeTeam(char.category || char.team),
      ability:
        char.ability_summary ||
        char.abilitySummary ||
        char.ability ||
        char.ability_description ||
        "Unknown ability",
      firstNight: this.parseNightOrder(
        char.first_night_action || char.firstNightAction,
      ),
      otherNights: this.parseNightOrder(
        char.other_nights_action || char.otherNightsAction,
      ),
      reminders: char.tokens_used || char.tokensUsed || char.reminders || [],
      setup: char.setup || false,
      special: char.special || null,
      editions: [sourceScript],
      tags: char.tags || [],
      wikiUrl: char.wiki_url || char.wikiUrl || null,
      imageUrl: char.image_url || char.imageUrl || null,
      // Keep legacy fields for reference
      legacy: {
        category: char.category,
        originalSource: sourceScript,
        firstNightReminder:
          char.first_night_reminder || char.firstNightReminder,
        otherNightReminder:
          char.other_night_reminder || char.otherNightReminder,
      },
    };
  }

  normalizeTeam(category) {
    if (!category) return "townsfolk";

    const normalized = category.toLowerCase();
    switch (normalized) {
      case "townsfolk":
      case "townfolk":
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
      case "traveller":
      case "travellers":
      case "traveler":
      case "travelers":
        return "traveller";
      case "fabled":
        return "fabled";
      default:
        return "townsfolk";
    }
  }

  parseNightOrder(action) {
    if (!action || action === null) return null;
    // This is a simplified parser - in reality you'd want more sophisticated parsing
    // For now, just return null and let the night order be handled separately
    return null;
  }

  formatName(id) {
    return id
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  async writeCharacterFiles() {
    console.log("💾 Writing character files...");

    for (const [id, character] of this.characters) {
      const filename = `${id}.json`;
      const filepath = path.join(CHARACTERS_DIR, filename);

      await fs.writeFile(filepath, JSON.stringify(character, null, 2));
    }

    console.log(`   ✅ Wrote ${this.characters.size} character files`);
  }

  async writeScriptFiles() {
    console.log("📝 Writing script reference files...");

    for (const [scriptId, characterIds] of this.scriptCharacters) {
      // Load existing town.json for metadata
      const townFile = path.join(DATA_DIR, scriptId, "town.json");
      let metadata = {};

      try {
        const townData = await fs.readFile(townFile, "utf8");
        metadata = JSON.parse(townData);
      } catch (error) {
        this.errors.push(
          `${scriptId}: Could not load town.json - ${error.message}`,
        );
      }

      const scriptData = {
        id: scriptId,
        name: metadata.name || this.formatName(scriptId),
        description: metadata.description || "",
        author: metadata.author || "Blood on the Clocktower",
        version: metadata.version || "1.0.0",
        characters: characterIds,
        playerCount: metadata.player_count ||
          metadata.playerCount || {
            min: 5,
            max: 15,
          },
        complexity: metadata.complexity || "intermediate",
        tags: metadata.tags || [],
        estimatedTime: metadata.estimated_time || metadata.estimatedTime,
        characterDistribution:
          metadata.character_distribution || metadata.characterDistribution,
        specialRules: metadata.special_rules || metadata.specialRules,
        setupNotes: metadata.setup_notes || metadata.setupNotes,
        winConditions: metadata.win_conditions || metadata.winConditions,
      };

      const filename = `${scriptId}.json`;
      const filepath = path.join(SCRIPTS_DIR, filename);

      // Ensure directory exists
      const dir = path.dirname(filepath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filepath, JSON.stringify(scriptData, null, 2));
    }

    console.log(`   ✅ Wrote ${this.scriptCharacters.size} script files`);
  }

  async moveToLegacy() {
    console.log("📦 Moving original files to legacy...");

    for (const scriptId of this.scriptCharacters.keys()) {
      const sourcePath = path.join(DATA_DIR, scriptId);
      const targetPath = path.join(LEGACY_DIR, scriptId);

      try {
        // Copy the directory to legacy
        await this.copyDirectory(sourcePath, targetPath);
        console.log(`   📁 Backed up ${scriptId} to legacy/`);
      } catch (error) {
        this.errors.push(`${scriptId}: Failed to backup - ${error.message}`);
      }
    }
  }

  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new CharacterMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = CharacterMigrator;
