const fs = require('fs').promises;
const path = require('path');

async function findMissingCharacters() {
  const charactersDir = 'data/characters';
  const legacyDir = 'data/legacy';

  // Get all existing character IDs
  const existingChars = new Set();
  try {
    const files = await fs.readdir(charactersDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        existingChars.add(file.replace('.json', ''));
      }
    }
  } catch (e) {
    console.log('No characters directory found');
  }

  console.log('Existing characters:', existingChars.size);

  // Get all character references from custom scripts
  const customScriptsPath = path.join(legacyDir, 'custom-scripts');
  const missingChars = new Set();

  try {
    const customDirs = await fs.readdir(customScriptsPath);
    for (const dir of customDirs) {
      const charsFile = path.join(customScriptsPath, dir, 'characters.json');
      try {
        const data = await fs.readFile(charsFile, 'utf8');
        const chars = JSON.parse(data);
        for (const charId of chars) {
          if (!existingChars.has(charId)) {
            missingChars.add(charId);
          }
        }
      } catch (e) {
        // Skip if file doesn't exist
      }
    }
  } catch (e) {
    console.log('No custom scripts found');
  }

  console.log('Missing characters:', Array.from(missingChars).sort());
}

findMissingCharacters();
