// import { loadScript, LoadedScript, Character } from './src/services/scriptCache';
import { NodeScriptDataSource } from "./src/data/nodeScriptDataSource";

/**
 * Demo script showing the improved TypeScript data loading for Blood on the Clocktower scripts
 */
async function demonstrateScriptLoading() {
  console.log("🎲 Blood on the Clocktower - Enhanced Script Loading Demo\n");

  // Initialize the script loader with TypeScript types
  const scriptLoader = new ScriptLoader(new NodeScriptDataSource());

  try {
    // Load a specific script with full type safety
    console.log("📜 Loading Trouble Brewing script...");
    const troubleBrewing = await scriptLoader.loadScript("trouble-brewing");

    console.log(
      `✅ Loaded "${troubleBrewing.name}" with ${troubleBrewing.characters.length} characters`,
    );

    // Demonstrate type-safe character access
    const washerwoman = troubleBrewing.characters.find(
      (char) => char.id === "washerwoman",
    );
    if (washerwoman) {
      console.log(`\n🔍 Example Character: ${washerwoman.name}`);
      console.log(`   Team: ${washerwoman.team}`);
      console.log(`   Ability: ${washerwoman.ability}`);
      console.log(
        `   Reminders: ${washerwoman.reminders?.join(", ") || "None"}`,
      );
    }

    // Load a custom script
    console.log("\n📜 Loading custom script...");
    const customScript = await scriptLoader.loadScript(
      "custom-scripts/catfishing",
    );

    console.log(
      `✅ Loaded "${customScript.name}" with ${customScript.characters.length} characters`,
    );
    if (customScript.meta) {
      console.log(`   Author: ${customScript.meta.author || "Unknown"}`);
      console.log(
        `   Players: ${customScript.meta.playerCount?.min}-${customScript.meta.playerCount?.max}`,
      );
      console.log(
        `   Complexity: ${customScript.meta.complexity || "Unknown"}`,
      );
    }

    // Demonstrate character filtering by team
    const demons = customScript.characters.filter(
      (char) => char.team === "demon",
    );
    console.log(`   Demons: ${demons.map((d) => d.name).join(", ")}`);

    // Load all available scripts
    console.log("\n📚 Loading all available scripts...");
    const allScripts = await scriptLoader.getAllScripts();

    console.log(`✅ Found ${allScripts.length} scripts:`);
    allScripts.forEach((script) => {
      const characterCount = script.characters.length;
      const teams = [...new Set(script.characters.map((c) => c.team))];
      console.log(
        `   • ${script.name} (${characterCount} characters, teams: ${teams.join(", ")})`,
      );
    });

    // Demonstrate script statistics
    console.log("\n📊 Script Statistics:");
    const totalCharacters = allScripts.reduce(
      (total, script) => total + script.characters.length,
      0,
    );
    const teamCounts = allScripts.reduce(
      (counts, script) => {
        script.characters.forEach((char) => {
          counts[char.team] = (counts[char.team] || 0) + 1;
        });
        return counts;
      },
      {} as Record<string, number>,
    );

    console.log(`   Total Characters: ${totalCharacters}`);
    console.log(`   By Team:`);
    Object.entries(teamCounts).forEach(([team, count]) => {
      console.log(`     ${team}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Error loading scripts:", error);
  }
}

/**
 * Demo showing character validation and transformation
 */
function demonstrateCharacterValidation() {
  console.log("\n🔧 Character Validation Demo\n");

  // Example of legacy JSON data format
  const legacyCharacterData = {
    id: "empath",
    name: "Empath",
    category: "Townsfolk",
    edition: ["Trouble Brewing"],
    ability_summary:
      "Each night, you learn how many of your 2 alive neighbors are evil.",
    first_night_action:
      "The Empath learns how many of their 2 alive neighbors are evil.",
    other_nights_action:
      "The Empath learns how many of their 2 alive neighbors are evil.",
    day_action: null,
    tags: ["information", "neighbor_dependent"],
    tokens_used: ["0", "1", "2"],
    wiki_url: "https://wiki.bloodontheclocktower.com/Empath",
    image_url: "https://wiki.bloodontheclocktower.com/File:Icon_empath.png",
  };

  console.log(
    "📝 Legacy JSON format:",
    JSON.stringify(legacyCharacterData, null, 2),
  );

  // The ScriptLoader automatically transforms this to the new format
  console.log("\n✨ After TypeScript transformation:");
  console.log('   - category "Townsfolk" → team "townsfolk"');
  console.log("   - ability_summary → ability");
  console.log("   - tokens_used → reminders");
  console.log("   - Automatic type validation and safety");

  console.log("\n🛡️  Benefits of TypeScript approach:");
  console.log("   • Type safety at compile time");
  console.log("   • Better IDE support (autocomplete, refactoring)");
  console.log("   • Automatic data validation");
  console.log("   • Self-documenting interfaces");
  console.log("   • Backward compatibility with existing JSON");
  console.log("   • Runtime type checking");
}

// Run the demonstration
if (require.main === module) {
  demonstrateScriptLoading()
    .then(() => demonstrateCharacterValidation())
    .catch(console.error);
}

export { demonstrateCharacterValidation, demonstrateScriptLoading };
