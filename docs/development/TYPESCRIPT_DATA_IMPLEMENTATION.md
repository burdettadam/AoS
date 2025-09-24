# Enhanced TypeScript Data Structure for Blood on the Clocktower

## Overview

I've implemented a comprehensive TypeScript-based data structure for your Blood on the Clocktower game that provides better type safety, improved developer experience, and maintains backward compatibility with existing JSON data files.

## What Was Implemented

### 1. Enhanced Type Definitions (`packages/shared/src/types.ts`)

**New Character Schema:**

```typescript
export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.enum([
    "townsfolk",
    "outsider",
    "minion",
    "demon",
    "traveller",
    "fabled",
  ]),
  ability: z.string(),
  firstNight: z.number().optional(),
  otherNights: z.number().optional(),
  reminders: z.array(z.string()).optional(),
  setup: z.boolean().optional(),
  special: z
    .object({
      type: z.enum(["bag-disabled", "bag-duplicate", "selection-disabled"]),
      description: z.string().optional(),
    })
    .optional(),
  jinx: z
    .array(
      z.object({
        id: z.string(),
        reason: z.string(),
      }),
    )
    .optional(),
  // Legacy fields for compatibility
  category: z.string().optional(),
  edition: z.array(z.string()).optional(),
  // ... other legacy fields
});
```

**Script Metadata Schema:**

```typescript
export const ScriptMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  author: z.string().optional(),
  description: z.string().optional(),
  playerCount: z
    .object({
      min: z.number(),
      max: z.number(),
      optimal: z.string().optional(),
    })
    .optional(),
  complexity: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  // ... other metadata fields
});
```

### 2. Universal Script Loader (`packages/shared/src/scriptLoader.ts`)

**Features:**

- **Data Source Abstraction**: Works with any data source (Node.js files, HTTP APIs, etc.)
- **Automatic Format Detection**: Handles both character ID arrays and detailed character objects
- **Legacy Compatibility**: Transforms old JSON formats to new TypeScript types
- **Caching**: Built-in caching for performance
- **Validation**: Runtime type checking with Zod schemas

**Usage:**

```typescript
const loader = new ScriptLoader(dataSource);
const script = await loader.loadScript("trouble-brewing");
// script.characters[0].team is now type-safe!
```

### 3. Platform-Specific Data Sources

**Node.js Data Source** (`packages/server/src/data/nodeScriptDataSource.ts`):

```typescript
export class NodeScriptDataSource implements ScriptDataSource {
  async loadCharacters(scriptPath: string): Promise<any> {
    const filePath = path.join(
      this.dataDirectory,
      scriptPath,
      "characters.json",
    );
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  }
  // ... metadata loading and script discovery
}
```

**Browser Data Source** (`packages/client/src/data/fetchScriptDataSource.ts`):

```typescript
export class FetchScriptDataSource implements ScriptDataSource {
  async loadCharacters(scriptPath: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/scripts/${scriptPath}/characters`,
    );
    return response.json();
  }
}
```

### 4. Updated Server Integration

**Enhanced Script Loader** (`packages/server/src/game/script-loader.ts`):

- Loads from JSON files first, falls back to hardcoded scripts
- Converts loaded scripts to internal game engine format
- Maintains compatibility with existing game engine

**New API Routes** (`packages/server/src/routes/dataRoutes.ts`):

```typescript
// New endpoints for serving script data
GET /api/data/scripts/:scriptPath*/characters
GET /api/data/scripts/:scriptPath*/metadata
GET /api/data/scripts
```

### 5. Client-Side Integration

**Updated Game Store** (`packages/client/src/store/gameStore.ts`):

```typescript
interface GameStore {
  // New script state
  availableScripts: LoadedScript[];
  currentScript: LoadedScript | null;
  scriptsLoading: boolean;

  // New script actions
  loadScripts: () => Promise<void>;
  loadScript: (scriptId: string) => Promise<LoadedScript | null>;
  setCurrentScript: (script: LoadedScript) => void;
}
```

## Benefits of This Approach

### 1. **Type Safety**

- Compile-time error checking
- IDE autocomplete and IntelliSense
- Prevents runtime type errors

### 2. **Better Developer Experience**

- Clear interfaces show data structure
- Refactoring is safer with TypeScript
- Better debugging with typed data

### 3. **Backward Compatibility**

- Existing JSON files work unchanged
- Gradual migration path
- Legacy format support built-in

### 4. **Flexibility**

- Multiple data sources (files, APIs, databases)
- Platform-agnostic core logic
- Easy to extend and modify

### 5. **Validation**

- Runtime type checking with Zod
- Data integrity guarantees
- Clear error messages for invalid data

## Data Format Examples

### Current JSON Format (Still Supported)

```json
{
  "characters": [
    {
      "id": "washerwoman",
      "name": "Washerwoman",
      "category": "Townsfolk",
      "ability_summary": "You start knowing that 1 of 2 players is a particular Townsfolk.",
      "tokens_used": ["TOWNSFOLK", "WRONG"]
    }
  ]
}
```

### New TypeScript Format (Auto-Generated)

```typescript
{
  id: "washerwoman",
  name: "Washerwoman",
  team: "townsfolk",
  ability: "You start knowing that 1 of 2 players is a particular Townsfolk.",
  reminders: ["TOWNSFOLK", "WRONG"],
  // Legacy fields preserved for compatibility
  category: "Townsfolk",
  abilitySummary: "You start knowing that 1 of 2 players is a particular Townsfolk.",
  tokensUsed: ["TOWNSFOLK", "WRONG"]
}
```

## Migration Strategy

### Phase 1: ✅ **Complete** - Infrastructure

- [x] TypeScript type definitions
- [x] Script loader with data source abstraction
- [x] Platform-specific data sources
- [x] Server and client integration
- [x] API endpoints for script data

### Phase 2: **Recommended Next Steps**

1. **Update UI Components**: Modify setup and character selection components to use new typed data
2. **Enhanced Character Display**: Use new metadata fields for richer character information
3. **Script Management UI**: Create interface for browsing and selecting scripts
4. **Data Migration Tools**: Scripts to convert existing data to new format (optional)

### Phase 3: **Future Enhancements**

1. **Script Editor**: TypeScript-powered script creation tool
2. **Custom Character Types**: Support for homebrew characters with validation
3. **Data Analytics**: Type-safe game statistics and analytics
4. **Import/Export**: Tools for sharing custom scripts

## Usage Examples

### Loading Scripts

```typescript
// Server-side
const loader = new ScriptLoader(new NodeScriptDataSource());
const script = await loader.loadScript("trouble-brewing");

// Client-side
const script = await clientScriptManager.loadScript("trouble-brewing");
```

### Type-Safe Character Access

```typescript
// All type-safe!
const characters = script.characters;
const demons = characters.filter((c) => c.team === "demon");
const hasSetupRole = characters.some((c) => c.setup === true);
const reminderTokens = characters.flatMap((c) => c.reminders || []);
```

### Character Validation

```typescript
import { validateCharacter } from "@botc/shared";

if (validateCharacter(characterData)) {
  // TypeScript knows this is a valid Character
  console.log(characterData.team); // Type-safe access
}
```

## Files Modified/Created

### New Files

- `packages/shared/src/scriptLoader.ts` - Universal script loading logic
- `packages/server/src/data/nodeScriptDataSource.ts` - Node.js file system data source
- `packages/client/src/data/fetchScriptDataSource.ts` - Browser HTTP data source
- `packages/client/src/utils/scriptManager.ts` - Client-side script management
- `packages/server/demo-script-loading.ts` - Demonstration script

### Modified Files

- `packages/shared/src/types.ts` - Enhanced type definitions
- `packages/shared/src/index.ts` - Export new modules
- `packages/server/src/game/script-loader.ts` - Enhanced with JSON loading
- `packages/server/src/routes/dataRoutes.ts` - New API endpoints
- `packages/client/src/store/gameStore.ts` - Script management state
- `packages/server/src/game/importer.ts` - Support new role types
- `packages/server/src/game/rules.ts` - Support new role types

## Testing the Implementation

Run the demo script to see the new system in action:

```bash
cd packages/server
npx ts-node demo-script-loading.ts
```

This will demonstrate:

- Loading scripts with full type safety
- Character filtering and analysis
- Metadata extraction
- Legacy format compatibility
- Statistics generation

## Conclusion

This implementation provides a solid foundation for better data management in your Blood on the Clocktower game while maintaining full compatibility with existing JSON files. The TypeScript approach offers significant benefits for development, debugging, and extending the game in the future.
