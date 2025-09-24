const fs = require("fs");
const path = require("path");

console.log("🚀 Full Migration to Centralized Character Database");
console.log("================================================\n");

// Define all script directories to process
const scriptDirs = [
  "data/trouble-brewing",
  "data/bad-moon-rising",
  "data/sects-and-violets",
  "data/experimental",
  "data/fabled",
  "data/travellers",
  "data/custom-scripts/catfishing",
  "data/custom-scripts/chaos-theory",
  "data/custom-scripts/greatest-hits",
  "data/custom-scripts/mad-as-a-hatter",
  "data/custom-scripts/no-greater-joy",
  "data/custom-scripts/on-thin-ice",
];

// Ensure output directories exist
const charactersDir = "data/characters";
const scriptsDir = "data/scripts";
if (!fs.existsSync(charactersDir)) {
  fs.mkdirSync(charactersDir, { recursive: true });
}
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true });
}

let totalCharacters = 0;
let totalScripts = 0;
const allCharacters = new Map(); // To track all unique characters
const scriptData = new Map(); // To track script metadata

console.log("📚 Step 1: Extracting all characters from scripts...\n");

// Process each script directory
for (const scriptDir of scriptDirs) {
  const charactersFile = path.join(scriptDir, "characters.json");
  const townFile = path.join(scriptDir, "town.json");

  if (!fs.existsSync(charactersFile)) {
    console.log(`⚠️  Skipping ${scriptDir} - characters.json not found`);
    continue;
  }

  try {
    // Load characters
    const charactersData = fs.readFileSync(charactersFile, "utf8");
    const townData = fs.existsSync(townFile)
      ? JSON.parse(fs.readFileSync(townFile, "utf8"))
      : {};

    let characters;
    const parsed = JSON.parse(charactersData);
    if (Array.isArray(parsed)) {
      characters = parsed;
    } else if (parsed.characters) {
      characters = parsed.characters;
    } else {
      console.log(`⚠️  Skipping ${scriptDir} - unknown structure`);
      continue;
    }

    const scriptId = scriptDir.split("/").pop();
    const scriptName =
      townData.name ||
      scriptId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    console.log(
      `📂 Processing ${scriptName} (${characters.length} characters)`,
    );

    const scriptCharacterIds = [];

    // Process each character
    for (const character of characters) {
      if (!character.id) {
        console.log(`  ⚠️  Skipping character without ID in ${scriptName}`);
        continue;
      }

      // Normalize character structure
      const normalizedCharacter = {
        id: character.id,
        name:
          character.name ||
          character.id
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        category: character.category?.toLowerCase() || "townsfolk",
        edition: Array.isArray(character.edition)
          ? character.edition
          : [scriptId],
        ability_summary:
          character.ability_summary ||
          character.abilitySummary ||
          character.ability ||
          "",
        ability_description:
          character.ability_description ||
          character.ability ||
          character.ability_summary ||
          "",
        first_night_reminder:
          character.first_night_reminder ||
          character.firstNightAction ||
          character.first_night_action ||
          "",
        other_night_reminder:
          character.other_night_reminder ||
          character.otherNightsAction ||
          character.other_nights_action ||
          "",
        setup: character.setup || false,
        tokens_used: character.tokens_used || character.tokensUsed || [],
        tags: character.tags || [],
        wiki_url:
          character.wiki_url ||
          character.wikiUrl ||
          `https://wiki.bloodontheclocktower.com/${character.name?.replace(/\s+/g, "_")}`,
        image_url: character.image_url || character.imageUrl || "",
      };

      // Add to script character list
      scriptCharacterIds.push(character.id);

      // Update character if this is from a main edition or if character doesn't exist
      const isMainEdition = [
        "trouble-brewing",
        "bad-moon-rising",
        "sects-and-violets",
      ].includes(scriptId);
      const existingChar = allCharacters.get(character.id);

      if (!existingChar || isMainEdition) {
        allCharacters.set(character.id, normalizedCharacter);
        console.log(`  ✅ ${character.id}`);
        totalCharacters++;
      } else {
        // Update edition list if character exists
        if (!existingChar.edition.includes(scriptId)) {
          existingChar.edition.push(scriptId);
        }
        console.log(`  🔄 ${character.id} (updated editions)`);
      }
    }

    // Store script metadata
    const scriptMetadata = {
      id: scriptId,
      name: scriptName,
      description:
        townData.description ||
        townData.summary ||
        `${scriptName} script for Blood on the Clocktower.`,
      author: townData.author || "Blood on the Clocktower",
      version: townData.version || "1.0.0",
      characters: scriptCharacterIds,
      playerCount: {
        min: townData.min_players || townData.player_count?.min || 5,
        max: townData.max_players || townData.player_count?.max || 15,
        optimal:
          townData.optimal_players || townData.player_count?.optimal || "7-10",
      },
      complexity: getComplexity(scriptId),
      estimatedTime: townData.estimated_time || "60-90 minutes",
      tags: townData.tags || getDefaultTags(scriptId),
      characterDistribution: getCharacterDistribution(characters),
      specialRules: townData.special_rules || [],
      setupNotes: townData.setup_notes || "Standard setup rules apply.",
      winConditions: {
        good: "Execute all Demons",
        evil: "Equal or outnumber good players, or only Demons remain alive",
      },
    };

    scriptData.set(scriptId, scriptMetadata);
    totalScripts++;
  } catch (error) {
    console.error(`❌ Error processing ${scriptDir}:`, error.message);
  }
}

console.log(`\n📝 Step 2: Writing ${allCharacters.size} character files...\n`);

// Write all character files
for (const [characterId, characterData] of allCharacters) {
  const filePath = path.join(charactersDir, `${characterId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(characterData, null, 2));
  console.log(`  ✅ ${characterId}.json`);
}

console.log(`\n📜 Step 3: Writing ${scriptData.size} script files...\n`);

// Write all script files
for (const [scriptId, metadata] of scriptData) {
  const filePath = path.join(scriptsDir, `${scriptId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
  console.log(`  ✅ ${scriptId}.json`);
}

console.log(`\n🎉 Migration Complete!`);
console.log(`📊 Statistics:`);
console.log(`  - ${allCharacters.size} unique characters extracted`);
console.log(`  - ${scriptData.size} scripts converted`);
console.log(`  - Characters saved to: ${charactersDir}/`);
console.log(`  - Scripts saved to: ${scriptsDir}/`);

// Helper functions
function getComplexity(scriptId) {
  const complexityMap = {
    "trouble-brewing": "beginner",
    "bad-moon-rising": "advanced",
    "sects-and-violets": "expert",
    experimental: "expert",
    fabled: "intermediate",
    travellers: "intermediate",
    "no-greater-joy": "beginner",
    catfishing: "intermediate",
    "chaos-theory": "expert",
    "greatest-hits": "intermediate",
    "mad-as-a-hatter": "expert",
    "on-thin-ice": "intermediate",
  };
  return complexityMap[scriptId] || "intermediate";
}

function getDefaultTags(scriptId) {
  const tagMap = {
    "trouble-brewing": ["official", "beginner", "base-set"],
    "bad-moon-rising": ["official", "advanced", "death-tokens"],
    "sects-and-violets": ["official", "expert", "madness", "complex"],
    experimental: ["official", "experimental"],
    fabled: ["official", "fabled"],
    travellers: ["official", "travellers"],
  };
  return tagMap[scriptId] || ["custom"];
}

function getCharacterDistribution(characters) {
  const distribution = {
    townsfolk: 0,
    outsiders: 0,
    minions: 0,
    demons: 0,
    fabled: 0,
    travellers: 0,
  };

  characters.forEach((char) => {
    const category = char.category?.toLowerCase();
    if (category === "townsfolk") distribution.townsfolk++;
    else if (category === "outsider") distribution.outsiders++;
    else if (category === "minion") distribution.minions++;
    else if (category === "demon") distribution.demons++;
    else if (category === "fabled") distribution.fabled++;
    else if (category === "traveller") distribution.travellers++;
  });

  return distribution;
}
