import 'dotenv/config';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import { GameId, GameState, SeatId } from '@botc/shared';
import { maskGameStateForSeat, maskGameStatePublic } from '@botc/shared';
import { GameEngine } from './game/engine';
import { WebSocketHandler } from './websocket/handler';
import { MatchmakingService } from './services/matchmaking';
import { logger } from './utils/logger';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

async function start() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    });
    
    await fastify.register(websocket);

    // Initialize services
    const gameEngine = new GameEngine();
    const matchmaking = new MatchmakingService(gameEngine);
    const wsHandler = new WebSocketHandler(gameEngine, matchmaking);

    // Broadcast updates to subscribed clients when matchmaking changes occur
    matchmaking.setOnUpdate((
      args: { gameId: GameId; game: GameState; eventType: string; payload?: Record<string, any> }
    ) => {
      const { gameId, game, eventType, payload } = args;
      wsHandler.broadcastToGame(gameId, {
        type: 'event',
        event: {
          id: randomUUID(),
          gameId,
          type: eventType as any,
          timestamp: new Date(),
          payload: { gameState: game, ...payload }
        }
      });
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Game API routes
    fastify.get('/api/games', async () => {
      return matchmaking.getActiveGames();
    });

    // List available scripts
    fastify.get('/api/scripts', async () => {
      return gameEngine.listScripts();
    });

    fastify.get('/api/scripts/:scriptId', async (request) => {
      const { scriptId } = request.params as { scriptId: string };
      const script = await gameEngine.getScript(scriptId);
      if (!script) return { error: 'Not found' };
      return {
        id: script.id,
        name: script.name,
        version: script.version,
        roles: script.roles.map((r: any) => ({ id: r.id, name: r.name, type: r.type, alignment: r.alignment }))
      };
    });

    fastify.post('/api/games', async (request, reply) => {
      const gameId = await matchmaking.createGame();
      return { gameId };
    });

    // Get a game's current state; optional viewerSeatId to return masked view
    fastify.get('/api/games/:gameId', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { viewerSeatId } = request.query as { viewerSeatId?: string };
      const game = gameEngine.getGame(gameId as any);
      if (!game) {
        reply.code(404);
        return { error: 'Game not found' };
      }
      if (!viewerSeatId) return game;
      try {
        return maskGameStateForSeat(game, viewerSeatId as SeatId);
      } catch {
        return maskGameStatePublic(game);
      }
    });

    // Join a game (simple: playerId from query for now)
    fastify.post('/api/games/:gameId/join', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { playerId } = (request.body as any) || {};
      if (!playerId) {
        reply.code(400);
        return { error: 'playerId required' };
      }
      const seatId = await matchmaking.joinGame(gameId as any, playerId);
      if (!seatId) {
        reply.code(400);
        return { error: 'Failed to join game' };
      }
      const game = gameEngine.getGame(gameId as any)!;
      const isStoryteller = game.storytellerSeatId === seatId;
      return { ok: true, seatId, isStoryteller };
    });

    // Start a game
    fastify.post('/api/games/:gameId/start', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const ok = await matchmaking.startGame(gameId as any);
      if (!ok) {
        reply.code(400);
        return { error: 'Failed to start game' };
      }
      return { ok: true };
    });

    // Add an NPC player
    fastify.post('/api/games/:gameId/npc', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const ok = await matchmaking.addNPC(gameId as any);
      if (!ok) {
        reply.code(400);
        return { error: 'Failed to add NPC' };
      }
      return { ok: true };
    });

    // Role selection and claiming
    fastify.post('/api/games/:gameId/roles/select', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId, roleIds } = (request.body as any) || {};
      if (!Array.isArray(roleIds) || !storytellerSeatId) { reply.code(400); return { error: 'Invalid body' }; }
      const ok = gameEngine.selectRoles(gameId as any, storytellerSeatId as any, roleIds);
      if (!ok) { reply.code(400); return { error: 'Failed to select roles' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'roles_selected', payload: { roleCount: roleIds.length } });
      }
      return { ok: true };
    });

    fastify.post('/api/games/:gameId/roles/claim', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { seatId, roleId } = (request.body as any) || {};
      if (!seatId || !roleId) { reply.code(400); return { error: 'Invalid body' }; }
      const ok = gameEngine.claimRole(gameId as any, seatId as any, roleId);
      if (!ok) { reply.code(400); return { error: 'Failed to claim role' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'chat_message', payload: { text: 'role claimed' } });
      }
      return { ok: true };
    });

    fastify.post('/api/games/:gameId/roles/claim-random', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { seatId } = (request.body as any) || {};
      if (!seatId) { reply.code(400); return { error: 'Invalid body' }; }
      const roleId = await gameEngine.claimRandomRole(gameId as any, seatId as any);
      if (!roleId) { reply.code(400); return { error: 'Failed to claim random role' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'chat_message', payload: { text: 'random role claimed' } });
      }
      return { ok: true, roleId };
    });

    // WebSocket connection
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, wsHandler.handleConnection.bind(wsHandler));
    });

    // Script proposal endpoints (simple)
    fastify.post('/api/games/:gameId/scripts/propose', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { proposerSeatId, scriptId } = (request.body as any) || {};
      if (!proposerSeatId || !scriptId) {
        reply.code(400); return { error: 'proposerSeatId and scriptId required' };
      }
      const ok = matchmaking.proposeScript(gameId as any, proposerSeatId, scriptId);
      if (!ok) { reply.code(400); return { error: 'Failed to propose script' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'script_proposed', payload: { scriptId } });
      }
      return { ok: true };
    });

    fastify.post('/api/games/:gameId/scripts/vote', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { voterSeatId, proposalId, vote } = (request.body as any) || {};
      if (!voterSeatId || !proposalId || typeof vote !== 'boolean') {
        reply.code(400); return { error: 'voterSeatId, proposalId and vote required' };
      }
      const ok = matchmaking.voteOnScript(gameId as any, voterSeatId, proposalId, vote);
      if (!ok) { reply.code(400); return { error: 'Failed to vote' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'script_vote', payload: { proposalId, vote } });
      }
      return { ok: true };
    });

    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    logger.info(`🚀 Server listening on http://${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
