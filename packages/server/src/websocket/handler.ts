import { FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { WSMessage, GameId, SeatId } from '@botc/shared';
import { maskGameStateForSeat } from '@botc/shared';
import { randomUUID } from 'crypto';
import { GameEngine } from '../game/engine';
import { MatchmakingService } from '../services/matchmaking';
import { logger } from '../utils/logger';

export class WebSocketHandler {
  private connections: Map<string, SocketStream> = new Map();
  private gameSubscriptions: Map<GameId, Set<string>> = new Map();
  private connectionViewerSeat: Map<string, SeatId | undefined> = new Map();

  constructor(
    private gameEngine: GameEngine,
    private matchmaking: MatchmakingService
  ) {}

  handleConnection(connection: SocketStream, request: FastifyRequest): void {
    const connectionId = this.generateConnectionId();
    this.connections.set(connectionId, connection);

    logger.info(`WebSocket connection established: ${connectionId}`);

    connection.socket.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(connectionId, message);
      } catch (error) {
        logger.error(`Failed to parse WebSocket message from ${connectionId}:`, error);
        this.sendError(connectionId, 'Invalid message format');
      }
    });

    connection.socket.on('close', () => {
      this.handleDisconnection(connectionId);
    });

  connection.socket.on('error', (error: Error) => {
      logger.error(`WebSocket error for ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });
  }

  private handleMessage(connectionId: string, message: WSMessage): void {
    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(connectionId, message.gameId, message.viewerSeatId as SeatId | undefined);
        break;
      case 'cmd':
        this.handleCommand(connectionId, message.cmd);
        break;
      default:
        logger.warn(`Unknown message type from ${connectionId}:`, message);
    }
  }

  private handleSubscribe(connectionId: string, gameId: GameId, viewerSeatId?: SeatId): void {
    // Unsubscribe from previous game if any
    this.unsubscribeFromAll(connectionId);

    // Subscribe to new game
    if (!this.gameSubscriptions.has(gameId)) {
      this.gameSubscriptions.set(gameId, new Set());
    }
    this.gameSubscriptions.get(gameId)!.add(connectionId);
  this.connectionViewerSeat.set(connectionId, viewerSeatId);

    // Send current game state
    const game = this.gameEngine.getGame(gameId);
    if (game) {
  const snapshot = viewerSeatId ? maskGameStateForSeat(game, viewerSeatId) : game;
      this.sendToConnection(connectionId, {
        type: 'event',
        event: {
          id: randomUUID(),
          gameId,
          type: 'game_created',
          timestamp: new Date(),
          payload: { gameState: snapshot as any }
        }
      });
    } else {
      this.sendError(connectionId, `Game ${gameId} not found`);
    }

    logger.info(`Connection ${connectionId} subscribed to game ${gameId}`);
  }

  private handleCommand(connectionId: string, cmd: any): void {
    // Handle game commands
    switch (cmd.kind) {
      case 'nominate':
        // Handle nomination
        break;
      case 'vote':
        // Handle voting
        break;
      case 'chat':
        // Handle chat message
        break;
      case 'ability':
        // Handle ability usage
        break;
      default:
        logger.warn(`Unknown command from ${connectionId}:`, cmd);
    }
  }

  private handleDisconnection(connectionId: string): void {
    this.unsubscribeFromAll(connectionId);
    this.connections.delete(connectionId);
    logger.info(`WebSocket connection closed: ${connectionId}`);
  }

  private unsubscribeFromAll(connectionId: string): void {
    for (const [gameId, subscribers] of this.gameSubscriptions.entries()) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.gameSubscriptions.delete(gameId);
      }
    }
  this.connectionViewerSeat.delete(connectionId);
  }

  private sendToConnection(connectionId: string, message: WSMessage): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket.readyState === 1) { // WebSocket.OPEN
      try {
        connection.socket.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Failed to send message to ${connectionId}:`, error);
      }
    }
  }

  private sendError(connectionId: string, error: string): void {
    this.sendToConnection(connectionId, {
      type: 'event',
      event: {
        id: randomUUID(),
        gameId: '' as GameId,
        type: 'game_created',
        timestamp: new Date(),
        payload: { error }
      }
    });
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Broadcast event to all subscribers of a game
  broadcastToGame(gameId: GameId, message: WSMessage): void {
    const subscribers = this.gameSubscriptions.get(gameId);
    if (subscribers) {
      for (const connectionId of subscribers) {
        // If message contains a snapshot, mask it per viewer
        if (message.type === 'event' && (message as any).event?.payload?.gameState) {
          const game = (message as any).event.payload.gameState;
          const viewerSeatId = this.connectionViewerSeat.get(connectionId);
          const masked = viewerSeatId ? maskGameStateForSeat(game, viewerSeatId) : game;
          const cloned = JSON.parse(JSON.stringify(message));
          (cloned as any).event.payload.gameState = masked;
          this.sendToConnection(connectionId, cloned);
        } else {
          this.sendToConnection(connectionId, message);
        }
      }
    }
  }
}
