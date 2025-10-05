#!/usr/bin/env node

import { GameStateService } from "./services/GameStateService.js";
import { JournalService } from "./services/JournalService.js";
import { NPCProfileService } from "./services/NPCProfileService.js";
import {
  handleGameTools,
  handleJournalTools,
  handleProfileTools,
} from "./tools/index.js";

interface MCPRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class SimpleMCPServer {
  private gameStateService: GameStateService;
  private npcProfileService: NPCProfileService;
  private journalService: JournalService;

  constructor() {
    this.gameStateService = new GameStateService();
    this.npcProfileService = new NPCProfileService();
    this.journalService = new JournalService();
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case "tools/list":
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: [
                // Game state tools
                {
                  name: "get_game_state",
                  description:
                    "Get current game state including phase, day, players, and voting history",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game to retrieve",
                      },
                    },
                    required: ["gameId"],
                  },
                },
                {
                  name: "get_player_info",
                  description:
                    "Get detailed information about a specific player",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                      playerId: {
                        type: "string",
                        description: "The ID of the player to get info for",
                      },
                    },
                    required: ["gameId", "playerId"],
                  },
                },
                {
                  name: "get_voting_history",
                  description: "Get voting history for a game or specific day",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                      day: {
                        type: "number",
                        description: "Optional day number to filter by",
                      },
                    },
                    required: ["gameId"],
                  },
                },
                {
                  name: "get_character_info",
                  description:
                    "Get information about a specific character role",
                  inputSchema: {
                    type: "object",
                    properties: {
                      characterId: {
                        type: "string",
                        description: "The ID of the character to get info for",
                      },
                    },
                    required: ["characterId"],
                  },
                },
                // NPC Profile tools
                {
                  name: "get_npc_profile",
                  description: "Get a specific NPC personality profile",
                  inputSchema: {
                    type: "object",
                    properties: {
                      profileId: {
                        type: "string",
                        description: "The ID of the profile to retrieve",
                      },
                    },
                    required: ["profileId"],
                  },
                },
                {
                  name: "list_npc_profiles",
                  description: "List all available NPC personality profiles",
                  inputSchema: {
                    type: "object",
                    properties: {},
                  },
                },
                {
                  name: "update_npc_behavior",
                  description: "Update NPC behavior parameters",
                  inputSchema: {
                    type: "object",
                    properties: {
                      profileId: {
                        type: "string",
                        description: "The ID of the profile to update",
                      },
                      updates: {
                        type: "object",
                        description: "Behavior parameters to update",
                      },
                    },
                    required: ["profileId", "updates"],
                  },
                },
                // Journal tools
                {
                  name: "get_journal_entries",
                  description:
                    "Get journal entries for a game, optionally filtered by player or entry type",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                      playerId: {
                        type: "string",
                        description: "Optional player ID to filter entries",
                      },
                      entryType: {
                        type: "string",
                        enum: [
                          "claim",
                          "observation",
                          "decision",
                          "suspicion",
                          "analysis",
                        ],
                        description: "Optional entry type to filter by",
                      },
                    },
                    required: ["gameId"],
                  },
                },
                {
                  name: "add_journal_entry",
                  description: "Add a new journal entry for a player",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                      playerId: {
                        type: "string",
                        description: "The ID of the player making the entry",
                      },
                      type: {
                        type: "string",
                        enum: [
                          "claim",
                          "observation",
                          "decision",
                          "suspicion",
                          "analysis",
                        ],
                        description: "The type of journal entry",
                      },
                      content: {
                        type: "string",
                        description: "The content of the journal entry",
                      },
                      metadata: {
                        type: "object",
                        description: "Optional metadata for the entry",
                      },
                    },
                    required: ["gameId", "playerId", "type", "content"],
                  },
                },
                {
                  name: "get_decision_history",
                  description: "Get a player's decision history for analysis",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                      playerId: {
                        type: "string",
                        description: "The ID of the player",
                      },
                    },
                    required: ["gameId", "playerId"],
                  },
                },
                {
                  name: "get_suspicion_network",
                  description:
                    "Get the suspicion network showing who suspects whom",
                  inputSchema: {
                    type: "object",
                    properties: {
                      gameId: {
                        type: "string",
                        description: "The ID of the game",
                      },
                    },
                    required: ["gameId"],
                  },
                },
              ],
            },
          };

        case "tools/call": {
          const { name, arguments: args } = request.params;

          // Try game tools first
          let result = await handleGameTools(name, args, this.gameStateService);
          if (result !== null) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              result,
            };
          }

          // Try profile tools
          result = await handleProfileTools(name, args, this.npcProfileService);
          if (result !== null) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              result,
            };
          }

          // Try journal tools
          result = await handleJournalTools(name, args, this.journalService);
          if (result !== null) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              result,
            };
          }

          throw new Error(`Unknown tool: ${name}`);
        }

        case "initialize":
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: "botct-mcp-server",
                version: "1.0.0",
              },
            },
          };

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: error.message,
          data: error.stack,
        },
      };
    }
  }

  start() {
    process.stdin.setEncoding("utf8");
    process.stderr.write("BotCT MCP Server running on stdio\n");

    let buffer = "";

    process.stdin.on("data", async (chunk) => {
      buffer += chunk;

      // Process complete JSON-RPC messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const request = JSON.parse(line) as MCPRequest;
            const response = await this.handleRequest(request);
            process.stdout.write(JSON.stringify(response) + "\n");
          } catch (error) {
            const errorResponse: MCPResponse = {
              jsonrpc: "2.0",
              error: {
                code: -32700,
                message: "Parse error",
                data: error instanceof Error ? error.message : String(error),
              },
            };
            process.stdout.write(JSON.stringify(errorResponse) + "\n");
          }
        }
      }
    });

    process.stdin.on("end", () => {
      process.exit(0);
    });
  }
}

const server = new SimpleMCPServer();
server.start();
