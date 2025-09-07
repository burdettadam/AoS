# Centralized Character Database

This directory contains the canonical definitions for all Blood on the Clocktower characters.

## Structure

- `/characters/` - Individual character definition files
- `/scripts/` - Script definition files that reference characters by ID
- `/legacy/` - Original script-specific character files (for migration reference)

## Character Files

Each character is defined in a single file: `{character-id}.json`

Example: `characters/washerwoman.json`

```json
{
  "id": "washerwoman",
  "name": "Washerwoman",
  "team": "townsfolk",
  "ability": "You start knowing that 1 of 2 players is a particular Townsfolk.",
  "firstNight": 35,
  "otherNights": null,
  "reminders": ["Townsfolk", "Wrong"],
  "setup": false,
  "special": null,
  "editions": ["trouble-brewing"],
  "tags": ["information", "setup"],
  "wikiUrl": "https://wiki.bloodontheclocktower.com/Washerwoman",
  "imageUrl": "https://wiki.bloodontheclocktower.com/File:Icon_washerwoman.png"
}
```

## Script Files

Scripts now reference characters by ID instead of containing full definitions:

Example: `scripts/trouble-brewing.json`

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
    "fortune-teller",
    "undertaker",
    "monk",
    "ravenkeeper",
    "virgin",
    "slayer",
    "soldier",
    "mayor",
    "drunk",
    "recluse",
    "saint",
    "butler",
    "poisoner",
    "spy",
    "scarlet-woman",
    "baron",
    "imp"
  ],
  "playerCount": {
    "min": 5,
    "max": 15
  },
  "complexity": "beginner"
}
```

## Benefits

1. **Single Source of Truth**: Each character exists in exactly one place
2. **Consistency**: Character abilities and properties are consistent across scripts
3. **Maintainability**: Updates to a character only need to be made once
4. **Reusability**: Easy to create custom scripts by referencing existing characters
5. **Extensibility**: Easy to add new character properties without breaking existing scripts
