# BotCT MCP Server

A Model Context Protocol (MCP) server for Blood on the Clocktower game state and NPC management. This server enables stateless NPC agents to access game information, manage personality profiles, and maintain decision journals.

## Overview

This MCP server provides tools for:

- **Game State Management**: Access current game state, player information, and voting history
- **NPC Profile Management**: Retrieve and update NPC personality profiles and behavior parameters
- **Journal Management**: Track player decisions, observations, claims, and suspicions
- **Character Information**: Get details about Blood on the Clocktower characters and abilities

## Architecture

The server is designed to support **stateless NPC agents** by centralizing all game state and decision history. Instead of maintaining internal state, NPC agents can query the MCP server for any information they need to make decisions.

### Benefits of Stateless Architecture:

- **Reliability**: Agents can be restarted without losing context
- **Scalability**: Multiple agents can share the same game state
- **Debugging**: All decisions and reasoning are logged centrally
- **Consistency**: Single source of truth for game state

## Installation & Setup

1. **Build the server:**

   ```bash
   cd packages/mcp-server
   npm install
   npm run build
   ```

2. **Test the server:**
   ```bash
   ./test-server.sh
   ```

## Usage

### Running the Server

The MCP server communicates via stdio using JSON-RPC 2.0 protocol:

```bash
node dist/index.js
```

### Example Requests

**Initialize the server:**

```json
{ "jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {} }
```

**List available tools:**

```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {} }
```

**Get game state:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_game_state",
    "arguments": { "gameId": "test-game-1" }
  }
}
```

## Available Tools

### Game State Tools

#### `get_game_state`

Get the current state of a Blood on the Clocktower game.

- **Parameters**: `gameId` (string)
- **Returns**: Game phase, day, player counts, recent events, public claims

#### `get_player_info`

Get detailed information about a specific player.

- **Parameters**: `gameId` (string), `playerId` (string)
- **Returns**: Player status, character claims, voting history, suspicion levels

#### `get_voting_history`

Get voting history for a game or specific day.

- **Parameters**: `gameId` (string), `day` (number, optional)
- **Returns**: List of nominations and vote results

#### `get_character_info`

Get information about a specific character role.

- **Parameters**: `characterId` (string)
- **Returns**: Character abilities, team, setup requirements

### NPC Profile Tools

#### `get_npc_profile`

Get a specific NPC personality profile.

- **Parameters**: `profileId` (string)
- **Returns**: Personality traits, behavior parameters, decision-making style

#### `list_npc_profiles`

List all available NPC personality profiles.

- **Parameters**: None
- **Returns**: Array of available profiles with basic info

#### `update_npc_behavior`

Update NPC behavior parameters based on game context.

- **Parameters**: `profileId` (string), `updates` (object)
- **Returns**: Success confirmation

### Journal Tools

#### `get_journal_entries`

Get journal entries, optionally filtered by player or entry type.

- **Parameters**: `gameId` (string), `playerId` (string, optional), `entryType` (string, optional)
- **Returns**: List of journal entries with timestamps and metadata

#### `add_journal_entry`

Add a new journal entry for a player.

- **Parameters**: `gameId` (string), `playerId` (string), `type` (string), `content` (string), `metadata` (object, optional)
- **Returns**: Success confirmation with entry ID

#### `get_decision_history`

Get a player's decision history for pattern analysis.

- **Parameters**: `gameId` (string), `playerId` (string)
- **Returns**: Chronological list of decisions made by the player

#### `get_suspicion_network`

Get the suspicion network showing who suspects whom.

- **Parameters**: `gameId` (string)
- **Returns**: Matrix of suspicion levels between all players

## Integration with NPC Agents

### Stateless Agent Design

Your NPC agents should follow this pattern:

1. **Query Context**: Use MCP tools to get current game state
2. **Retrieve History**: Get relevant journal entries and decision history
3. **Get Profile**: Retrieve personality profile and current behavior parameters
4. **Make Decision**: Process information according to personality
5. **Log Decision**: Add journal entry documenting the decision and reasoning
6. **Update Behavior**: Optionally adjust behavior parameters based on game events

### Example Agent Flow

```typescript
// 1. Get current game context
const gameState = await mcpClient.call('get_game_state', {gameId});
const playerInfo = await mcpClient.call('get_player_info', {gameId, playerId: 'Alice'});

// 2. Retrieve decision history
const journalEntries = await mcpClient.call('get_journal_entries', {
  gameId,
  playerId: 'Alice',
  entryType: 'decision'
});

// 3. Get personality profile
const profile = await mcpClient.call('get_npc_profile', {
  profileId: 'analytical-skeptic'
});

// 4. Make decision based on context and personality
const decision = makeVotingDecision(gameState, playerInfo, journalEntries, profile);

// 5. Log the decision
await mcpClient.call('add_journal_entry', {
  gameId,
  playerId: 'Alice',
  type: 'decision',
  content: \`Voting for \${decision.target} because \${decision.reasoning}\`,
  metadata: {
    action: 'vote',
    target: decision.target,
    confidence: decision.confidence
  }
});
```

## Data Structures

### Game State

```typescript
interface GameState {
  gameId: string;
  phase: "setup" | "day" | "night" | "voting" | "endgame";
  day: number;
  playerCount: number;
  aliveCount: number;
  deadPlayers: string[];
  recentEvents: string[];
  publicClaims: Record<string, string>;
  scriptId: string;
}
```

### Journal Entry Types

- **claim**: Public character claims
- **observation**: Behavioral observations about other players
- **decision**: Important decisions and their reasoning
- **suspicion**: Suspicions about other players
- **analysis**: Strategic analysis and deductions

### NPC Profile Structure

```typescript
interface NPCProfile {
  id: string;
  name: string;
  description: string;
  personality: {
    aggressiveness: number; // 0-1: How aggressively they play
    trustingness: number; // 0-1: How easily they trust others
    deductiveReasoning: number; // 0-1: Logical reasoning ability
    socialManipulation: number; // 0-1: Social manipulation skills
    riskTolerance: number; // 0-1: Willingness to take risks
    vocalness: number; // 0-1: How much they speak up
  };
  // ... additional fields
}
```

## Development

### Adding New Tools

1. Implement the service method in the appropriate service class
2. Add the tool handler in `tools/index.ts`
3. Register the tool in the main server's tools list
4. Add tests to verify functionality

### Testing

Use the provided test script to verify all tools work correctly:

```bash
./test-server.sh
```

For manual testing, pipe JSON-RPC requests to the server:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/index.js
```

## Future Enhancements

- **Real-time Updates**: WebSocket support for live game state updates
- **Persistent Storage**: Database backend for production use
- **Authentication**: Secure access control for multi-user games
- **Analytics**: Decision pattern analysis and player behavior insights
- **AI Integration**: Direct integration with language models for enhanced NPC reasoning
