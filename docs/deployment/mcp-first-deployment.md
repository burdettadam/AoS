# MCP-First AI Agent Deployment

This guide shows how to deploy your AI agents using a pure MCP architecture with no fallback modes. The system requires the MCP server to function - all AI agents are stateless and depend entirely on MCP for state management.

## 🚀 Quick Start (MCP-Only Deployment)

### 1. Deploy MCP-First Architecture

```bash
# Start all services with MCP as required dependency
cd docker
docker-compose -f docker-compose.yml -f docker-compose.mcp.yml up -d

# Pull AI model (if not already done)
npm run ai:pull:deepseek

# Test MCP-first integration
./test-mcp-integration.sh
```

### 2. Environment Configuration

Add these environment variables to your `.env.docker`:

```env
# MCP Configuration - REQUIRED
MCP_REQUIRED=true
MCP_SERVER_CONTAINER=botct-mcp-server

# Ollama configuration for LLM calls
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_DEFAULT_MODEL=deepseek-r1:7b
```

### 3. Replace AI Agent System (Complete Migration)

```typescript
// packages/server/src/ai/MCPAIAgentManager.ts
import { MCPAIAgentManager } from "./ai/MCPAIAgentManager.js";

// Replace your existing AIAgentManager
export class GameEngine {
  private aiManager: MCPAIAgentManager;

  constructor() {
    // Remove old AIAgentManager - use MCP-only version
    this.aiManager = new MCPAIAgentManager();
  }

  async initialize() {
    // Initialize MCP system - will throw if unavailable
    await this.aiManager.initialize();
  }

  async addNPCPlayer(
    gameId: string,
    seatId: string,
    character: Character,
    seatName: string,
  ) {
    // Create MCP-based agent - no fallback
    await this.aiManager.createAgent(gameId, seatId, character, seatName);
  }

  async processGameEvent(gameId: string, eventType: string) {
    // Process with MCP agents only
    await this.aiManager.processGameEvent(gameId, eventType);
  }
}
```

## 🐳 Docker Configuration

### Required Services

```yaml
services:
  # MCP Server - Critical dependency
  mcp-server:
    build:
      context: ../packages/mcp-server
    container_name: botct-mcp-server
    environment:
      - NODE_ENV=production
      - MCP_LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "sh",
          "-c",
          'echo ''{"jsonrpc": "2.0", "id": 1, "method": "initialize"}'' | node /app/dist/index.js',
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  # Server with MCP dependency
  botct-server:
    environment:
      - MCP_REQUIRED=true
      - MCP_SERVER_CONTAINER=botct-mcp-server
    depends_on:
      mcp-server:
        condition: service_healthy

  # Ollama for LLM processing
  ollama:
    image: ollama/ollama:latest
    # Standard Ollama configuration
```

## 🔧 MCP-First Architecture

### Pure Stateless Agents

```typescript
// All agents are stateless and MCP-dependent
const agent = new MCPAIAgent(gameId, seatId, character, seatName);

// Initialize - throws if MCP unavailable
await agent.initialize();

// Make decision using only MCP data
const decision = await agent.processGameEvent("phase_change");

// Log decision to MCP journal
await agent.logDecision(decision);
```

### Centralized State Management

- **Game State**: Stored in MCP server
- **Decision History**: Tracked in MCP journal
- **Player Profiles**: Managed by MCP
- **Suspicion Networks**: Calculated by MCP

### No Fallback Modes

- System fails fast if MCP server unavailable
- All state queries throw errors if MCP unreachable
- Consistent behavior - no mixed state scenarios

## 📊 Monitoring & Operations

### Health Checks

```bash
# Check MCP server status
docker ps | grep botct-mcp-server

# Test MCP functionality
./scripts/test-mcp-integration.sh

# View MCP logs
docker logs botct-mcp-server -f
```

### Error Handling

```typescript
// Agents throw errors immediately if MCP unavailable
try {
  await agent.processGameEvent("voting");
} catch (error) {
  console.error("MCP server required but unavailable:", error);
  // Handle system-wide failure
}
```

## 🚦 npm Scripts

Update your root `package.json`:

```json
{
  "scripts": {
    "mcp:start": "cd docker && docker-compose -f docker-compose.yml -f docker-compose.mcp.yml up -d",
    "mcp:stop": "cd docker && docker-compose -f docker-compose.mcp.yml down",
    "mcp:logs": "docker logs botct-mcp-server -f",
    "mcp:build": "cd packages/mcp-server && npm run build",
    "test:mcp": "./scripts/test-mcp-integration.sh",
    "ai:start:mcp": "npm run mcp:start && npm run ai:pull:deepseek && npm run test:mcp",
    "ai:status": "npm run test:mcp"
  }
}
```

## 🔄 Migration Steps

### Step 1: Remove Old AI System

```bash
# Remove existing fallback-based components
rm packages/server/src/ai/agents/NPCAIAgent.ts
rm packages/server/src/ai/AIAgentManager.ts
```

### Step 2: Deploy MCP Components

```bash
# Build MCP server
cd packages/mcp-server && npm run build

# Start MCP-first system
npm run mcp:start
```

### Step 3: Update Integration Points

```typescript
// Replace in your game engine
- import { AIAgentManager } from './ai/AIAgentManager.js';
+ import { MCPAIAgentManager } from './ai/MCPAIAgentManager.js';

- private aiManager = new AIAgentManager(this);
+ private aiManager = new MCPAIAgentManager();
```

### Step 4: Test & Validate

```bash
# Validate MCP system
npm run test:mcp

# Test agent creation
# Should throw errors if MCP unavailable
```

## 🛠️ Troubleshooting

### MCP Server Issues

```bash
# Check build
cd packages/mcp-server && npm run build

# Verify container health
docker inspect botct-mcp-server --format='{{.State.Health.Status}}'

# Test JSON-RPC manually
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize"}' | docker exec -i botct-mcp-server node /app/dist/index.js
```

### Agent Initialization Failures

```typescript
// All failures are now explicit
try {
  await mcpManager.createAgent(gameId, seatId, character, seatName);
} catch (error) {
  // MCP server unavailable - system cannot function
  throw new Error(
    `Cannot create AI agent without MCP server: ${error.message}`,
  );
}
```

### Performance Optimization

- MCP calls are synchronous and blocking
- Each decision requires 3-5 MCP queries
- Consider request batching for high-frequency operations

## 🔒 Production Considerations

### High Availability

- MCP server is single point of failure
- Consider running multiple MCP server instances
- Implement MCP server restart policies

### Data Persistence

- MCP server stores state in memory
- Implement persistent storage for production
- Backup journal and profile data

### Scaling

- One MCP server can handle multiple games
- Scale horizontally by game partitioning
- Monitor MCP server resource usage

## 📈 Benefits of MCP-First Architecture

### Immediate Benefits

- Fully stateless AI agents
- Consistent state management
- Simplified debugging
- Agent restart resilience

### Operational Benefits

- No mixed state scenarios
- Clear failure modes
- Centralized logging
- Simplified deployment

### Development Benefits

- Pure functional agents
- Testable decision logic
- Reproducible behavior
- Clear dependencies

## 🎯 Next Steps

1. **Remove Legacy Code**: Delete all fallback and hybrid components
2. **Deploy MCP Server**: Ensure reliable MCP server deployment
3. **Update Integration**: Replace all AI agent creation with MCP versions
4. **Test Thoroughly**: Validate system behavior under failure conditions
5. **Monitor Performance**: Track MCP latency and reliability metrics

The MCP-first approach provides maximum benefits by eliminating complexity and ensuring consistent, predictable behavior across all AI agents.
