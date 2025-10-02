# 🔥 Ashes of Salem

> **A sophisticated real-time social deduction game platform with AI integration**

[![CI/CD Pipeline](https://github.com/burdettadam/aos/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/burdettadam/aos/actions)
[![Quality Report](https://github.com/burdettadam/aos/actions/workflows/pr-quality-report.yml/badge.svg)](https://github.com/burdettadam/aos/actions)
[![Code Quality](https://api.codeclimate.com/v1/badges/REPO_ID/maintainability)](https://codeclimate.com/github/burdettadam/aos/maintainability)
[![SonarCloud Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=burdettadam_aos&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=burdettadam_aos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

**📋 Quick Start:** `npm run docker:up` → Open `http://localhost:5173`

**Ashes of Salem** is a digital social deduction game heavily inspired by **Blood on the Clock Tower** by Steven Medway and The Pandemonium Institute. This platform features an authoritative rules engine, nightly fairness scoring, and LLM-driven character dialogue.

## 📚 Quick Links

**For Contributors:**

- **[🚀 Get Started Contributing](docs/development/DEVELOPMENT.md)** - Complete setup guide
- **[🔄 Pull Request Process](docs/processes/PULL_REQUEST_GUIDE.md)** - Step-by-step PR workflow
- **[📊 Code Quality Standards](docs/processes/CODE_QUALITY.md)** - Quality metrics and tools

**Documentation:**

- **[📋 Complete Documentation Index](docs/README.md)** - Find any document quickly
- **[🏗️ Architecture Guide](docs/architecture/design.md)** - System design and patterns
- **[🧪 Testing Guide](docs/development/TESTING.md)** - Testing strategy and best practices

## 🎯 Features

- **Authoritative Game Engine**: Server-side rules enforcement with hidden information protection
- **Real-time Multiplayer**: WebSocket-based gameplay with voice chat support
- **AI Agents**: LLM-powered NPCs that can play as characters with appropriate knowledge limitations
- **Fairness Scoring**: Built-in ICT (Information-Control-Time) metrics to help Storytellers balance games
- **Cross-Platform**: Web-first PWA with plans for mobile and desktop apps
- **Modular Scripts**: Support for different script editions and custom scripts

## ✨ Inspiration

**Ashes of Salem** is heavily inspired by **Blood on the Clock Tower**, the brilliant social deduction game created by Steven Medway and The Pandemonium Institute. We are immensely grateful for the innovative game design that has inspired this digital adaptation. This project is an unofficial implementation created for educational purposes and to explore digital adaptations of social deduction mechanics.

**Key inspirations from Blood on the Clock Tower:**

- Asymmetric information and hidden role mechanics
- The Storyteller role and game facilitation concepts
- Character abilities and interaction patterns
- Day/night phase structure and voting mechanics
- The emphasis on social deduction and community building

## 🏗️ Architecture

This project uses a monorepo structure with:

- **`packages/shared`**: Common types, schemas, and utilities
- **`packages/server`**: Node.js/TypeScript backend with Fastify
- **`packages/client`**: React/Vite frontend with PWA support

### Tech Stack

- **Backend**: TypeScript, Fastify, WebSockets, Redis, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS, Zustand
- **Shared**: Zod schemas, TypeScript types
- **AI**: Provider-agnostic LLM integration with tool calling

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis (for session management)
- PostgreSQL (for persistent data)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/burdettadam/aos.git
   cd aos
   ```

2. **Install dependencies and build shared package**

   ```bash
   npm run setup
   ```

   This will:
   - Install all package dependencies
   - Build the shared package with dual output (CommonJS + ESM)
   - Set up the monorepo for development

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:

- Server on `http://localhost:3001`
- Client on `http://localhost:3000`

### Development Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run dev:docker` - Start all services using Docker
- `npm run build` - Build all packages for production
- `npm run build:shared` - Build only the shared package (required before other builds)
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages

### Package Management

This project uses a monorepo with shared packages. The `@ashes-of-salem/shared` package is built with dual output:

- **CommonJS** for Node.js (server)
- **ES Modules** for browsers (client)

If you encounter module resolution errors, run:

```bash
npm run build:shared
```

For more details, see [docs/MONOREPO_SETUP.md](./docs/MONOREPO_SETUP.md).

## 📁 Project Structure

```
botct/
├── packages/
│   ├── shared/           # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types.ts      # Game state, events, schemas
│   │   │   ├── constants.ts  # Game constants and configs
│   │   │   └── utils.ts      # Utility functions
│   │   └── package.json
│   ├── server/           # Backend game engine
│   │   ├── src/
│   │   │   ├── game/         # Core game logic
│   │   │   ├── services/     # Business logic services
│   │   │   ├── websocket/    # Real-time communication
│   │   │   └── utils/        # Server utilities
│   │   └── package.json
│   └── client/           # Frontend React app
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── pages/        # Route pages
│       │   ├── hooks/        # Custom React hooks
│       │   └── context/      # React context providers
│       └── package.json
├── design.md             # Detailed architecture documentation
├── Game architecture proposal.pdf
└── package.json          # Root workspace configuration
```

## 🎮 Game Flow

1. **Lobby Phase**: Players join a game lobby, roles are assigned
2. **Night Phase**: Night abilities are resolved in order
3. **Day Phase**: Players discuss and vote
4. **Execution**: Voted player is eliminated (if applicable)
5. **Victory Check**: Game ends when win conditions are met

## 🤖 AI Integration

The system supports AI agents that can:

- Play as any character with appropriate knowledge limitations
- Use abilities through the same tool system as human players
- Maintain character consistency through conversation
- Follow game rules without accessing hidden information

### NPC Profile System

The AI system includes a configurable profile system that allows customization of NPC behavior:

**API Endpoints:**

- `GET /api/ai/npc-profiles` - List available NPC profiles for selection
- `POST /api/games/:gameId/npc` - Add an NPC with optional `profileId` parameter

**Available Profiles:**

- **Starter Generic** (`starter-generic`): A balanced, customizable profile ideal for beginners
- **Aggressive Hunter** (`aggressive-hunter`): Actively hunts for evil players with high confidence
- **Custom Profiles**: Create your own by modifying the starter profile template

**Profile Configuration:**
Each profile includes personality traits (chattiness, suspicion, boldness), behavior settings (message frequency, decision speed), and strategic preferences for good/evil team roles.

**Usage in Lobby:**

1. Click "Add NPC" in the lobby
2. Select from available profiles in the modal
3. NPC is added with the selected behavioral configuration
4. Profile selection is stored and can be used for AI behavior customization

## 📊 Fairness Scoring

The ICT scoring system evaluates game balance each night:

- **Information Gain (IG)**: How much reliable information Good gained
- **Control Balance (CB)**: Net impact of night abilities
- **Time Cushion (TC)**: Safety margin before parity
- **Redundancy/Robustness (RR)**: Multiple confirmation paths
- **Volatility (V)**: Swing potential from key role deaths

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

### Scripts and Roles

The system uses a declarative script format. See `packages/server/src/game/script-loader.ts` for the Trouble Brewing implementation.

## 🚧 Development Status

**Current Phase**: M0 - Core Implementation

- [x] Project structure and build system
- [x] Basic game engine and state management
- [x] WebSocket communication
- [x] Shared type system
- [ ] Frontend game UI
- [ ] Role assignment and abilities
- [ ] Basic AI agents
- [ ] Fairness scoring

**Next Phases**:

- M1: Full Trouble Brewing, voice chat, advanced AI
- M2: Script editor, Neo4j scoring, mobile apps
- M3: Additional scripts, leagues, cosmetics

## 🆕 Redesigned Game Setup Page (Sept 2025)

The `/setup/:gameId` route now reuses core lobby components for a unified experience:

- Reuses `CharacterGrid` and `PreviewPanel` from the lobby for consistency.
- New panels under `client/src/components/setup/`:
  - `GameSetupInfoPanel` – shows dynamic role distribution (auto-applies script modifiers) and script basics.
  - `DetailedNightOrderPanel` – renders the script-provided `nightOrder` or falls back to character listing.
  - `GameStatisticsPanel` – summarizes difficulty, heuristic script issues, and validation feedback (modifier requirements, exclusivity, distribution mismatches).
- Regular (non-storyteller) players now see a read-only waiting view with disabled interaction while setup is in progress.
- Utility logic for distribution + validation lives in `client/src/utils/setupUtils.ts`.

These changes prepare the UI for future advanced validation, fairness scoring previews, and live modifier toggles.

## 📊 Code Quality & Reporting

This project maintains high code quality standards with comprehensive automated analysis and reporting:

### 🔍 **Automated Quality Checks**

Every pull request automatically generates detailed quality reports including:

- **ESLint Analysis**: Complexity rules, code standards, and best practices
- **TypeScript Checking**: Type safety validation across all packages
- **Code Complexity**: Automated analysis with configurable limits
- **Test Coverage**: Coverage reports with visual diffs
- **Bundle Analysis**: Build size tracking and optimization hints

### 🛠️ **Quality Tools & Standards**

- **ESLint Configuration**: Enforces complexity limits (max 10), line limits (300), and depth limits (4)
- **Prettier Integration**: Consistent code formatting with pre-commit hooks
- **Husky Git Hooks**: Automated linting and formatting on commit
- **SonarCloud**: Continuous code quality monitoring
- **CodeClimate**: Maintainability and test coverage tracking

### 📈 **Available Reports**

```bash
# Generate comprehensive quality report
npm run quality:report

# Run complexity analysis only
npm run analyze:complexity

# Full quality check (lint + test + complexity)
npm run quality:check
```

**PR Quality Reports**: Every PR automatically receives:

- 📊 Detailed quality metrics in PR comments
- 🔍 ESLint annotations on problematic lines
- 📈 Complexity analysis with recommendations
- 📁 Downloadable detailed reports as artifacts

### 🎯 **Quality Standards**

- **0 complexity violations** (all functions under complexity 10)
- **All files under 300 lines** (modular, focused components)
- **Type-safe codebase** (comprehensive TypeScript coverage)
- **Consistent formatting** (Prettier + ESLint)
- **Pre-commit validation** (hooks prevent quality regressions)

## 🤝 Contributing

We welcome contributions! This project follows professional development practices with comprehensive documentation and automated quality checks.

**Key Principles:**

- **Authoritative server**: All game logic runs server-side
- **Type safety**: Shared schemas with Zod validation
- **Real-time**: WebSocket events for game updates
- **Modular**: Clean separation between game engine, UI, and AI

**Getting Started:**

1. **[📖 Read the Development Setup](docs/development/DEVELOPMENT.md)** - Complete environment setup
2. **[🔄 Follow the PR Process](docs/processes/PULL_REQUEST_GUIDE.md)** - Step-by-step workflow
3. **[📊 Meet Quality Standards](docs/processes/CODE_QUALITY.md)** - Quality metrics and tools
4. **[🏗️ Understand the Architecture](docs/architecture/design.md)** - System design patterns

**Quick Start for Contributors:**

```bash
# Set up development environment
npm run setup
npm run dev

# Run quality checks before PR
npm run quality:check

# Generate detailed quality report
npm run quality:report
```

**📚 Complete documentation available in [`docs/`](docs/README.md)**

## 📝 License

MIT License - see LICENSE file for details.

## 🎲 About the Original Game

Blood on the Clocktower is a social deduction game by Steven Medway and The Pandemonium Institute. **Ashes of Salem** is an unofficial digital adaptation created for educational and entertainment purposes, heavily inspired by the brilliant mechanics and design of the original board game.

---

_For detailed architecture information, see [design.md](./design.md)_
