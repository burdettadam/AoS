# 🤖 AI NPC Agents for Blood on the Clock Tower

This system adds intelligent NPC agents to your Blood on the Clock Tower digital game using local LLM models. The AI agents can participate in discussions, make strategic decisions, vote, and use character abilities just like human players.

## 🏗️ Architecture Overview

The AI system consists of several components:

```
packages/server/src/ai/
├── llm/
│   ├── OllamaClient.ts          # Interface to local Ollama LLM server
│   └── PromptTemplates.ts       # Character-specific prompt generation
├── agents/
│   └── NPCAIAgent.ts           # Individual AI agent behavior logic
├── AIAgentManager.ts           # Coordinates multiple agents per game
├── AIGameIntegration.ts        # Example integration with GameEngine
└── test-ai-integration.ts      # Test script for setup verification
```

## 🚀 Quick Setup

### 1. Install Ollama

**macOS:**

```bash
brew install ollama
```

**Linux:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download

### 2. Start Ollama Service

```bash
ollama serve
```

### 3. Pull a Language Model

**Recommended (DeepSeek-R1 - 7B, 4.7GB):**

```bash
ollama pull deepseek-r1:7b
```

**Lighter Options:**

```bash
ollama pull llama3.2:3b        # 2.0GB
ollama pull phi4-mini          # 2.5GB
ollama pull gemma3:2b          # 1.5GB
```

### 4. Test the Integration

```bash
npx ts-node packages/server/src/ai/test-ai-integration.ts
```

## 🎯 System Requirements

| Model Size | RAM Required | Performance Level    |
| ---------- | ------------ | -------------------- |
| 2B Models  | 2GB+         | Basic but functional |
| 3B Models  | 4GB+         | Good performance     |
| 7B Models  | 8GB+         | Excellent reasoning  |

## 🎮 Integration with Your Game

### Basic Integration

```typescript
import { AIAgentManager } from "./ai/AIAgentManager";
import { GameEngine } from "./game/engine";

// Initialize AI system
const gameEngine = new GameEngine();
const aiManager = new AIAgentManager(gameEngine);
await aiManager.initialize();

// Create AI agent when adding NPC to game
const seatId = await gameEngine.addPlayer(gameId, "ai-npc", true);
if (seatId) {
  await aiManager.createAgent(gameId, seatId, character, "AI Player");
}

// Process game events for AI reactions
await aiManager.processGameEvent(gameId, "phase_changed", gameState);

// Handle voting phases
await aiManager.processVotingPhase(gameId, nominee, reason, gameState);
```

### WebSocket Integration

```typescript
// In your WebSocket handler
webSocket.on("chat_message", async (data) => {
  // Broadcast to humans
  broadcastToGame(data.gameId, data);

  // Let AI agents potentially respond
  await aiManager.processGameEvent(data.gameId, "player_spoke", gameState);
});
```

## 🧠 AI Behavior Features

### Character-Specific Personalities

Each AI agent adapts its personality based on its character:

- **Investigator**: Analytical, asks probing questions
- **Washerwoman**: Observant, notices inconsistencies
- **Empath**: Intuitive, reads emotional tells
- **Imp**: Charismatic but deceptive
- **Poisoner**: Subtle and manipulative
- **Recluse**: Withdrawn and defensive

### Dynamic Traits

AI agents have procedurally generated personality traits:

- **Chattiness** (0-1): How often they speak
- **Suspicion** (0-1): How paranoid/cautious they are
- **Boldness** (0-1): Likelihood to make risky moves

### Strategic Capabilities

- **Information Analysis**: Tracks claims and contradictions
- **Voting Strategy**: Considers team win conditions
- **Timing Awareness**: Natural conversation pacing
- **Character Consistency**: Maintains roleplay throughout game

## 🎭 Character Ability Support

The system integrates with your existing action system:

```typescript
// Night actions for characters with abilities
case GamePhase.NIGHT:
  const decision = await agent.considerNightAction(gameState);
  if (decision.action === 'night_action') {
    await gameEngine.performNightAction(
      gameId,
      seatId,
      decision.target
    );
  }
```

## 🔧 Configuration Options

### Model Selection

```typescript
const ollamaClient = new OllamaClient(
  "http://localhost:11434", // Ollama server URL
  "deepseek-r1:7b", // Model name
);
```

### Response Tuning

```typescript
const response = await ollamaClient.chat(messages, {
  temperature: 0.8, // Creativity (0-1)
  max_tokens: 200, // Response length limit
});
```

### Personality Customization

Modify `generatePersonalityTrait()` in `NPCAIAgent.ts` to adjust character behaviors.

## 🚦 API Endpoints

Add these routes to support AI management:

```typescript
// Check AI system status
GET /api/ai/status

// Add AI NPC to game
POST /api/games/:gameId/npc/ai

// Get AI statistics
GET /api/ai/stats
```

## 🐛 Debugging & Monitoring

### Logging

The system logs all AI decisions and reasoning:

```
[AI Chat] Game abc123, Seat seat456: I think Bob's claim is suspicious...
AI Agent nomination: seat456 nominates bob - contradictory information claims
```

### Performance Monitoring

```typescript
const stats = aiManager.getStats();
console.log(
  `Active AI agents: ${stats.totalAgents} across ${stats.gameCount} games`,
);
```

### Testing Individual Agents

```typescript
// Test specific character prompts
const response = await PromptTemplates.getDayDiscussionPrompt(
  investigatorCharacter,
  gameContext,
  ["Alice: I saw someone visit Bob last night"],
);
```

## ⚡ Performance Optimization

### Request Batching

AI agents process events sequentially to avoid overwhelming the LLM server.

### Context Management

Conversation history is automatically trimmed to prevent context explosion while maintaining character consistency.

### Caching

Common responses and character data are cached to reduce API calls.

## 🔐 Security Considerations

- **Information Masking**: AI agents only receive game state information they should legitimately know
- **Action Validation**: All AI decisions go through the same validation as human players
- **Rate Limiting**: Built-in delays prevent AI agents from spamming

## 📊 Game Balance

AI agents are designed to:

- Play their assigned team (Good vs Evil) strategically
- Make believable mistakes occasionally
- Adapt difficulty based on player count and game state
- Provide engaging social interactions without being overpowered

## 🔮 Future Enhancements

Possible additions:

- **Voice Integration**: Text-to-speech for AI responses
- **Learning System**: Improve AI behavior based on game outcomes
- **Custom Personalities**: Player-defined AI character traits
- **Multi-Model Support**: Different models for different character types
- **Cloud Integration**: Option for cloud-based models alongside local ones

## 🤝 Contributing

To extend the AI system:

1. **New Characters**: Add personality definitions in `PromptTemplates.ts`
2. **Behavior Patterns**: Modify decision logic in `NPCAIAgent.ts`
3. **Integration Points**: Extend `AIAgentManager.ts` for new game events
4. **Prompt Engineering**: Improve character prompts for better roleplay

## 📚 References

- [Ollama Documentation](https://github.com/ollama/ollama)
- [DeepSeek Model Details](https://ollama.com/library/deepseek-r1)
- [Blood on the Clock Tower Rules](https://bloodontheclocktower.com/)

---

**Ready to add intelligent NPCs to your games?** 🎲

Run the test script and start creating more engaging game experiences!
