# Action System Refactoring Summary

## ✅ What We've Created

### 1. Core Game Definitions (`packages/shared/src/game-definitions.ts`)

- **CharacterActionType enum**: 25+ standardized character action types
- **MetaActionType enum**: Script-level actions like team information
- **StatusEffect enum**: All possible status conditions (poisoned, protected, etc.)
- **EffectDuration enum**: Standardized durations (instant, tonight, permanent, etc.)
- **EffectTarget enum**: Who receives effects (self, selected, all, etc.)
- **PlayerTeam enum**: Team restrictions for selections
- **Utility functions**: Type guards and validation helpers

### 2. Action Registry System (`packages/shared/src/action-registry.ts`)

- **ActionRegistry class**: Maps action types to handler functions
- **ActionValidator class**: Validates actions before execution
- **EffectProcessor class**: Applies effects to game state
- **Standard action configurations**: Reusable action templates

### 3. Action Handlers (`packages/shared/src/action-handlers.ts`)

- **Modular handler functions**: One function per action type
- **CHARACTER_ACTION_HANDLERS**: Map of all character action handlers
- **META_ACTION_HANDLERS**: Map of all meta action handlers
- **Utility functions**: Helper functions for common operations

### 4. Updated Type System (`packages/shared/src/types.ts`)

- **Enhanced schemas**: Support for new action structure
- **Backward compatibility**: Union types to handle migration
- **Type-safe selections**: Standardized target selection criteria
- **Effect specifications**: Structured effect definitions

### 5. Bridge Module (`packages/shared/src/actions.ts`)

- **ActionSystemBridge**: Utilities for transitioning from old system
- **Legacy compatibility**: Helpers for gradual migration

## 🎯 Key Benefits Achieved

### 1. **Eliminated Hard-Coded Strings**

- All action types are now enum values
- No more scattered string literals
- Compile-time validation of action types

### 2. **Centralized Game Mechanics**

- Single source of truth for all actions, effects, and selections
- Consistent naming conventions
- Easy to discover available options

### 3. **Improved Type Safety**

- Enum-based action types prevent typos
- Structured effect specifications
- Type-safe target selection criteria

### 4. **Enhanced Extensibility**

- Registry pattern allows easy addition of new actions
- Pluggable handler system
- No need to modify core engine for new abilities

### 5. **Better Maintainability**

- Modular action handlers
- Clear separation of concerns
- Self-documenting code with descriptive enum names

## 📁 File Structure

```
packages/shared/src/
├── game-definitions.ts     # Core enums and constants
├── action-registry.ts      # Registry and validation system
├── action-handlers.ts      # Standard action implementations
├── actions.ts             # Bridge module for compatibility
└── types.ts               # Updated schemas

examples/
└── chef-refactored.json   # Example of new character structure

GAME_ACTION_SYSTEM_REFACTORING.md  # Detailed documentation
```

## 🔄 Next Steps for Manual Migration

### Character Data Migration

Each character's actions need to be updated to use:

1. **Enum action types** instead of strings
2. **Structured selections** with min/max targets and restrictions
3. **Standardized effects** with status, target, and duration
4. **Consistent information patterns** for player communication

### Example Character Structure

```json
{
  "actions": {
    "firstNight": [
      {
        "id": "chef-learn-evil-pairs",
        "action": "learnEvilPairsCount",
        "selection": {
          "minTargets": 0,
          "maxTargets": 0
        },
        "effects": [
          {
            "status": "learnedInfo",
            "target": "self",
            "duration": "permanent"
          }
        ],
        "information": {
          "customMessage": "You see [COUNT] pairs of neighbouring evil players"
        }
      }
    ]
  }
}
```

### Engine Integration

The action system can be gradually integrated by:

1. Updating switch statements to use the registry
2. Adding backward compatibility for existing data
3. Migrating characters one by one
4. Testing each migration thoroughly

This foundation provides a solid, extensible system for game actions while maintaining the flexibility to migrate at your own pace!
