import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { GameEngine } from '../game/engine';
import { logger } from '../utils/logger';
import { RoleType } from '@botc/shared';

interface SetupParams {
  gameId: string;
}

interface EnterSetupBody {
  storytellerSeatId: string;
}

interface SelectCharactersBody {
  storytellerSeatId: string;
  characterIds: string[];
}

interface ValidateSetupBody {
  storytellerSeatId: string;
}

interface CompleteSetupBody {
  storytellerSeatId: string;
}

export default async function setupRoutes(fastify: FastifyInstance, options: { gameEngine: GameEngine }) {
  const { gameEngine } = options;
  
  // Enter setup phase
  fastify.post<{ Params: SetupParams; Body: EnterSetupBody }>(
    '/:gameId/setup/enter', 
    async (request: FastifyRequest<{ Params: SetupParams; Body: EnterSetupBody }>, reply: FastifyReply) => {
      try {
        const { gameId } = request.params;
        const { storytellerSeatId } = request.body;

        if (!storytellerSeatId) {
          return reply.status(400).send({ error: 'storytellerSeatId is required' });
        }

        const result = await gameEngine.enterSetup(gameId, storytellerSeatId);
        
        if (!result.ok) {
          return reply.status(400).send({ error: result.error });
        }

        return reply.send({ success: true });
      } catch (error) {
        logger.error('Error entering setup:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Select characters for setup
  fastify.post<{ Params: SetupParams; Body: SelectCharactersBody }>(
    '/:gameId/setup/characters', 
    async (request: FastifyRequest<{ Params: SetupParams; Body: SelectCharactersBody }>, reply: FastifyReply) => {
      try {
        const { gameId } = request.params;
        const { storytellerSeatId, characterIds } = request.body;

        if (!storytellerSeatId) {
          return reply.status(400).send({ error: 'storytellerSeatId is required' });
        }

        if (!Array.isArray(characterIds)) {
          return reply.status(400).send({ error: 'characterIds must be an array' });
        }

        const result = await gameEngine.selectSetupCharacters(gameId, storytellerSeatId, characterIds);
        
        if (!result.ok) {
          return reply.status(400).send({ error: result.error });
        }

        return reply.send({ success: true });
      } catch (error) {
        logger.error('Error selecting setup characters:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Validate current setup
  fastify.post<{ Params: SetupParams; Body: ValidateSetupBody }>(
    '/:gameId/setup/validate', 
    async (request: FastifyRequest<{ Params: SetupParams; Body: ValidateSetupBody }>, reply: FastifyReply) => {
      try {
        const { gameId } = request.params;
        const { storytellerSeatId } = request.body;

        if (!storytellerSeatId) {
          return reply.status(400).send({ error: 'storytellerSeatId is required' });
        }

  const result = await gameEngine.validateSetup(gameId, storytellerSeatId);
        
        if (!result.ok) {
          return reply.status(400).send({ 
            error: result.error,
            details: result.details 
          });
        }

  return reply.send({ success: true, valid: true, details: [] });
      } catch (error) {
        logger.error('Error validating setup:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Complete setup and start game
  fastify.post<{ Params: SetupParams; Body: CompleteSetupBody }>(
    '/:gameId/setup/complete', 
    async (request: FastifyRequest<{ Params: SetupParams; Body: CompleteSetupBody }>, reply: FastifyReply) => {
      try {
        const { gameId } = request.params;
        const { storytellerSeatId } = request.body;

        if (!storytellerSeatId) {
          return reply.status(400).send({ error: 'storytellerSeatId is required' });
        }

        const result = await gameEngine.completeSetup(gameId, storytellerSeatId);
        
        if (!result.ok) {
          return reply.status(400).send({ error: result.error });
        }

        return reply.send({ success: true });
      } catch (error) {
        logger.error('Error completing setup:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get setup state
  fastify.get<{ Params: SetupParams }>(
    '/:gameId/setup', 
    async (request: FastifyRequest<{ Params: SetupParams }>, reply: FastifyReply) => {
      try {
        const { gameId } = request.params;
        const game = gameEngine.getGame(gameId);

        if (!game) {
          return reply.status(404).send({ error: 'Game not found' });
        }

        // Enrich setup state for client convenience
        let script: any = null;
        try {
          script = await gameEngine.getScript(game.scriptId);
        } catch {}

  const playerCount = game.seats.filter((s: any) => !s.isStoryteller).length;

        // Compute base distribution
        const baseDistribution = (() => {
          if (playerCount >= 5 && playerCount <= 6) {
            return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
          } else if (playerCount >= 7 && playerCount <= 9) {
            return { townsfolk: playerCount - 3, outsiders: 0, minions: 2, demons: 1 };
          } else if (playerCount >= 10 && playerCount <= 12) {
            return { townsfolk: playerCount - 4, outsiders: 1, minions: 2, demons: 1 };
          } else if (playerCount >= 13 && playerCount <= 15) {
            return { townsfolk: playerCount - 5, outsiders: 2, minions: 2, demons: 1 };
          }
          return {
            townsfolk: Math.max(2, playerCount - 3),
            outsiders: Math.max(0, Math.min(2, playerCount - 6)),
            minions: Math.min(2, Math.max(1, Math.floor(playerCount / 4))),
            demons: 1
          };
        })();

        // Apply character modifications from setup (if any)
        const expectedDistribution = { ...baseDistribution } as Record<string, number>;
        const mods = game.setupState?.characterModifications || [];
        for (const mod of mods) {
          switch (mod.type) {
            case 'add_outsiders':
              expectedDistribution.outsiders += mod.count; break;
            case 'remove_townsfolk':
              expectedDistribution.townsfolk -= mod.count; break;
            case 'add_minions':
              expectedDistribution.minions += mod.count; break;
            case 'remove_outsiders':
              expectedDistribution.outsiders -= mod.count; break;
          }
        }

        // Map available characters from script
        const availableCharacters = Array.isArray(script?.roles) ? script.roles.map((r: any) => ({
          id: r.id,
          name: r.name,
          team: r.type === RoleType.TOWNSFOLK ? 'townsfolk'
            : r.type === RoleType.OUTSIDER ? 'outsiders'
            : r.type === RoleType.MINION ? 'minions'
            : r.type === RoleType.DEMON ? 'demons'
            : 'unknown',
          ability: r.ability ? r.ability.id.replace(/[-_]/g, ' ') : '',
          firstNight: undefined,
          otherNight: undefined,
          reminders: undefined
        })) : [];

        const enrichedSetup = {
          ...(game.setupState || {}),
          availableCharacters,
          expectedDistribution,
          scriptName: script?.name || game.scriptId
        };

        return reply.send({
          setupState: enrichedSetup,
          grimoireState: game.grimoireState,
          phase: game.phase
        });
      } catch (error) {
        logger.error('Error getting setup state:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}
