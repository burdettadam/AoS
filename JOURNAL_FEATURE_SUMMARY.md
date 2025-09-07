# Player Journal Feature Implementation

## Overview
The journal feature allows players to:
1. Take notes during the game to track information, clues, and suspicions
2. See available moves/actions based on their character and the current game phase
3. Use this as a guide for AI NPCs to make strategic decisions

The storyteller can audit all player journals at the end of the game for grimoire telling.

## Architecture

### Data Structures
- **Journal**: Contains notes and available moves for a player
- **JournalEntry**: A timestamped note with text content  
- **AvailableMove**: A suggested action with id, label, and description

### Key Components

#### 1. Journal Schema (`packages/shared/src/journal.ts`)
- Defines the data structure for player journals
- Exported as part of the shared types for use across client/server

#### 2. Available Moves Service (`packages/server/src/services/available-moves.service.ts`)
- Dynamically generates available moves based on:
  - Current game phase (Day, Night, Nomination, Voting)
  - Player's character role (Information characters, Detective characters, etc.)
  - Game state (final day, death patterns, etc.)

#### 3. Journal Service (`packages/server/src/services/journal.service.ts`)  
- Manages adding notes to journals
- Updates available moves when game state changes
- Provides access for players and storyteller audit

#### 4. API Routes (`packages/server/src/routes/journal.routes.ts`)
- POST `/games/:gameId/seats/:seatId/notes` - Add note to journal
- GET `/games/:gameId/seats/:seatId/journal` - Get player's journal
- POST `/games/:gameId/seats/:seatId/moves` - Update available moves
- GET `/games/:gameId/journals` - Storyteller audit of all journals

### Integration with Game State

Journals are stored in two places:
1. **`seat.journal`** - Each player's seat contains their journal
2. **`grimoireState.journals`** - Storyteller's grimoire tracks all journals for audit

## Example Available Moves

### Generic Moves (All Players)
- Take Notes
- Whisper with Player  
- Make Public Statement
- Analyze Voting Patterns

### Character-Specific Moves
- **Information Characters** (Chef, Empath): Share Your Information, Coordinate with Other Info Characters
- **Detective Characters** (Investigator, Washerwoman): Question Your Suspects
- **Protective Characters** (Monk, Soldier): Coordinate Protection

### Phase-Specific Moves
- **Day Phase**: Analyze Death Pattern (after day 1)
- **Nomination Phase**: Nominate Player, Evaluate Nomination
- **Voting Phase**: Vote to Execute, Vote to Pardon
- **Final Day**: Final Day Strategy

## Usage for AI NPCs

The available moves provide structured guidance that can be used to:
1. Generate AI player behavior based on their character and game state
2. Weight different strategic options for NPCs
3. Create realistic player patterns and decision-making

## Future Enhancements

1. **Move Prioritization**: Add priority/importance scores to moves
2. **Character-Specific Templates**: Pre-populate journals with character guides
3. **Social Deduction Tracking**: Template sections for tracking suspicions, alliances
4. **Cross-Reference Tools**: Link journal entries to game events
5. **AI Personality Profiles**: Use journal patterns to create distinct AI personalities
