import { spawn } from "child_process";

/**
 * MCP-only adapter for stateless AI agents
 * Requires MCP server to be available - no fallback modes
 */
export class MCPAdapter {
  private initialized = false;

  constructor(
    private gameId: string,
    private playerId: string,
  ) {}

  /**
   * Initialize MCP connection
   */
  async initialize(): Promise<void> {
    await this.executeQuery("initialize", {});
    this.initialized = true;
    console.log("MCP adapter initialized successfully");
  }

  /**
   * Get game state from MCP server
   */
  async getGameState(): Promise<any> {
    if (!this.initialized) {
      throw new Error("MCP adapter not initialized");
    }

    return await this.executeQuery("tools/call", {
      name: "get_game_state",
      arguments: { gameId: this.gameId },
    });
  }

  /**
   * Get player-specific information
   */
  async getPlayerInfo(): Promise<any> {
    if (!this.initialized) {
      throw new Error("MCP adapter not initialized");
    }

    return await this.executeQuery("tools/call", {
      name: "get_player_info",
      arguments: { gameId: this.gameId, playerId: this.playerId },
    });
  }

  /**
   * Log decision to MCP journal
   */
  async logDecision(
    action: string,
    target?: string,
    reasoning?: string,
    metadata?: any,
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error("MCP adapter not initialized");
    }

    const content = `Action: ${action}${target ? ` targeting ${target}` : ""}. ${reasoning || "No reasoning provided"}`;

    await this.executeQuery("tools/call", {
      name: "add_journal_entry",
      arguments: {
        gameId: this.gameId,
        playerId: this.playerId,
        type: "decision",
        content,
        metadata: {
          action,
          target,
          reasoning,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  }

  /**
   * Get recent decision history
   */
  async getDecisionHistory(): Promise<any[]> {
    if (!this.initialized) {
      throw new Error("MCP adapter not initialized");
    }

    const response = await this.executeQuery("tools/call", {
      name: "get_decision_history",
      arguments: { gameId: this.gameId, playerId: this.playerId },
    });
    return response?.result || [];
  }

  /**
   * Get suspicion network
   */
  async getSuspicionNetwork(): Promise<any> {
    if (!this.initialized) {
      throw new Error("MCP adapter not initialized");
    }

    const response = await this.executeQuery("tools/call", {
      name: "get_suspicion_network",
      arguments: { gameId: this.gameId },
    });
    return response?.result || {};
  }

  /**
   * Execute MCP query via subprocess
   */
  private async executeQuery(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      };

      // In Docker environment, execute via container
      let command = "node";
      let args = ["/app/packages/mcp-server/dist/index.js"];

      if (process.env.NODE_ENV === "development") {
        // Local development
        command = "node";
        args = ["packages/mcp-server/dist/index.js"];
      } else if (process.env.MCP_SERVER_CONTAINER) {
        // Docker environment
        command = "docker";
        args = [
          "exec",
          process.env.MCP_SERVER_CONTAINER,
          "node",
          "/app/dist/index.js",
        ];
      }

      const child = spawn(command, args, { stdio: "pipe" });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          try {
            const response = JSON.parse(stdout.trim());
            if (response.error) {
              reject(new Error(`MCP Error: ${response.error.message}`));
            } else {
              resolve(response);
            }
          } catch (error) {
            reject(new Error(`Failed to parse MCP response: ${stdout}`));
          }
        } else {
          reject(new Error(`MCP process failed with code ${code}: ${stderr}`));
        }
      });

      child.on("error", (error) => {
        reject(error);
      });

      // Send request
      child.stdin.write(JSON.stringify(request) + "\n");
      child.stdin.end();
    });
  }
}

/**
 * MCP-only context builder - no fallbacks
 */
export class MCPContextBuilder {
  constructor(private mcpAdapter: MCPAdapter) {}

  /**
   * Build game context exclusively from MCP data
   */
  async buildGameContext(): Promise<any> {
    // Get MCP data
    const [mcpGameState, playerInfo, decisionHistory, suspicionNetwork] =
      await Promise.all([
        this.mcpAdapter.getGameState(),
        this.mcpAdapter.getPlayerInfo(),
        this.mcpAdapter.getDecisionHistory(),
        this.mcpAdapter.getSuspicionNetwork(),
      ]);

    return {
      // Core game state from MCP
      gameState: mcpGameState?.result,
      playerInfo: playerInfo?.result,
      decisionHistory,
      suspicionNetwork,

      // Computed enhanced fields
      enhancedContext: {
        recentDecisions: decisionHistory.slice(-5),
        suspicionToward: suspicionNetwork[this.mcpAdapter["playerId"]] || {},
        trustLevel: this.calculateTrustLevel(suspicionNetwork),
        experienceLevel: decisionHistory.length,
      },
    };
  }

  /**
   * Calculate overall trust level based on suspicion network
   */
  private calculateTrustLevel(suspicionNetwork: any): number {
    const myNetwork = suspicionNetwork[this.mcpAdapter["playerId"]] || {};
    const suspicionValues = Object.values(myNetwork) as number[];

    if (suspicionValues.length === 0) return 0.5; // Neutral

    const avgSuspicion =
      suspicionValues.reduce((sum, val) => sum + val, 0) /
      suspicionValues.length;
    return Math.max(0, 1 - avgSuspicion); // High suspicion = low trust
  }
}
