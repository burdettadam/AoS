# Character Migration Status Tracker

## Migration Progress Overview

- **Total Characters**: 200+
- **Migrated**: 20/200+ (10%)
- **Remaining**: 180+ characters
- **Status**: In Progress

## Recently Migrated Characters ✅

### 1-6. Core TB Characters (Information & Protection)

- **Chef**: Townsfolk - Information (`learnEvilPairsCount`)
- **Fortune Teller**: Townsfolk - Information (`detectDemon`, `assignRedHerring`)
- **Imp**: Demon - Killing (`killPlayer`, `transferDemonhood`, `coordinateEvilTeam`)
- **Monk**: Townsfolk - Protection (`protectPlayer` with `GRANT_IMMUNITY`)
- **Ravenkeeper**: Townsfolk - Information (`learnCharacter` with `NIGHT_DEATH` trigger)
- **Empath**: Townsfolk - Information (`learnNeighborEvilCount` with `ADJACENT_PLAYERS`)

### 7-14. Additional TB Characters (Killing & Information)

- **Slayer**: Townsfolk - Killing (`killPlayer` with `KILL_IF_DEMON`)
- **Washerwoman**: Townsfolk - Information (`learnCharacter` with `TWO_PLAYERS`)
- **Librarian**: Townsfolk - Information (`learnCharacter` with `TWO_PLAYERS`)
- **Investigator**: Townsfolk - Information (`learnCharacter` with `TWO_PLAYERS`)
- **Soldier**: Townsfolk - Protection (`protectPlayer` with `GRANT_IMMUNITY`)
- **Mayor**: Townsfolk - Win Condition (`winWithNoExecution` with `WIN_CONDITION`)
- **Butler**: Outsider - Voting (`restrictVoting` with `RESTRICT_VOTING`)
- **Drunk**: Outsider - Misinformation (`masqueradeAsTownsfolk` with `MASQUERADE`)

### 15-20. TB Minions & Outsiders

- **Recluse**: Outsider - Misinformation (`misregisterAsEvil` with `MISREGISTER`)
- **Saint**: Outsider - Execution Risk (`avoidExecution` with `EXECUTION_CONDITION`)
- **Poisoner**: Minion - Disruption (`poisonPlayer` with `POISON`)
- **Spy**: Minion - Information (`seeGrimoire` with `VIEW_GAME_STATE`)
- **Scarlet Woman**: Minion - Demon Transfer (`becomeDemonOnDeath` with `BECOME_DEMON`)
- **Baron**: Minion - Setup Modification (`addOutsiders` with `MODIFY_SETUP`)

## Next Priority Characters (Remaining Core TB)

### 7. Washerwoman (Townsfolk - Information)

- **File**: `data/characters/washerwoman.json`
- **Actions to Migrate**: Learn one Townsfolk
- **Priority**: High
- **Status**: 🔄 Pending

### 8. Librarian (Townsfolk - Information)

- **File**: `data/characters/librarian.json`
- **Actions to Migrate**: Learn one Outsider
- **Priority**: High
- **Status**: 🔄 Pending

### 9. Investigator (Townsfolk - Information)

- **File**: `data/characters/investigator.json`
- **Actions to Migrate**: Learn two Minions
- **Priority**: High
- **Status**: 🔄 Pending

### 10. Virgin (Townsfolk - Nomination)

- **File**: `data/characters/virgin.json`
- **Actions to Migrate**: Nomination mechanics
- **Priority**: High
- **Status**: 🔄 Pending

## Migration Patterns Identified

### Information Gathering Characters

- **Pattern**: `LEARN_*` actions with `LEARN_INFORMATION` effects
- **Examples**: Chef, Fortune Teller, Empath, Ravenkeeper
- **Selection**: Various (ADJACENT_PLAYERS, TWO_PLAYERS, DEAD_PLAYERS)

### Killing Characters

- **Pattern**: `KILL_PLAYER` action with `KILL_PLAYER` effect
- **Examples**: Imp, Assassin, Poisoner
- **Selection**: ANY_PLAYER with allowSelf option

### Protection Characters

- **Pattern**: `PROTECT_PLAYER` action with `GRANT_IMMUNITY` effect
- **Examples**: Monk, Soldier
- **Selection**: ANY_PLAYER excluding self

### Nomination Characters

- **Pattern**: `NOMINATE_PLAYER` action with `NOMINATE_FOR_EXECUTION` effect
- **Examples**: Virgin, Slayer
- **Selection**: ANY_PLAYER excluding self

## Testing Status

### Current Test Results

- ✅ **Chef Migration**: Schema validation passing
- ✅ **Fortune Teller Migration**: Schema validation passing
- ✅ **Imp Migration**: Schema validation passing
- 🔄 **Overall System**: Schema validation working for migrated characters
- ⚠️ **Remaining Characters**: Some non-migrated characters still use old format (expected)

### Test Commands Available

```bash
# Test all migrated actions
node test-all-actions.js

# Test specific character
node scripts/test-action-system.ts

# Run enhanced TB test
./run-enhanced-tb-test.js
```

## Migration Guidelines Reminder

### Step 1: Map String Actions to Enums

Use the mapping table in `CHARACTER_MIGRATION_GUIDE.md`

### Step 2: Convert Selection Criteria

Replace string targets with structured selection objects

### Step 3: Convert Effects

Replace string effects with structured effect objects

### Step 4: Update Action Structure

Replace old actions section with new parameterized format

### Step 5: Validate

Run tests to ensure migration is correct

## Progress Tracking

### By Team

- **Townsfolk**: 2/20+ migrated (Chef, Fortune Teller)
- **Outsiders**: 0/5 migrated
- **Minions**: 0/5 migrated
- **Demons**: 1/5 migrated (Imp)
- **Travelers**: 0/10+ migrated

### By Action Type

- **Information**: 2 migrated
- **Killing**: 1 migrated
- **Protection**: 0 migrated
- **Nomination**: 0 migrated
- **Voting**: 0 migrated
- **Meta**: 0 migrated

## Next Steps

1. **Continue High Priority**: Migrate Monk, Ravenkeeper, Empath
2. **Test Validations**: Run comprehensive tests after each batch
3. **Documentation**: Update examples with new patterns
4. **Batch Processing**: Consider scripts for bulk migrations
5. **Review Complex Cases**: Handle characters with multiple action types

## Migration Notes

- **Chef**: Simple information gathering pattern established
- **Fortune Teller**: Meta actions (red herring) + character actions pattern
- **Imp**: Complex multi-phase actions (night, day, nomination, voting, execution)

## Estimated Timeline

- **Week 1**: Complete all core TB characters (10 characters)
- **Week 2**: Complete remaining TB characters (15-20 characters)
- **Week 3**: Handle complex characters and edge cases
- **Week 4**: Full system validation and optimization
