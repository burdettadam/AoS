# Blood on the Clocktower - Data Architecture Migration

## Overview

This document outlines the migration from script-specific character definitions to a centralized character database architecture. This change eliminates data duplication and provides a single source of truth for character definitions.

## Architecture Changes

### Before (Legacy System)
```
data/
├── trouble-brewing/
│   ├── characters.json    # Full character definitions
│   └── town.json         # Script metadata
├── bad-moon-rising/
│   ├── characters.json    # Duplicate character definitions
│   └── town.json
└── ...
```

### After (Centralized System)
```
data/
├── characters/           # 🆕 Centralized character database
│   ├── README.md
│   ├── washerwoman.json
│   ├── empath.json
│   ├── grandmother.json
│   └── ...
├── scripts/             # 🆕 Script definitions with character references
│   ├── trouble-brewing.json
│   ├── bad-moon-rising.json
│   └── ...
└── [legacy folders remain for backward compatibility]
```

## Character Database Structure

### Individual Character Files (`data/characters/*.json`)
```json
{
  "id": "washerwoman",
  "name": "Washerwoman",
  "category": "townsfolk",
  "edition": ["trouble-brewing"],
  "ability_summary": "You start knowing that 1 of 2 players is a particular Townsfolk.",
  "ability_description": "You start knowing that 1 of 2 players is a particular Townsfolk.",
  "first_night_reminder": "Show the Washerwoman a Townsfolk token and point to two players, one of which has this character.",
  "other_night_reminder": "",
  "setup": false,
  "tokens_used": ["TOWNSFOLK", "WRONG"],
  "tags": ["information", "setup"],
  "wiki_url": "https://wiki.bloodontheclocktower.com/Washerwoman",
  "image_url": ""
}
```

### Script Reference Files (`data/scripts/*.json`)
```json
{
  "id": "trouble-brewing",
  "name": "Trouble Brewing",
  "description": "The original Blood on the Clocktower script...",
  "characters": [
    "washerwoman",
    "librarian", 
    "investigator",
    "chef",
    "empath",
    "imp"
  ],
  "playerCount": {
    "min": 5,
    "max": 15,
    "optimal": "7-10"
  },
  "complexity": "beginner"
}
```

## Migration Process

### 1. Character Extraction
- Extract all unique characters from script-specific files
- Normalize character data structure
- Create individual files in `data/characters/`
- Handle conflicting definitions (prefer main edition versions)

### 2. Script References
- Create new script files that reference character IDs
- Include script metadata (player counts, complexity, etc.)
- Maintain backward compatibility with old format

### 3. System Updates
- Update `CharacterDatabase` service to load centralized characters
- Enhance `ScriptCache` to support both old and new formats
- Graceful fallback to legacy system when needed

## Implementation Status

### ✅ Completed
- [x] Centralized character database service
- [x] Updated script cache to support both formats  
- [x] Sample character files (washerwoman, empath, grandmother, sailor, clockmaker, dreamer, imp)
- [x] Sample script files (trouble-brewing, bad-moon-rising, sects-and-violets)
- [x] Backward compatibility with legacy format
- [x] Build system verification

### 🔄 In Progress
- [ ] Complete character extraction from all scripts
- [ ] Validate all character data consistency
- [ ] Performance testing with large character database

### 📋 Next Steps
1. **Complete Migration**: Extract all characters from remaining scripts
2. **Data Validation**: Ensure character definitions are consistent
3. **Performance Optimization**: Cache character lookups for faster script loading
4. **Legacy Cleanup**: Eventually remove duplicate character definitions

## Benefits

### 🎯 Single Source of Truth
- Characters defined once, referenced everywhere
- Consistent character data across all scripts
- Easier maintenance and updates

### 🚀 Performance
- Faster script loading (character data shared)
- Reduced memory usage (no duplicate character objects)
- Efficient character lookups by ID

### 🔧 Maintainability  
- Clear separation between character definitions and script compositions
- Easier to add new characters or modify existing ones
- Better data validation and consistency checks

### 🔄 Flexibility
- Support for custom scripts with mixed character sets
- Easy character sharing between different script variations
- Future-proof architecture for character updates

## Usage Examples

### Loading Characters in Script Cache
```typescript
// New centralized approach
const characters = characterDatabase.getCharacters(['washerwoman', 'empath', 'imp']);

// Legacy fallback still supported
const legacyCharacters = await this.loadLegacyCharacters(scriptPath);
```

### Character Database Operations
```typescript
// Get specific character
const washerwoman = characterDatabase.getCharacter('washerwoman');

// Get all characters from an edition
const troubleBrewingChars = characterDatabase.getCharactersByEdition('trouble-brewing');

// Get multiple characters by IDs
const scriptChars = characterDatabase.getCharacters(['washerwoman', 'empath', 'imp']);
```

## Migration Commands

```bash
# Extract characters from all scripts (if needed)
node migrate-characters.js

# Test migration results
node test-migration.js

# Validate character database
node validate-characters.js
```

## Backward Compatibility

The system maintains full backward compatibility:
- Legacy character files continue to work
- New centralized database is loaded when available
- Graceful fallback for missing character definitions
- No breaking changes to existing APIs

## Future Enhancements

1. **Character Versioning**: Track character ability changes over time
2. **Validation Rules**: Ensure character combinations are valid
3. **Auto-generation**: Generate character cards and documentation from database
4. **API Endpoints**: Expose character database through REST API
5. **Character Search**: Full-text search across character abilities and names

---

This migration represents a significant improvement in the data architecture, providing better maintainability, performance, and consistency across the entire Blood on the Clocktower digital platform.
