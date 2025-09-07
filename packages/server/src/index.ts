import 'dotenv/config';
import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { GameId, GameState, SeatId } from '@botc/shared';
import { maskGameStateForSeat, maskGameStatePublic } from '@botc/shared';
import { GameEngine } from './game/engine';
import { WebSocketHandler } from './websocket/handler';
import { MatchmakingService } from './services/matchmaking';
import { scriptCache } from './services/scriptCache';
import { logger } from './utils/logger';
import setupRoutes from './routes/setupRoutes';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

async function start() {
  try {
    // Initialize script cache first for fast script loading
    await scriptCache.initialize();
    const { scriptCount, totalCharacters } = scriptCache.getStats();
    logger.info(`🎭 Script cache ready: ${scriptCount} scripts, ${totalCharacters} characters`);

    // Register plugins
    const isProd = process.env.NODE_ENV === 'production';
    await fastify.register(cors, {
      // In dev, allow all origins so Vite (5173) works; in prod, use CORS_ORIGIN or disable
      origin: isProd
        ? (process.env.CORS_ORIGIN || false)
  : ((origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true))
    } as any);
    
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

    // Static-like route to serve character artwork from repo data (png files)
    fastify.get('/artwork/characters/:image', async (request, reply) => {
      const { image } = request.params as { image: string };
      // Basic validation: only .png under known folder, prevent path traversal
      if (!image || !/^[a-z0-9\-]+\.png$/i.test(image)) {
        reply.code(400);
        return { error: 'Invalid image name' };
      }
      // Resolve from monorepo root: packages/server/src -> ../../.. -> repo root
      const repoRoot = path.resolve(__dirname, '../../..');
      const filePath = path.join(repoRoot, 'data', 'artwork', 'characters', image);
      try {
        await fs.promises.access(filePath, fs.constants.R_OK);
        reply.type('image/png');
        return fs.createReadStream(filePath);
      } catch {
        reply.code(404);
        return { error: 'Not found' };
      }
    });

    fastify.get('/api/scripts/:scriptId', async (request) => {
      const { scriptId } = request.params as { scriptId: string };
      const script = await gameEngine.getScript(scriptId);
      if (!script) return { error: 'Not found' };
      return {
        id: script.id,
        name: script.name,
        version: script.version,
    playerCount: script.setup?.playerCount,
        roles: script.roles.map((r: any) => ({ id: r.id, name: r.name, type: r.type, alignment: r.alignment }))
      };
    });

    // Fast cached script routes for lobby
    fastify.get('/api/scripts/cached/list', async (request, reply) => {
      try {
        const scripts = scriptCache.getScriptsList();
        return { scripts };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to load scripts' };
      }
    });

    fastify.get('/api/scripts/cached/:scriptId', async (request, reply) => {
      try {
        const { scriptId } = request.params as { scriptId: string };
        const script = scriptCache.getScript(scriptId);
        if (!script) {
          reply.code(404);
          return { error: 'Script not found' };
        }
        return script;
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to load script' };
      }
    });

    fastify.get('/api/scripts/cached/:scriptId/characters', async (request, reply) => {
      try {
        const { scriptId } = request.params as { scriptId: string };
        const script = scriptCache.getScript(scriptId);
        if (!script) {
          reply.code(404);
          return { error: 'Script not found' };
        }
        return { characters: script.characters };
      } catch (error) {
        reply.code(500);
        return { error: 'Failed to load characters' };
      }
    });    fastify.post('/api/games', async (request, reply) => {
      try {
        const { gameName } = ((request.body as any) || {});
        const gameId = await matchmaking.createGame();
        if (typeof gameName === 'string' && gameName.trim()) {
          const game = gameEngine.getGame(gameId);
          if (game) {
            (game as any).gameName = gameName.trim().slice(0, 60);
          }
        }
        return { gameId };
      } catch (error) {
  logger.error('POST /api/games failed:', error);
  reply.code(500);
  return { error: 'Failed to create game', details: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error) };
      }
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
      if (!viewerSeatId) return maskGameStatePublic(game);
      try {
        // Storyteller gets full state
        if (game.storytellerSeatId && viewerSeatId === game.storytellerSeatId) return game;
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

    // Assign/change storyteller (only current storyteller can set)
    fastify.post('/api/games/:gameId/storyteller', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { setterSeatId, targetSeatId } = (request.body as any) || {};
      if (!setterSeatId || !targetSeatId) { reply.code(400); return { error: 'setterSeatId and targetSeatId required' }; }
      const res = gameEngine.setStoryteller(gameId as any, setterSeatId as any, targetSeatId as any);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'storyteller_changed', payload: { storytellerSeatId: game.storytellerSeatId } });
      return { ok: true, storytellerSeatId: game.storytellerSeatId };
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

    // Manual phase controls (Storyteller only)
    fastify.post('/api/games/:gameId/phase/advance', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId } = (request.body as any) || {};
      const res = await gameEngine.advancePhase(gameId as any, storytellerSeatId);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'phase_changed', payload: { phase: game.phase } });
      }
      return { ok: true, phase: game.phase, day: game.day };
    });

    fastify.post('/api/games/:gameId/phase/set', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId, phase } = (request.body as any) || {};
      const res = await gameEngine.setPhase(gameId as any, storytellerSeatId, phase);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'phase_changed', payload: { phase: game.phase } });
      }
      return { ok: true, phase: game.phase, day: game.day };
    });

    fastify.post('/api/games/:gameId/end', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId } = (request.body as any) || {};
      const res = await gameEngine.endGame(gameId as any, storytellerSeatId);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'phase_changed', payload: { phase: game.phase } });
      }
      return { ok: true, phase: game?.phase };
    });

    // Set the game's display name (storyteller only, lobby only)
    fastify.post('/api/games/:gameId/name', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId, name } = (request.body as any) || {};
      const res = gameEngine.setGameName(gameId as any, storytellerSeatId as any, name as string);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'game_created', payload: { renamed: true } });
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

    // Leave a game (lobby only)
    fastify.post('/api/games/:gameId/leave', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { seatId } = (request.body as any) || {};
      if (!seatId) { reply.code(400); return { error: 'seatId required' }; }
      const res = gameEngine.removePlayer(gameId as any, seatId as any);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'player_left', payload: { seatId } });
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

    // Set available scripts for players (storyteller only)
    fastify.post('/api/games/:gameId/scripts/available', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId, scriptIds } = (request.body as any) || {};
      if (!Array.isArray(scriptIds) || !storytellerSeatId) { reply.code(400); return { error: 'Invalid body' }; }
      const ok = gameEngine.setAvailableScripts(gameId as any, storytellerSeatId as any, scriptIds);
      if (!ok) { reply.code(400); return { error: 'Failed to set available scripts' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'available_scripts_updated', payload: { scriptIds } });
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

    // Setup routes
    fastify.register(setupRoutes, { prefix: '/api/games', gameEngine });

    // ASR routes
    fastify.register(async function (fastify) {
      fastify.post('/asr/stream', async (request, reply) => {
        const { ASRController } = await import('./controllers/asrController');
        return ASRController.streamAudio(request as any, reply);
      });

      fastify.post('/asr/summarize', async (request, reply) => {
        const { ASRController } = await import('./controllers/asrController');
        return ASRController.summarizePhase(request as any, reply);
      });
    });

    // Day mechanics: nomination & voting
    fastify.post('/api/games/:gameId/nominate', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { nominator, nominee } = (request.body as any) || {};
      const res = gameEngine.nominate(gameId as any, nominator as any, nominee as any);
      if (!('ok' in res) || !res.ok) { reply.code(400); return { error: (res as any).error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'nomination_made', payload: { nominee } });
      return { ok: true, nominationId: res.nominationId };
    });

    fastify.post('/api/games/:gameId/vote/start', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId } = (request.body as any) || {};
      const res = gameEngine.startVote(gameId as any, storytellerSeatId as any);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'vote_cast', payload: { started: true } });
      return { ok: true };
    });

    fastify.post('/api/games/:gameId/vote/cast', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { voter, vote } = (request.body as any) || {};
      const res = gameEngine.castVote(gameId as any, voter as any, !!vote);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'vote_cast', payload: { voter, vote: !!vote } });
      return { ok: true };
    });

    fastify.post('/api/games/:gameId/vote/finish', async (request, reply) => {
      const { gameId } = request.params as { gameId: string };
      const { storytellerSeatId } = (request.body as any) || {};
      const res = gameEngine.finishVote(gameId as any, storytellerSeatId as any);
      if (!res.ok) { reply.code(400); return { error: res.error }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'execution_occurred', payload: { executed: res.executed } });
      return { ok: true, executed: res.executed, nominee: res.nominee };
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
      const { voterSeatId, proposalId, vote, difficulty } = (request.body as any) || {};
      if (!voterSeatId || !proposalId) { reply.code(400); return { error: 'voterSeatId and proposalId required' }; }
      let ok = true;
      if (typeof vote === 'boolean') {
        ok = matchmaking.voteOnScript(gameId as any, voterSeatId, proposalId, vote);
      }
      if (ok && difficulty) {
        ok = gameEngine.voteScriptDifficulty(gameId as any, voterSeatId as any, proposalId, difficulty);
      }
      if (!ok) { reply.code(400); return { error: 'Failed to vote' }; }
      const game = gameEngine.getGame(gameId as any)!;
      if (game && matchmaking['onUpdate']) {
        matchmaking['onUpdate']!({ gameId: game.id, game, eventType: 'script_vote', payload: { proposalId } });
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
