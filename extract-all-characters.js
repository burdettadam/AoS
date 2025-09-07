const fs = require('fs');
const path = require('path');

// Define all script directories
const scriptDirs = [
  'data/trouble-brewing',
  'data/bad-moon-rising', 
  'data/sects-and-violets',
  'data/experimental',
  'data/fabled',
  'data/travellers',
  'data/custom-scripts/catfishing',
  'data/custom-scripts/chaos-theory',
  'data/custom-scripts/greatest-hits',
  'data/custom-scripts/mad-as-a-hatter',
  'data/custom-scripts/no-greater-joy',
  'data/custom-scripts/on-thin-ice'
];

// Ensure output directory exists
const outputDir = 'data/characters';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let totalCharacters = 0;
let processedScripts = 0;

console.log('Extracting characters from all scripts...\n');

for (const scriptDir of scriptDirs) {
  const charactersFile = path.join(scriptDir, 'characters.json');
  
  if (!fs.existsSync(charactersFile)) {
    console.log(`⚠️  Skipping ${scriptDir} - characters.json not found`);
    continue;
  }
  
  try {
    const data = fs.readFileSync(charactersFile, 'utf8');
    let characters;
    
    // Handle different file structures
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      characters = parsed;
    } else if (parsed.characters) {
      characters = parsed.characters;
    } else {
      console.log(`⚠️  Skipping ${scriptDir} - unknown structure`);
      continue;
    }
    
    console.log(`📂 Processing ${scriptDir} (${characters.length} characters)`);
    
    for (const character of characters) {
      const characterFile = path.join(outputDir, `${character.id}.json`);
      
      // Normalize character structure
      const normalizedCharacter = {
        id: character.id,
        name: character.name,
        category: character.category?.toLowerCase() || 'unknown',
        edition: Array.isArray(character.edition) ? character.edition : [character.edition || scriptDir.split('/')[1]],
        ability_summary: character.ability_summary || character.ability || '',
        ability_description: character.ability_description || character.ability || character.ability_summary || '',
        first_night_reminder: character.first_night_reminder || character.first_night_action || '',
        other_night_reminder: character.other_night_reminder || character.other_nights_action || '',
        setup: character.setup || false,
        tokens_used: character.tokens_used || [],
        tags: character.tags || [],
        wiki_url: character.wiki_url || `https://wiki.bloodontheclocktower.com/${character.name?.replace(/\s+/g, '_')}`,
        image_url: character.image_url || ''
      };
      
      // Only create file if it doesn't exist or if this is from a main edition
      const isMainEdition = ['trouble-brewing', 'bad-moon-rising', 'sects-and-violets'].includes(scriptDir.split('/')[1]);
      
      if (!fs.existsSync(characterFile) || isMainEdition) {
        fs.writeFileSync(characterFile, JSON.stringify(normalizedCharacter, null, 2));
        console.log(`  ✅ Created ${character.id}.json`);
        totalCharacters++;
      } else {
        console.log(`  ⏭️  Skipped ${character.id}.json (already exists)`);
      }
    }
    
    processedScripts++;
    
  } catch (error) {
    console.error(`❌ Error processing ${scriptDir}:`, error.message);
  }
}

console.log(`\n🎉 Extraction complete!`);
console.log(`📊 Processed ${processedScripts} scripts`);
console.log(`📝 Created/updated ${totalCharacters} character files`);
console.log(`📁 Characters saved to: ${outputDir}/`);
