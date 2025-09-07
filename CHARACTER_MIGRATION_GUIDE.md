# Character Migration Guide: From Hard-coded Strings to Parameterized Actions

## Overview
This guide provides a systematic approach to migrate all character definitions from hard-coded string actions to the new parameterized action system.

## Current Structure Analysis
Characters currently use string-based actions in two places:
1. **Goal section**: `"action": "countEvilPairs"`
2. **Actions section**: `"action": "learnEvilPairsCount"`

## New Parameterized Structure
The new system uses enums and structured definitions:

```json
{
  "actionType": "LEARN_EVIL_PAIRS_COUNT",
  "selection": {
    "type": "ADJACENT_PLAYERS",
    "criteria": { "count": 2, "mustBeAlive": true }
  },
  "effects": [{
    "type": "LEARN_INFORMATION",
    "target": "SELF",
    "duration": "IMMEDIATE"
  }]
}
```

## Migration Steps

### Step 1: Map String Actions to Enums
Use this mapping table to convert string actions:

| Old String | New Enum | Description |
|------------|----------|-------------|
| `countEvilPairs` | `LEARN_EVIL_PAIRS_COUNT` | Learn evil adjacency pairs |
| `detectDemon` | `DETECT_DEMON` | Check if player is demon |
| `killPlayers` | `KILL_PLAYER` | Kill a target player |
| `poisonPlayer` | `POISON_PLAYER` | Poison a target player |
| `protectPlayer` | `PROTECT_PLAYER` | Protect from attacks |
| `learnAlignment` | `LEARN_ALIGNMENT` | Learn player alignment |
| `chooseCharacter` | `CHOOSE_CHARACTER` | Choose from character list |
| `registerAsEvil` | `REGISTER_AS_EVIL` | Register as evil to others |
| `blockAbility` | `BLOCK_ABILITY` | Block another ability |
| `swapPlayers` | `SWAP_PLAYERS` | Swap two players |
| `learnRole` | `LEARN_ROLE` | Learn exact role |
| `nominatePlayer` | `NOMINATE_PLAYER` | Nominate for execution |
| `votePlayer` | `VOTE_PLAYER` | Vote for execution |
| `revealRole` | `REVEAL_ROLE` | Reveal character role |
| `wakePlayer` | `WAKE_PLAYER` | Wake player at night |
| `sleepPlayer` | `SLEEP_PLAYER` | Put player to sleep |
| `assignRedHerring` | `ASSIGN_RED_HERRING` | Assign false positive |
| `chooseMaster` | `CHOOSE_MASTER` | Choose cult master |
| `convertPlayer` | `CONVERT_PLAYER` | Convert to cult |
| `learnNeighbors` | `LEARN_NEIGHBORS` | Learn neighbor info |
| `learnGrimoire` | `LEARN_GRIMOire` | Learn grimoire info |
| `chooseTraveler` | `CHOOSE_TRAVELER` | Choose traveler role |
| `executePlayer` | `EXECUTE_PLAYER` | Execute a player |
| `resurrectPlayer` | `RESURRECT_PLAYER` | Bring player back |
| `silencePlayer` | `SILENCE_PLAYER` | Silence a player |
| `drunkPlayer` | `DRUNK_PLAYER` | Make player drunk |
| `cleanPlayer` | `CLEAN_PLAYER` | Clean poison/death |

### Step 2: Convert Selection Criteria
Replace string targets with structured selection objects:

| Old Target String | New Selection Type | Criteria |
|-------------------|-------------------|----------|
| `"all"` | `"ALL_PLAYERS"` | `{}` |
| `"any"` | `"ANY_PLAYER"` | `{}` |
| `"living"` | `"LIVING_PLAYERS"` | `{"mustBeAlive": true}` |
| `"dead"` | `"DEAD_PLAYERS"` | `{"mustBeAlive": false}` |
| `"neighbors"` | `"ADJACENT_PLAYERS"` | `{"count": 2}` |
| `"self"` | `"SELF"` | `{}` |
| `"demon"` | `"DEMON"` | `{}` |
| `"minions"` | `"MINIONS"` | `{}` |
| `"townsfolk"` | `"TOWNSFOLK"` | `{}` |
| `"outsiders"` | `"OUTSIDERS"` | `{}` |

### Step 3: Convert Effects
Replace string effects with structured effect objects:

| Old Effect | New Effect Type | Target | Duration |
|------------|-----------------|--------|----------|
| `"learn"` | `"LEARN_INFORMATION"` | `"SELF"` | `"IMMEDIATE"` |
| `"kill"` | `"KILL_PLAYER"` | `"TARGET"` | `"IMMEDIATE"` |
| `"poison"` | `"APPLY_STATUS"` | `"TARGET"` | `"NIGHT"` |
| `"protect"` | `"GRANT_IMMUNITY"` | `"TARGET"` | `"NIGHT"` |
| `"block"` | `"BLOCK_ABILITY"` | `"TARGET"` | `"NIGHT"` |
| `"convert"` | `"CHANGE_TEAM"` | `"TARGET"` | `"PERMANENT"` |
| `"silence"` | `"SILENCE_PLAYER"` | `"TARGET"` | `"DAY"` |
| `"drunk"` | `"APPLY_STATUS"` | `"TARGET"` | `"PERMANENT"` |

### Step 4: Update Action Structure
Replace the old actions section with the new parameterized format:

```json
"actions": {
  "firstNight": [
    {
      "id": "chef-info",
      "actionType": "LEARN_EVIL_PAIRS_COUNT",
      "selection": {
        "type": "ADJACENT_PLAYERS",
        "criteria": { "count": 2, "mustBeAlive": true }
      },
      "effects": [{
        "type": "LEARN_INFORMATION",
        "target": "SELF",
        "duration": "IMMEDIATE"
      }],
      "description": "Storyteller shows a number equal to evil adjacency pairs",
      "order": 1
    }
  ]
}
```

## Migration Priority Order

### High Priority (Core TB Characters)
1. **Chef** - Information gathering
2. **Fortune Teller** - Information gathering
3. **Imp** - Core demon mechanics
4. **Monk** - Protection mechanics
5. **Ravenkeeper** - Information gathering
6. **Empath** - Information gathering
7. **Washerwoman** - Information gathering
8. **Librarian** - Information gathering
9. **Investigator** - Information gathering
10. **Virgin** - Nomination mechanics

### Medium Priority (Common Characters)
11-50. Standard townsfolk, outsiders, minions

### Low Priority (Rare Characters)
51+. Exotic characters, travelers, special editions

## Validation Checklist

After migrating each character:
- [ ] Action types use correct enums from `CharacterActionType`
- [ ] Selection criteria match the character's ability
- [ ] Effects properly describe the action's impact
- [ ] Target types are appropriate (`SELF`, `TARGET`, `ALL_PLAYERS`, etc.)
- [ ] Duration is correct (`IMMEDIATE`, `NIGHT`, `DAY`, `PERMANENT`)
- [ ] Order values are sequential and logical
- [ ] Description accurately reflects the action
- [ ] Test with the action system validation

## Tools Available

Run these commands to validate your work:

```bash
# Test all actions
node test-all-actions.js

# Test specific character
node scripts/test-action-system.ts

# Run enhanced TB test
./run-enhanced-tb-test.js
```

## Example Migrations

See `examples/chef-refactored.json` for a complete migration example.

## Getting Help

If you're unsure about a particular action mapping:
1. Check the enum definitions in `packages/shared/src/game-definitions.ts`
2. Look at existing migrated examples
3. Run the test suite to validate your changes
4. Ask for clarification on complex cases
