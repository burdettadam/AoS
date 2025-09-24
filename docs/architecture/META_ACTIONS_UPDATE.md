# Meta Actions Update Summary

## Changes Made

### Schema Updates (`schemas/script.schema.json`)

- Updated `firstNight` field to support both strings (character IDs) and meta action objects
- Updated `nightOrder` field to support both strings and meta action objects
- Added comprehensive meta action schema with:
  - `id`: Unique identifier for the meta action
  - `type`: Must be "meta" for meta actions
  - `action`: Programmatic action name (e.g., "showTeamToMinions")
  - `description`: Human-readable description
  - `targets`: Array of team types that are affected
  - `information`: Object specifying what information is given
  - `order`: Numeric order for sorting

### Information Schema

The `information` object supports:

- `showPlayersByTeam`: Array of team types ("townsfolk", "outsiders", "minions", "demons")
- `showPlayers`: Array of specific player names/IDs (for future use)
- `showRoles`: Boolean indicating if character types are revealed
- `giveBluffs`: Number of bluff characters to provide
- `customMessage`: String for custom information delivery

### Scripts Updated

#### Core Scripts

1. **trouble-brewing.json** - Updated with structured meta actions
2. **bad-moon-rising.json** - Updated with structured meta actions and corrected night orders
3. **sects-and-violets.json** - Updated with structured meta actions and corrected night orders

#### Custom Scripts

1. **catfishing.json** - Added structured first night order
2. **mad-as-a-hatter.json** - Added structured first night with custom madness setup meta action

### Standard Meta Actions Implemented

#### minion-info

```json
{
  "id": "minion-info",
  "type": "meta",
  "action": "showTeamToMinions",
  "description": "Wake all Minions together. Show them who the other Minions are and who the Demon is",
  "targets": ["minions"],
  "information": {
    "showPlayersByTeam": ["minions", "demons"],
    "showRoles": false
  },
  "order": 1
}
```

#### demon-info

```json
{
  "id": "demon-info",
  "type": "meta",
  "action": "showTeamAndBluffsToDemon",
  "description": "Wake the Demon. Show them who their Minions are. Give them 3 character tokens as bluffs",
  "targets": ["demons"],
  "information": {
    "showPlayersByTeam": ["minions"],
    "showRoles": false,
    "giveBluffs": 3
  },
  "order": 2
}
```

## Benefits for Digital Implementation

1. **No Ambiguity**: Exact specification of what information is given to whom
2. **Programmatic Execution**: Clear action names that can be mapped to code functions
3. **Flexible Information**: Support for both team-based and individual player information
4. **Reusable**: Standard meta actions work across all scripts
5. **Extensible**: Custom meta actions can be added for unique script requirements

## Example Usage in Code

```typescript
function executeMetaAction(action: MetaAction, gameState: GameState) {
  switch (action.action) {
    case "showTeamToMinions":
      const minions = gameState.getPlayersByTeam("minions");
      const demons = gameState.getPlayersByTeam("demons");
      minions.forEach((minion) => {
        minion.showPlayers([...minions.filter((m) => m !== minion), ...demons]);
      });
      break;

    case "showTeamAndBluffsToDemon":
      const demon = gameState.getPlayersByTeam("demons")[0];
      const minionList = gameState.getPlayersByTeam("minions");
      const bluffs = gameState.generateBluffs(action.information.giveBluffs);
      demon.showPlayers(minionList);
      demon.showCharacters(bluffs);
      break;
  }
}
```

This removes all Storyteller interpretation and makes the digital game completely deterministic.
