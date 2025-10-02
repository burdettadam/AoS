#!/usr/bin/env ts-node

/**
 * Simple test script for AI Agent integration
 * Run with: npx ts-node packages/server/src/ai/test-ai-integration.ts
 */

import { GamePhase } from "@botc/shared";
import { OllamaClient } from "./llm/OllamaClient";
import { PromptTemplates } from "./llm/PromptTemplates";

async function testOllamaConnection() {
  console.log("🔗 Testing Ollama connection...");

  const client = new OllamaClient();

  try {
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
      console.log("✅ Ollama is running and has models available");

      const models = await client.listModels();
      console.log("📋 Available models:", models);

      return true;
    } else {
      console.log(
        "⚠️  Ollama not available. Attempting to pull DeepSeek-R1...",
      );

      const modelEnsured = await client.ensureModel("deepseek-r1:7b");
      if (modelEnsured) {
        console.log("✅ DeepSeek-R1 model is now available");
        return true;
      } else {
        console.log(
          "❌ Could not ensure DeepSeek model. Please install Ollama and run:",
        );
        console.log("   ollama pull deepseek-r1:7b");
        return false;
      }
    }
  } catch (error) {
    console.error("❌ Error testing Ollama:", error);
    return false;
  }
}

async function testCharacterPrompt() {
  console.log("\n🤖 Testing character AI prompt...");

  const client = new OllamaClient();

  // Mock character data
  const mockCharacter = {
    id: "investigator",
    name: "Investigator",
    team: "townsfolk" as const,
    ability: "You start knowing that 1 of 2 players is a particular Minion.",
    firstNight: 1,
    otherNights: undefined,
    reminders: [],
    setup: false,
    special: undefined,
    editions: ["trouble-brewing"],
    tags: ["information"],
    wikiUrl: undefined,
    imageUrl: undefined,
    howToRun: "",
    firstNightDescription: "",
    tipsAndTricks: "",
    bluffing: "",
    legacy: {
      category: "townsfolk",
      originalSource: "trouble-brewing",
    },
  };

  const mockGameContext = {
    phase: GamePhase.DAY,
    day: 1,
    playerCount: 7,
    aliveCount: 7,
    deadPlayers: [],
    recentEvents: ["Game started", "Night 1 completed"],
    publicClaims: {},
    votingHistory: [],
  };

  try {
    // Test system prompt
    const systemPrompt = PromptTemplates.getSystemPrompt(
      mockCharacter,
      "Alice",
    );
    console.log(
      "📝 System prompt generated:",
      systemPrompt.content.substring(0, 200) + "...",
    );

    // Test day discussion prompt
    const dayPrompt = PromptTemplates.getDayDiscussionPrompt(
      mockCharacter,
      mockGameContext,
      ["Bob: I think we should be careful about claims today."],
    );

    console.log("💬 Sending test conversation to Ollama...");

    const response = await client.chat([systemPrompt, dayPrompt], {
      temperature: 0.7,
      max_tokens: 150,
    });

    console.log("🎭 AI Character Response:", response);
    return true;
  } catch (error) {
    console.error("❌ Error testing character prompt:", error);
    return false;
  }
}

async function runSetupInstructions() {
  console.log("\n📚 AI NPC Setup Instructions");
  console.log("================================");
  console.log("");
  console.log("1. Install Ollama:");
  console.log("   macOS: brew install ollama");
  console.log("   Linux: curl -fsSL https://ollama.ai/install.sh | sh");
  console.log("   Windows: Download from https://ollama.ai/download");
  console.log("");
  console.log("2. Start Ollama service:");
  console.log("   ollama serve");
  console.log("");
  console.log("3. Pull recommended model:");
  console.log("   ollama pull deepseek-r1:7b  # 4.7GB, excellent reasoning");
  console.log("   # OR for lighter option:");
  console.log("   ollama pull llama3.2:3b     # 2.0GB, still very capable");
  console.log("");
  console.log("4. Alternative models to consider:");
  console.log(
    "   ollama pull phi4-mini       # 2.5GB, Microsoft efficient model",
  );
  console.log("   ollama pull gemma3:2b       # 1.5GB, ultra-lightweight");
  console.log("");
  console.log("💡 System Requirements:");
  console.log("   - 8GB+ RAM for 7B models");
  console.log("   - 4GB+ RAM for 3B models");
  console.log("   - 2GB+ RAM for 2B models");
  console.log("");
}

async function main() {
  console.log("🎮 Blood on the Clock Tower - AI Agent Integration Test");
  console.log("=======================================================");

  const ollamaWorking = await testOllamaConnection();

  if (ollamaWorking) {
    await testCharacterPrompt();
    console.log("\n✅ AI integration test completed successfully!");
    console.log("🚀 You can now add AI NPCs to your games.");

    // Show integration example
    console.log("\n📖 Integration Example:");
    console.log("========================");
    console.log(`
// In your game setup:
import { AIAgentManager } from './ai/AIAgentManager';

const aiManager = new AIAgentManager(gameEngine);
await aiManager.initialize();

// When creating NPCs:
await aiManager.createAgent(gameId, seatId, character, playerName);

// On game events:
await aiManager.processGameEvent(gameId, 'phase_changed', gameState);
`);
  } else {
    await runSetupInstructions();
    console.log("\n❌ Please set up Ollama first, then run this test again.");
  }
}

if (require.main === module) {
  main().catch(console.error);
}
