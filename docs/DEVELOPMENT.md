# Development Guide

## Quick Start

1. **Setup the project:**
   ```bash
   ./setup.sh
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start both the client and server in development mode.

## Project Structure

### Packages

- **`shared`**: Common types, schemas, and utilities used by both client and server
- **`server`**: Backend API and game engine (Node.js/Fastify)
- **`client`**: Frontend web application (React/Vite)

### Development Workflow

1. **Make changes to shared types**: Edit files in `packages/shared/src/`
2. **Rebuild shared package**: `cd packages/shared && npm run build`
3. **Server automatically restarts** when you save files
4. **Client hot-reloads** when you save files

### Key Technologies

- **TypeScript**: All packages use TypeScript for type safety
- **Zod**: Runtime schema validation for API contracts
- **Fastify**: Fast web framework for the backend
- **React + Vite**: Modern frontend stack with fast HMR
- **WebSockets**: Real-time communication between client and server

## Available Scripts

### Root Level
- `npm run dev` - Start both client and server
- `npm run build` - Build all packages
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run setup` - Install all dependencies

### Package Level
Navigate to any package directory (`packages/shared`, `packages/server`, `packages/client`) and run:

- `npm run dev` - Start development mode for that package
- `npm run build` - Build that package
- `npm test` - Run tests for that package

## Architecture Overview

### Game Engine (Server)
- **GameEngine**: Core game state management
- **RulesEngine**: Role assignment and ability resolution
- **ScriptLoader**: Loads game scripts (Trouble Brewing, etc.)
- **WebSocketHandler**: Real-time communication with clients

### Client
- **Game Store**: Zustand store for client-side state management
- **React Router**: Page routing
- **Tailwind CSS**: Utility-first styling

#### Visual Ring / Legend Consistency

Character team ring classes and script modifier ring decorations are centralized in `packages/client/src/constants/visual.ts`. When adding a new team type or modifier type, update this file. The lobby legend and character grid consume these constants directly to avoid color mismatches. Do not hard-code ring color classes elsewhere.

### Shared
- **Types**: All game-related TypeScript interfaces
- **Schemas**: Zod schemas for runtime validation
- **Constants**: Game configuration and constants

## Next Steps

1. **Install dependencies** by running the setup script
2. **Start the development servers** with `npm run dev`
3. **Open your browser** to `http://localhost:3000`
4. **Check the server** is running at `http://localhost:3001/health`

The current implementation includes:
- Basic project structure
- Type definitions for game entities
- WebSocket communication setup
- Simple game engine foundation
- React frontend with routing

## Troubleshooting

### TypeScript Errors
- Make sure to build the shared package first: `cd packages/shared && npm run build`
- Install dependencies: `npm run setup`

### Port Conflicts
- Client runs on port 3000, server on port 3001
- Change ports in `vite.config.ts` (client) or `.env` file (server)

### WebSocket Connection Issues
- Ensure the server is running before connecting from the client
- Check browser console for connection errors
