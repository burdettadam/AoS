import { ChildProcess, spawn } from "child_process";

export interface MCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Client for communicating with MCP server via subprocess
 */
export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 1;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();
  private isInitialized = false;

  constructor(private serverPath: string = "node dist/index.js") {}

  /**
   * Initialize the MCP server connection
   */
  async initialize(): Promise<boolean> {
    try {
      // In Docker environment, use the MCP server container
      if (
        process.env.NODE_ENV === "development" &&
        process.env.MCP_SERVER_CONTAINER
      ) {
        this.serverPath = `docker exec ${process.env.MCP_SERVER_CONTAINER} node /app/dist/index.js`;
      }

      this.process = spawn("sh", ["-c", this.serverPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      this.setupProcessHandlers();

      // Send initialize request
      const response = await this.call("initialize", {});
      this.isInitialized = true;

      console.log("MCP Client initialized:", response);
      return true;
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      return false;
    }
  }

  /**
   * Make a request to the MCP server
   */
  async call(method: string, params: any = {}): Promise<any> {
    if (!this.process || !this.isInitialized) {
      throw new Error("MCP client not initialized");
    }

    const id = this.requestId++;
    const request: MCPRequest = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const requestJson = JSON.stringify(request) + "\n";
      this.process!.stdin!.write(requestJson);

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP request timeout for method: ${method}`));
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Convenience methods for common MCP operations
   */
  async getGameState(gameId: string) {
    return this.call("tools/call", {
      name: "get_game_state",
      arguments: { gameId },
    });
  }

  async getPlayerInfo(gameId: string, playerId: string) {
    return this.call("tools/call", {
      name: "get_player_info",
      arguments: { gameId, playerId },
    });
  }

  async getNPCProfile(profileId: string) {
    return this.call("tools/call", {
      name: "get_npc_profile",
      arguments: { profileId },
    });
  }

  async addJournalEntry(
    gameId: string,
    playerId: string,
    type: string,
    content: string,
    metadata?: any,
  ) {
    return this.call("tools/call", {
      name: "add_journal_entry",
      arguments: { gameId, playerId, type, content, metadata },
    });
  }

  async getJournalEntries(
    gameId: string,
    playerId?: string,
    entryType?: string,
  ) {
    return this.call("tools/call", {
      name: "get_journal_entries",
      arguments: { gameId, playerId, entryType },
    });
  }

  async getSuspicionNetwork(gameId: string) {
    return this.call("tools/call", {
      name: "get_suspicion_network",
      arguments: { gameId },
    });
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers() {
    if (!this.process) return;

    let buffer = "";

    this.process.stdout!.on("data", (data: Buffer) => {
      buffer += data.toString();

      // Process complete JSON responses
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response: MCPResponse = JSON.parse(line);
            this.handleResponse(response);
          } catch (error) {
            console.error("Failed to parse MCP response:", line, error);
          }
        }
      }
    });

    this.process.stderr!.on("data", (data: Buffer) => {
      console.error("MCP server error:", data.toString());
    });

    this.process.on("close", (code) => {
      console.log(`MCP server process closed with code ${code}`);
      this.cleanup();
    });

    this.process.on("error", (error) => {
      console.error("MCP server process error:", error);
      this.cleanup();
    });
  }

  /**
   * Handle response from MCP server
   */
  private handleResponse(response: MCPResponse) {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(`MCP Error: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.isInitialized = false;

    // Reject all pending requests
    for (const [_id, { reject }] of this.pendingRequests) {
      reject(new Error("MCP server connection closed"));
    }
    this.pendingRequests.clear();

    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }

  /**
   * Close the MCP connection
   */
  async close() {
    this.cleanup();
  }
}
