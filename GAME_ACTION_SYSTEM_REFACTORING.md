# Game Action System Refactoring

This document outlines the new parameterized action system that reduces tight coupling from hard-coded strings and creates a common code place for actions, selections, and modifiers.

## New Architecture Overview

### 1. Common Definitions (`packages/shared/src/game-definitions.ts`)

The new system centralizes all game mechanic constants:

- **CharacterActionType**: Enum for all character actions (e.g., `LEARN_EVIL_PAIRS_COUNT`, `KILL_PLAYER`)
- **MetaActionType**: Enum for script-level actions (e.g., `SHOW_TEAM_TO_MINIONS`)
- **StatusEffect**: Enum for all status conditions (e.g., `POISONED`, `PROTECTED`)
- **EffectDuration**: Enum for effect durations (e.g., `TONIGHT`, `PERMANENT`)
- **EffectTarget**: Enum for effect targets (e.g., `SELF`, `SELECTED`)
- **PlayerTeam**: Enum for team restrictions (e.g., `TOWNSFOLK`, `MINIONS`)

### 2. Action Registry (`packages/shared/src/action-registry.ts`)

Provides a pluggable system for registering and executing actions:

- **ActionRegistry**: Maps action types to handler functions
- **ActionValidator**: Validates action requirements before execution
- **EffectProcessor**: Applies effects from actions to game state

### 3. Standard Action Handlers (`packages/shared/src/action-handlers.ts`)

Implements the core mechanics for character abilities:

- Modular handler functions for each action type
- Consistent interface for all actions
- Parameterized effects and selections

## Benefits of the New System

### 1. **Reduced Tight Coupling**
- No more hard-coded strings scattered throughout the codebase
- Centralized definitions prevent typos and inconsistencies
- Type-safe action types and effects

### 2. **Improved Extensibility**
- Easy to add new actions without modifying core engine code
- Pluggable action handlers
- Standardized effect and selection system

### 3. **Better Maintainability**
- Single source of truth for all game mechanics
- Consistent naming conventions
- Self-documenting code with enum values

### 4. **Enhanced Type Safety**
- Compile-time validation of action types
- Type-safe effect specifications
- Better IDE support and autocomplete

## Implementation Status

### ✅ Completed
- Core definitions and enums
- Action registry architecture
- Standard action handlers
- Type-safe schemas

### 🔄 In Progress
- Integration with existing action system
- Backward compatibility layer
- Character data migration

### 📋 TODO
- Complete refactor of existing switch statements
- Update all character JSON files to use new enums
- Add comprehensive validation rules
- Create action composition helpers

## Migration Strategy

### Phase 1: Foundation (✅ Complete)
- Create new definitions and registry system
- Establish type-safe schemas
- Build standard action handlers

### Phase 2: Integration
- Update action system to use registry
- Add backward compatibility for existing data
- Gradually migrate character definitions

### Phase 3: Full Migration
- Convert all character data to use new enums
- Remove legacy string-based action handling
- Add comprehensive validation

## Example Usage

### Before (Hard-coded strings)
```typescript
switch (action.action) {
  case 'learnEvilPairsCount':
    return this.executeChefAction(action, context, game, actingSeat);
  case 'killPlayer':
    return this.executeKillAction(action, context, game, actingSeat);
  // ... many more cases
}
```

### After (Parameterized system)
```typescript
const handler = globalActionRegistry.getCharacterActionHandler(action.action);
if (handler) {
  return await handler(action, context, game, actingSeat);
}
```

### Character Definition Example
```json
{
  "id": "chef",
  "actions": {
    "firstNight": [{
      "id": "chef-info",
      "action": "learnEvilPairsCount",
      "selection": {
        "minTargets": 0,
        "maxTargets": 0
      },
      "effects": [],
      "information": {
        "customMessage": "You see [COUNT] pairs of neighbouring evil players"
      }
    }]
  }
}
```

## Files Changed

1. **`packages/shared/src/game-definitions.ts`** - Core enums and constants
2. **`packages/shared/src/action-registry.ts`** - Registry and validation system
3. **`packages/shared/src/action-handlers.ts`** - Standard action implementations
4. **`packages/shared/src/types.ts`** - Updated schemas to use new enums
5. **`packages/shared/src/actions.ts`** - Bridge module for compatibility
6. **`packages/server/src/game/action-system.ts`** - Updated to use registry pattern

## Next Steps

1. **Complete type integration** - Resolve remaining type compatibility issues
2. **Add migration tooling** - Create scripts to convert existing character data
3. **Extend validation** - Add comprehensive action validation rules
4. **Add composition helpers** - Create utilities for common action patterns
5. **Performance optimization** - Optimize registry lookups and effect processing

This refactoring provides a solid foundation for a more maintainable and extensible game engine while preserving backward compatibility during the transition period.
