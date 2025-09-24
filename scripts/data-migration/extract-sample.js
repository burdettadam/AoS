const fs = require("fs");
const path = require("path");

// Extract characters from Bad Moon Rising first (it has the most complete data)
console.log("Extracting characters from Bad Moon Rising...");

try {
  const bmrPath = "data/bad-moon-rising/characters.json";
  const characters = JSON.parse(fs.readFileSync(bmrPath, "utf8"));

  console.log(`Found ${characters.length} characters in Bad Moon Rising`);

  // Extract each character
  for (let i = 0; i < Math.min(10, characters.length); i++) {
    const char = characters[i];
    const filePath = `data/characters/${char.id}.json`;

    const normalizedChar = {
      id: char.id,
      name: char.name,
      category: char.category,
      edition: char.edition,
      ability_summary: char.ability_summary,
      ability_description: char.ability_description,
      first_night_reminder: char.first_night_reminder,
      other_night_reminder: char.other_night_reminder,
      setup: char.setup,
      tokens_used: char.tokens_used,
      tags: char.tags,
      wiki_url:
        char.wiki_url ||
        `https://wiki.bloodontheclocktower.com/${char.name.replace(/\s+/g, "_")}`,
      image_url: char.image_url || "",
    };

    fs.writeFileSync(filePath, JSON.stringify(normalizedChar, null, 2));
    console.log(`Created ${char.id}.json`);
  }

  console.log("Sample extraction complete!");
} catch (error) {
  console.error("Error:", error.message);
}
