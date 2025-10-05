# MCP Integration Configuration Guide

This guide shows how to configure your AI agent deployment to use the new MCP interface while preserving your existing Ollama-based AI system.

## 🚀 Quick Start (Recommended: Hybrid Approach)

### 1. Start Services with MCP Integration

```bash
# Start all services including MCP server
cd docker
docker-compose -f docker-compose.yml -f docker-compose.mcp.yml up -d

# Pull AI model (if not already done)
npm run ai:pull:deepseek

# Test MCP integration
./test-mcp-integration.sh
```

### 2. Environment Configuration

Add these environment variables to your `.env.docker`:

```env
# MCP Configuration
ENABLE_MCP_INTEGRATION=true
MCP_SERVER_CONTAINER=botct-mcp-server
MCP_FALLBACK_MODE=true

# Keep existing Ollama configuration
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_DEFAULT_MODEL=deepseek-r1:7b
```

### 3. Update NPCAIAgent (Minimal Changes)

```typescript
// packages/server/src/ai/agents/NPCAIAgent.ts
import { MCPAdapter, EnhancedContextBuilder } from "../mcp/MCPAdapter.js";

export class NPCAIAgent {
  private mcpAdapter: MCPAdapter;
  private contextBuilder: EnhancedContextBuilder;

  constructor(
    gameId: GameId,
    seatId: SeatId,
    character: Character,
    seatName: string,
    gameEngine: GameEngine,
    ollamaClient?: OllamaClient,
    npcProfile?: NPCProfile,
  ) {
    // Keep existing initialization
    // ...existing code...

    // Add MCP integration
    this.mcpAdapter = new MCPAdapter(gameId, seatName);
    this.contextBuilder = new EnhancedContextBuilder(this.mcpAdapter);

    // Initialize MCP (non-blocking)
    this.mcpAdapter.initialize().catch(console.warn);
  }

  // Enhance existing methods
  private async buildGameContext(gameState: GameState): Promise<any> {
    // Get traditional context
    const traditionalContext = {
      phase: gameState.phase,
      day: gameState.day,
      players: gameState.players,
      // ...existing context building
    };

    // Enhance with MCP data
    return await this.contextBuilder.buildGameContext(traditionalContext);
  }

  // Enhanced decision logging
  private async logDecision(decision: AIDecision): Promise<void> {
    // Keep existing logging
    // ...existing code...

    // Add MCP logging
    await this.mcpAdapter.logDecision(
      decision.action,
      decision.target,
      decision.reasoning,
      { confidence: decision.confidence },
    );
  }
}
```

## 📋 Deployment Options

### Option 1: Hybrid Integration (Recommended)

- **Benefits**: Gradual migration, fallback capability, enhanced state management
- **Use Case**: Production systems where reliability is critical
- **Setup**: Follow Quick Start above

### Option 2: Full MCP Replacement

- **Benefits**: Fully stateless agents, centralized state, easier debugging
- **Use Case**: New deployments or when you want maximum benefits
- **Setup**: Replace NPCAIAgent with EnhancedNPCAIAgent

### Option 3: MCP as Optional Enhancement

- **Benefits**: No risk, easy rollback, optional features
- **Use Case**: Testing MCP benefits without changing core system
- **Setup**: Set `ENABLE_MCP_INTEGRATION=false` to disable

## 🐳 Docker Configuration

### Core Services (docker-compose.yml)

```yaml
services:
  botct-server:
    environment:
      - ENABLE_MCP_INTEGRATION=${ENABLE_MCP_INTEGRATION:-false}
      - MCP_SERVER_CONTAINER=botct-mcp-server
      - OLLAMA_BASE_URL=http://ollama:11434

  ollama:
    image: ollama/ollama:latest
    # Keep existing Ollama configuration
```

### MCP Extension (docker-compose.mcp.yml)

```yaml
services:
  mcp-server:
    build:
      context: ../packages/mcp-server
      dockerfile: Dockerfile
    container_name: botct-mcp-server
    environment:
      - NODE_ENV=development
    volumes:
      - ../data:/app/data:ro
    networks:
      - botct-network
```

## 🔧 Integration Patterns

### Pattern 1: Enhanced Context (Minimal Change)

```typescript
// Add MCP data to existing prompts
const context = await this.contextBuilder.buildGameContext(gameState);
const prompt = PromptTemplates.getDecisionPrompt(character, context);
```

### Pattern 2: Decision Logging (Zero Breaking Changes)

```typescript
// Log decisions to both traditional logs and MCP journal
logger.info(`AI Decision: ${decision.action}`);
await this.mcpAdapter.logDecision(
  decision.action,
  decision.target,
  decision.reasoning,
);
```

### Pattern 3: Gradual State Migration

```typescript
// Use MCP for new state, keep existing for compatibility
const mcpGameState = await this.mcpAdapter.getGameState();
const gameState = mcpGameState || this.buildTraditionalGameState();
```

## 📊 Monitoring & Debugging

### Check MCP Server Status

```bash
docker exec botct-mcp-server node -e "
  console.log(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize'}))
" | docker exec -i botct-mcp-server node /app/dist/index.js
```

### View MCP Logs

```bash
docker logs botct-mcp-server -f
```

### Test MCP Integration

```bash
# Test script to validate all MCP tools
npm run test:mcp
```

### Fallback Verification

```bash
# Test that system works without MCP
docker stop botct-mcp-server
npm run ai:test  # Should still work in fallback mode
```

## 🚦 npm Scripts

Add these to your root `package.json`:

```json
{
  "scripts": {
    "mcp:start": "cd docker && docker-compose -f docker-compose.yml -f docker-compose.mcp.yml up -d",
    "mcp:stop": "cd docker && docker-compose -f docker-compose.mcp.yml down",
    "mcp:logs": "docker logs botct-mcp-server -f",
    "mcp:test": "cd packages/mcp-server && npm test",
    "test:mcp": "./scripts/test-mcp-integration.sh",
    "ai:start:mcp": "npm run mcp:start && npm run ai:pull:deepseek"
  }
}
```

## 🔄 Migration Timeline

### Phase 1: Preparation (Week 1)

- [ ] Deploy MCP server alongside existing system
- [ ] Test MCP server independently
- [ ] Verify Docker integration

### Phase 2: Integration (Week 2)

- [ ] Add MCPAdapter to existing NPCAIAgent
- [ ] Enable decision logging to MCP
- [ ] Test hybrid mode in development

### Phase 3: Enhancement (Week 3)

- [ ] Use MCP for context building
- [ ] Enable suspicion network analysis
- [ ] Monitor performance and reliability

### Phase 4: Full Migration (Optional)

- [ ] Replace stateful agents with stateless ones
- [ ] Remove traditional state management
- [ ] Optimize for MCP-only operation

## 🛠️ Troubleshooting

### MCP Server Won't Start

```bash
# Check build
cd packages/mcp-server && npm run build

# Check Docker logs
docker logs botct-mcp-server

# Verify TypeScript compilation
docker exec botct-mcp-server ls -la /app/dist/
```

### NPCAIAgent Integration Issues

```bash
# Test MCP adapter separately
node -e "
  const { MCPAdapter } = require('./packages/server/dist/ai/mcp/MCPAdapter.js');
  const adapter = new MCPAdapter('test-game', 'test-player');
  adapter.initialize().then(console.log);
"
```

### Performance Concerns

- **MCP Latency**: Each MCP call adds ~10-50ms depending on data size
- **Fallback**: System gracefully falls back to stateful mode if MCP unavailable
- **Caching**: Consider caching frequent MCP calls for 1-2 seconds

## 🔒 Security Considerations

- MCP server runs in isolated container
- No network ports exposed (communication via docker exec)
- Read-only access to game data
- Journal data persisted in container volumes

## 📈 Benefits Gained

### Immediate Benefits (Hybrid Mode)

- Decision history tracking
- Suspicion network analysis
- Enhanced context for AI decisions
- Debugging visibility

### Long-term Benefits (Full Migration)

- Fully stateless agents
- Agent restart resilience
- Centralized state management
- Multi-agent coordination
- Simplified debugging

## 🎯 Next Steps

1. **Deploy MCP Server**: Start with hybrid integration
2. **Test Thoroughly**: Verify both MCP and fallback modes work
3. **Monitor Performance**: Check latency and reliability metrics
4. **Gradual Migration**: Move features one at a time to MCP
5. **Optimize**: Fine-tune based on real usage patterns

The hybrid approach ensures you get immediate benefits while maintaining system reliability and providing a clear migration path.
