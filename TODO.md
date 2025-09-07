# BotC Digital - Implementation TODO

This document outlines the implementation roadmap organized by features with clear dependency ordering.

## 🎯 Core Foundation (No Dependencies)

### F001: Game State Machine Core
- [x] Extend `GameEngine` to handle all phases: `Night → Day → Nomination → Vote → Execution → End`
- [x] Implement phase transitions with proper validation and event logging
- [x] Add timing controls for Storyteller to advance phases manually
- [ ] Create comprehensive game state validation
	- [x] Basic invariants (unique seats, storyteller seat exists, day >= 0, roles assigned post-lobby)
	- [ ] Per-phase preconditions (e.g., nomination exists before vote, votes tallied before execution)
	- [ ] Victory condition checks wired into transitions
	- [ ] Exhaustive validation for edge cases (ghost votes, execution immunity, bounce rules)

Notes:
- New storyteller endpoints:
	- POST `/api/games/:gameId/phase/advance` { storytellerSeatId }
	- POST `/api/games/:gameId/phase/set` { storytellerSeatId, phase }
	- POST `/api/games/:gameId/end` { storytellerSeatId }
- Transitions emit `phase_changed` events with old/new phase and current day; day increments on `Execution → Night`.

Immediate Next Steps for F001:
- [ ] Add a lightweight transitions spec/test suite (happy path + invalid jumps)
- [ ] Persist nomination/vote ephemeral fields in state (minimal schema) to enable validation hooks
- [ ] Wire victory checks stub into `advancePhase` boundaries (post-Execution, post-Night)

### F002: Enhanced Type System
- [ ] Complete Zod schema validation for all API boundaries
- [ ] Add runtime type checking for WebSocket messages
- [ ] Implement comprehensive error types and handling
- [ ] Create type-safe event system

### F003: Script DSL Foundation
- [ ] Build Script DSL compiler (`script-loader.ts`) to load role definitions from YAML/JSON
- [ ] Create role definition schema and validation
- [ ] Implement ability precedence and timing system
- [ ] Add script validation and dependency checking

## 🎯 Game Logic Layer (Depends on: F001, F002, F003)

### F004: Official Setup Process Implementation
**Dependencies:** F001, F003
- [ ] Add `SETUP` phase to `GamePhase` enum between `LOBBY` and `NIGHT`
- [ ] Create Setup Manager class to handle official BotC setup workflow
- [ ] Implement storyteller manual character selection interface
- [ ] Add character modification rules system (Baron [+2 Outsiders], Drunk effects, etc.)
- [ ] Build setup validation engine for proper distribution and player count requirements
- [ ] Create reminder token management system for characters with ongoing effects
- [ ] Implement grimoire state management (character positions, tokens, night order)
- [ ] Add "bag" system for random distribution from storyteller-selected characters
- [ ] Build guided setup process following official steps:
  1. Choose edition/script ✅ (already supported)
  2. Storyteller selects specific characters based on player count and game balance
  3. Handle character setup modifications (Baron, etc.)
  4. Validate setup meets distribution requirements
  5. Random distribution to players from selected pool
  6. Collect tokens into grimoire with proper positioning

Notes:
- Current system has basic role assignment but lacks sophisticated setup management
- Need to match official Blood on the Clocktower setup process from wiki
- Character selection should be manual by storyteller, not automatic distribution
- Setup modifications must be applied before random distribution

### F005: Role Assignment System (Enhanced)
**Dependencies:** F001, F003, F004
- [x] Implement role assignment algorithm with proper distribution (Townsfolk/Outsider/Minion/Demon)
- [ ] Add role balancing for different player counts
- [ ] Create role conflict resolution (drunk/poisoned effects)
- [ ] Implement role information visibility rules
- [ ] Integrate with official setup process from F004

Notes:
- Baseline distribution by player count implemented in `RulesEngine`.
- Pre-claimed roles respected; alignment set per role.
- Next: introduce conflict resolution (Drunk/Poisoner interactions) and visibility masking beyond current basic masking.
- Must work with F004 setup process for proper character selection flow.

### F005: Ability Execution Framework
**Dependencies:** F001, F003, F004
- [ ] Create ability execution framework with precedence ordering
- [ ] Implement effect resolution system
- [ ] Add ability targeting validation and UI
- [ ] Create hidden information management system

### F006: Night Phase Engine
**Dependencies:** F004, F005
- [ ] Build night order execution based on role precedence
- [ ] Implement ability targeting UI for Storyteller
- [ ] Add player ability interfaces (limited to their role's capabilities)
- [ ] Create automated night phase progression

### F007: Day Phase & Voting System
**Dependencies:** F001, F004
- [ ] Implement nomination system with speaking order and timing
- [ ] Build voting mechanics with vote tallying and execution logic
- [ ] Add discussion/table talk interface with optional timers
- [ ] Create victory condition checking (parity, demon death, special wins)

## 🎯 Real-Time Communication (Depends on: F001, F002)

### F008: WebSocket Infrastructure
**Dependencies:** F001, F002
- [ ] Upgrade from REST to WebSocket for real-time game state updates
- [ ] Implement client-side state synchronization with conflict resolution
- [x] Add game event streaming for live updates across all connected clients
- [ ] Create connection resilience and reconnection handling

Notes:
- Server broadcasts `phase_changed`, `player_joined`, etc., via WebSocket handler; selective state still pending.
- Next: client subscription and reducer to apply incremental events; reconnection with missed-event replay buffer.

### F009: Real-Time Game Updates
**Dependencies:** F008, F004, F005
- [ ] Implement selective state broadcasting (players only see what they should see)
- [ ] Add real-time ability usage notifications
- [ ] Create live voting and nomination updates
- [ ] Implement phase transition broadcasting

## 🎯 User Interface Layer (Depends on: F008)

### F010: Enhanced Game Interface
**Dependencies:** F008, F006, F007
- [ ] Complete game table interface with seat arrangement and status indicators
- [ ] Build Storyteller grimoire view with full game state visibility
- [ ] Add player action interfaces (voting, ability usage, claims)
- [ ] Create responsive design for mobile compatibility

### F011: Lobby & Matchmaking
**Dependencies:** F008, F004
- [ ] Implement game creation and joining workflows
- [ ] Add script selection and voting system
- [ ] Create player ready/unready states
- [ ] Build spectator mode support

### F012: Role Reveal & Information Display
**Dependencies:** F004, F008
- [ ] Enhance role reveal page with role descriptions and abilities
- [ ] Add alignment and win condition displays
- [ ] Create role-specific information panels
- [ ] Implement progressive information disclosure

## 🎯 Advanced Game Features (Various Dependencies)

### F013: Fairness Scoring System
**Dependencies:** F006, F007
- [ ] Implement ICT metrics (Information-Control-Time scoring)
- [ ] Build nightly fairness analysis with Monte Carlo simulations
- [ ] Create Storyteller guidance dashboard showing game balance recommendations
- [ ] Add outcome prediction algorithms based on current game state

### F014: AI/LLM Integration
**Dependencies:** F005, F006, F007
- [ ] Design NPC seat agents with role-appropriate knowledge limitations
- [ ] Implement LLM tool calling framework for AI player actions
- [ ] Add AI Storyteller assistant for newcomer games
- [ ] Create content moderation and guardrails for AI-generated content

### F015: Voice Communication
**Dependencies:** F008, F010
- [ ] Add WebRTC voice chat with spatial audio for seat positions
- [ ] Implement mute/unmute controls tied to game phases
- [ ] Create whisper/private chat channels for Minion coordination
- [ ] Add voice activity detection for speaking order indicators

## 🎯 Data & Persistence Layer (Depends on: F001, F008)

### F016: Database Integration
**Dependencies:** F001, F002
- [ ] Add PostgreSQL integration for game persistence
- [ ] Implement Redis session management for WebSocket connections
- [ ] Create user authentication and profile system
- [ ] Add game statistics and history tracking

### F017: Game Replay System
**Dependencies:** F001, F016
- [ ] Implement event sourcing for game replay capability
- [ ] Create replay viewer interface
- [ ] Add game analysis and review tools
- [ ] Build game export/import functionality

## 🎯 Production & Scaling (Depends on: All Core Features)

### F018: Cross-Platform Support
**Dependencies:** F010, F016
- [ ] Complete PWA implementation with offline capabilities
- [ ] Add Capacitor wrappers for iOS/Android apps
- [ ] Implement push notifications for game events
- [ ] Create desktop app with Tauri/Electron

### F019: Testing & Quality Assurance
**Dependencies:** All previous features
- [ ] Build comprehensive test suite for game logic
- [ ] Add load testing for concurrent games
- [ ] Implement end-to-end testing for complete game flows
- [ ] Create automated testing for AI agents

### F020: Deployment & Operations
**Dependencies:** F016, F019
- [ ] Implement CI/CD pipeline with automated testing
- [ ] Deploy to production environment with monitoring
- [ ] Add logging, metrics, and alerting
- [ ] Create backup and disaster recovery procedures

## 🎯 Feature Extensions (Optional)

### F021: Advanced Scripts & Modding
**Dependencies:** F003, F013
- [ ] Support for custom scripts and homebrew roles
- [ ] Script marketplace and sharing system
- [ ] Advanced script debugging tools
- [ ] Community script validation system

### F022: Tournament & League System
**Dependencies:** F016, F017
- [ ] Tournament bracket management
- [ ] League standings and statistics
- [ ] Seasonal competitions
- [ ] Player ranking and matchmaking

### F023: Streaming & Content Creation
**Dependencies:** F015, F017
- [ ] OBS integration for streamers
- [ ] Spectator mode with commentary features
- [ ] Highlight reel generation
- [ ] Social media integration

## 📋 Development Guidelines

- **Start with Core Foundation** features before moving to dependent layers
- **Test each feature thoroughly** before marking as complete
- **Maintain API compatibility** when extending existing features
- **Document all public APIs** and integration points
- **Regular integration testing** between dependent features

## 🚀 Proposed Near-Term Plan (2–3 Iterations)

Iteration 1 (Phase plumbing and validation)
- [ ] Add nomination/vote minimal schema to `GameState` (nominee, nominators, voters, tallies)
- [ ] Implement REST+WS commands for nominate/vote; enforce phase preconditions in transitions
- [ ] Add engine tests for phase order, day increment, invalid transitions, and event emission

Iteration 2 (Night engine scaffolding)
- [ ] Define Night ability queue with precedence ordering and target validation stubs
- [ ] Implement a minimal effect runner (no-op placeholders for unimplemented effects)
- [ ] Expose storyteller prompts for Night targets (server API + WS broadcast)

Iteration 3 (Client sync + UX)
- [ ] Wire client to WS event stream; implement reducer for `phase_changed`, seats, and day updates
- [ ] Add storyteller phase control UI and toasts on phase changes
- [ ] Handle reconnection: resubscribe + fetch snapshot, reconcile with last event id

Ops/DevX
- [ ] Resolve local port collision: ensure client and server use distinct ports (e.g., Vite 5173, API 3001) and update Vite proxy
- [ ] Add `.env` templates and document local setup in `docs/DEVELOPMENT.md`

Short-term UI tasks (post-F001)
- [ ] Display current phase/day in navbar and game header with live updates
- [ ] Storyteller controls to advance/set phase in the grimoire view
