const fs = require('fs');
const path = require('path');

console.log('🔄 Complete Data Migration to New Architecture');
console.log('============================================\n');

// Helper function to read JSON file safely
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.log(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Create a comprehensive script that will populate the entire new system
const scriptConfigs = [
  {
    id: 'trouble-brewing',
    name: 'Trouble Brewing',
    legacyPath: 'data/trouble-brewing',
    description: 'The original Blood on the Clocktower script, perfect for beginners.',
    complexity: 'beginner',
    tags: ['official', 'beginner', 'base-set']
  },
  {
    id: 'bad-moon-rising', 
    name: 'Bad Moon Rising',
    legacyPath: 'data/bad-moon-rising',
    description: 'Death is only the beginning. A complex script where dead players remain highly influential.',
    complexity: 'advanced',
    tags: ['official', 'advanced', 'death-tokens']
  },
  {
    id: 'sects-and-violets',
    name: 'Sects & Violets', 
    legacyPath: 'data/sects-and-violets',
    description: 'Trust no one. A highly complex script built around madness.',
    complexity: 'expert',
    tags: ['official', 'expert', 'madness', 'complex']
  }
];

// Ensure directories exist
const charactersDir = 'data/characters';
const scriptsDir = 'data/scripts';
if (!fs.existsSync(charactersDir)) fs.mkdirSync(charactersDir, { recursive: true });
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });

const allCharacters = new Map();
const allScripts = [];

console.log('📚 Processing scripts and extracting characters...\n');

// Process each script
for (const config of scriptConfigs) {
  console.log(`📂 Processing ${config.name}...`);
  
  const charactersFile = path.join(config.legacyPath, 'characters.json');
  const townFile = path.join(config.legacyPath, 'town.json');
  
  const charactersData = readJsonFile(charactersFile);
  const townData = readJsonFile(townFile);
  
  if (!charactersData) {
    console.log(`  ⚠️  No characters.json found for ${config.name}`);
    continue;
  }
  
  // Extract characters
  let characters = [];
  if (Array.isArray(charactersData)) {
    characters = charactersData;
  } else if (charactersData.characters) {
    characters = charactersData.characters;
  }
  
  const scriptCharacterIds = [];
  
  console.log(`  Found ${characters.length} characters`);
  
  // Process each character
  for (const char of characters) {
    if (!char.id) continue;
    
    scriptCharacterIds.push(char.id);
    
    // Only add if we don't have this character yet
    if (!allCharacters.has(char.id)) {
      const normalizedChar = {
        id: char.id,
        name: char.name || char.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: char.category?.toLowerCase() || 'townsfolk',
        edition: Array.isArray(char.edition) ? char.edition : [config.id],
        ability_summary: char.ability_summary || char.abilitySummary || char.ability || '',
        ability_description: char.ability_description || char.ability || char.ability_summary || '',
        first_night_reminder: char.first_night_reminder || char.firstNightAction || '',
        other_night_reminder: char.other_night_reminder || char.otherNightsAction || '',
        setup: char.setup || false,
        tokens_used: char.tokens_used || char.tokensUsed || [],
        tags: char.tags || [],
        wiki_url: char.wiki_url || char.wikiUrl || `https://wiki.bloodontheclocktower.com/${char.name?.replace(/\s+/g, '_')}`,
        image_url: char.image_url || char.imageUrl || ''
      };
      
      allCharacters.set(char.id, normalizedChar);
      console.log(`    ✅ ${char.id}`);
    } else {
      console.log(`    ⏭️  ${char.id} (already exists)`);
    }
  }
  
  // Create script metadata
  const scriptMeta = {
    id: config.id,
    name: config.name,
    description: townData?.description || config.description,
    author: townData?.author || 'Blood on the Clocktower',
    version: townData?.version || '1.0.0',
    characters: scriptCharacterIds,
    playerCount: {
      min: townData?.min_players || 5,
      max: townData?.max_players || 15,
      optimal: townData?.optimal_players || '7-10'
    },
    complexity: config.complexity,
    estimatedTime: townData?.estimated_time || '60-90 minutes',
    tags: config.tags,
    characterDistribution: getCharacterDistribution(characters),
    specialRules: townData?.special_rules || [],
    setupNotes: townData?.setup_notes || 'Standard setup rules apply.',
    winConditions: {
      good: 'Execute all Demons',
      evil: 'Equal or outnumber good players, or only Demons remain alive'
    }
  };
  
  allScripts.push(scriptMeta);
  console.log(`  📜 Script metadata created\n`);
}

console.log('💾 Writing character files...');
for (const [id, character] of allCharacters) {
  const filePath = path.join(charactersDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(character, null, 2));
  console.log(`  ✅ ${id}.json`);
}

console.log('\n📜 Writing script files...');
for (const script of allScripts) {
  const filePath = path.join(scriptsDir, `${script.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(script, null, 2));
  console.log(`  ✅ ${script.id}.json`);
}

console.log(`\n🎉 Migration Complete!`);
console.log(`📊 Results:`);
console.log(`  - ${allCharacters.size} characters extracted`);
console.log(`  - ${allScripts.length} scripts created`);
console.log(`  - Ready for new architecture!`);

function getCharacterDistribution(characters) {
  const dist = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
  characters.forEach(char => {
    const cat = char.category?.toLowerCase();
    if (cat === 'townsfolk') dist.townsfolk++;
    else if (cat === 'outsider') dist.outsiders++;
    else if (cat === 'minion') dist.minions++;
    else if (cat === 'demon') dist.demons++;
  });
  return dist;
}
