# Blood on the Clocktower Digital

A platform-agnostic, AI-assisted implementation of **Blood on the Clocktower** (BotC) with an authoritative rules engine, nightly fairness scoring, and LLM-driven character dialogue.

## 🎯 Features

- **Authoritative Game Engine**: Server-side rules enforcement with hidden information protection
- **Real-time Multiplayer**: WebSocket-based gameplay with voice chat support
- **AI Agents**: LLM-powered NPCs that can play as characters with appropriate knowledge limitations
- **Fairness Scoring**: Built-in ICT (Information-Control-Time) metrics to help Storytellers balance games
- **Cross-Platform**: Web-first PWA with plans for mobile and desktop apps
- **Modular Scripts**: Support for different BotC editions and custom scripts

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
   git clone https://github.com/burdettadam/botct.git
   cd botct
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

This project uses a monorepo with shared packages. The `@botc/shared` package is built with dual output:
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

## 🤝 Contributing

This project follows the architecture outlined in `design.md`. Key principles:

- **Authoritative server**: All game logic runs server-side
- **Type safety**: Shared schemas with Zod validation
- **Real-time**: WebSocket events for game updates
- **Modular**: Clean separation between game engine, UI, and AI

## 📝 License

MIT License - see LICENSE file for details.

## 🎲 About Blood on the Clocktower

Blood on the Clocktower is a social deduction game by Steven Medway and The Pandemonium Institute. This is an unofficial digital implementation for educational and entertainment purposes.

---

*For detailed architecture information, see [design.md](./design.md)*
