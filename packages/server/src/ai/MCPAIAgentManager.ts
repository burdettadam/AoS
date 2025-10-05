import { Character } from "@ashes-of-salem/shared";
import { AIDecision, MCPAIAgent } from "./agents/MCPAIAgent.js";

/**
 * Pure MCP-based AI Agent Manager - no fallback modes
 * Manages stateless AI agents that rely entirely on MCP server
 */
export class MCPAIAgentManager {
  private agents: Map<string, MCPAIAgent> = new Map(); // gameId-seatId -> agent

  constructor() {
    console.log(
      "MCP AI Agent Manager initialized - MCP server required for all operations",
    );
  }

  /**
   * Initialize MCP AI system - throws if MCP server unavailable
   */
  async initialize(): Promise<void> {
    console.log("Initializing MCP AI Agent Manager...");
    // No health checks - agents will throw if MCP unavailable
    console.log(
      "MCP AI Agent Manager ready - agents will be created on demand",
    );
  }

  /**
   * Create an MCP-based AI agent
   */
  async createAgent(
    gameId: string,
    seatId: string,
    character: Character,
    seatName: string,
    npcProfileId?: string,
  ): Promise<void> {
    const agentKey = `${gameId}-${seatId}`;

    if (this.agents.has(agentKey)) {
      throw new Error(`MCP agent already exists for ${agentKey}`);
    }

    const agent = new MCPAIAgent(
      gameId,
      seatId,
      character,
      seatName,
      npcProfileId || "analytical-skeptic",
    );

    // Initialize agent - will throw if MCP server unavailable
    await agent.initialize();

    this.agents.set(agentKey, agent);
    console.log(
      `Created MCP AI agent for ${seatName} as ${character.name} in game ${gameId}`,
    );
  }

  /**
   * Remove an AI agent
   */
  async removeAgent(gameId: string, seatId: string): Promise<boolean> {
    const agentKey = `${gameId}-${seatId}`;
    const agent = this.agents.get(agentKey);

    if (agent) {
      await agent.cleanup();
      const removed = this.agents.delete(agentKey);

      if (removed) {
        console.log(
          `Removed MCP AI agent for seat ${seatId} in game ${gameId}`,
        );
      }

      return removed;
    }

    return false;
  }

  /**
   * Remove all agents for a game
   */
  async removeGameAgents(gameId: string): Promise<number> {
    let removed = 0;

    for (const [key, agent] of this.agents) {
      if (key.startsWith(`${gameId}-`)) {
        await agent.cleanup();
        this.agents.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Removed ${removed} MCP AI agents for game ${gameId}`);
    }

    return removed;
  }

  /**
   * Process a game event for all agents in a game
   */
  async processGameEvent(
    gameId: string,
    eventType: string,
    _eventData?: any,
  ): Promise<void> {
    const gameAgents = Array.from(this.agents.entries())
      .filter(([key]) => key.startsWith(`${gameId}-`))
      .map(([_, agent]) => agent);

    if (gameAgents.length === 0) {
      console.log(`No MCP agents found for game ${gameId}`);
      return;
    }

    console.log(
      `Processing event '${eventType}' for ${gameAgents.length} MCP agents in game ${gameId}`,
    );

    // Process events for all agents in parallel
    const decisions = await Promise.allSettled(
      gameAgents.map(async (agent) => {
        try {
          const decision = await agent.processGameEvent(eventType);
          if (decision) {
            await this.executeDecision(gameId, agent, decision);
          }
          return decision;
        } catch (error) {
          console.error(`Error processing event for agent:`, error);
          return null;
        }
      }),
    );

    const successful = decisions.filter(
      (result) => result.status === "fulfilled",
    ).length;
    console.log(
      `Processed event for ${successful}/${gameAgents.length} agents successfully`,
    );
  }

  /**
   * Execute an AI decision
   */
  private async executeDecision(
    gameId: string,
    agent: MCPAIAgent,
    decision: AIDecision,
  ): Promise<void> {
    try {
      switch (decision.action) {
        case "speak":
          if (decision.message) {
            console.log(
              `[${gameId}] ${agent["seatName"]}: ${decision.message}`,
            );
            // TODO: Integrate with your chat/communication system
          }
          break;

        case "nominate":
          if (decision.target) {
            console.log(
              `[${gameId}] ${agent["seatName"]} nominates ${decision.target}: ${decision.reasoning}`,
            );
            // TODO: Integrate with your game engine nomination system
          }
          break;

        case "vote":
          if (decision.target) {
            console.log(
              `[${gameId}] ${agent["seatName"]} votes on ${decision.target}: ${decision.reasoning}`,
            );
            // TODO: Integrate with your game engine voting system
          }
          break;

        case "night_action":
          if (decision.target) {
            console.log(
              `[${gameId}] ${agent["seatName"]} night action on ${decision.target}: ${decision.reasoning}`,
            );
            // TODO: Integrate with your game engine night action system
          }
          break;

        case "pass":
          console.log(
            `[${gameId}] ${agent["seatName"]} passes: ${decision.reasoning}`,
          );
          break;

        default:
          console.warn(`Unknown action type: ${decision.action}`);
      }
    } catch (error) {
      console.error(
        `Failed to execute AI decision for ${agent["seatName"]}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update agent behavior based on game events
   */
  async updateAgentBehavior(
    gameId: string,
    seatId: string,
    event: any,
  ): Promise<void> {
    const agentKey = `${gameId}-${seatId}`;
    const agent = this.agents.get(agentKey);

    if (agent) {
      await agent.updateBehavior(event);
    }
  }

  /**
   * Get agent status for monitoring
   */
  getAgentStatus(): Array<{
    gameId: string;
    seatId: string;
    seatName: string;
  }> {
    return Array.from(this.agents.entries()).map(([key, agent]) => {
      const [gameId, seatId] = key.split("-");
      return {
        gameId,
        seatId,
        seatName: agent["seatName"],
      };
    });
  }

  /**
   * Check if an agent exists
   */
  hasAgent(gameId: string, seatId: string): boolean {
    return this.agents.has(`${gameId}-${seatId}`);
  }

  /**
   * Get agent count for a game
   */
  getGameAgentCount(gameId: string): number {
    return Array.from(this.agents.keys()).filter((key) =>
      key.startsWith(`${gameId}-`),
    ).length;
  }

  /**
   * Cleanup all agents
   */
  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.agents.size} MCP AI agents...`);

    await Promise.all(
      Array.from(this.agents.values()).map((agent) => agent.cleanup()),
    );

    this.agents.clear();
    console.log("All MCP AI agents cleaned up");
  }
}
