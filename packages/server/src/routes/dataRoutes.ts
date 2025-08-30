import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { dataManager } from '../data/dataManager';
import { NodeScriptDataSource } from '../data/nodeScriptDataSource';
import { logger } from '../utils/logger';

interface TownParams {
  id: string;
}

interface CharacterParams {
  id: string;
}

interface SearchQuery {
  q?: string;
  category?: string;
  edition?: string;
  tags?: string;
}

export default async function dataRoutes(fastify: FastifyInstance) {
  // Initialize data manager
  await dataManager.initialize();

  // Towns endpoints
  fastify.get('/api/towns', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const towns = await dataManager.getAllTowns();
      return reply.send({ towns });
    } catch (error) {
      logger.error('Error fetching towns');
      return reply.status(500).send({ error: 'Failed to fetch towns' });
    }
  });

  fastify.get('/api/towns/:id', async (request: FastifyRequest<{ Params: TownParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const town = await dataManager.getTownById(id);
      
      if (!town) {
        return reply.status(404).send({ error: 'Town not found' });
      }

      const characters = await dataManager.getCharactersByTown(id);
      return reply.send({ town, characters });
    } catch (error) {
      logger.error('Error fetching town');
      return reply.status(500).send({ error: 'Failed to fetch town' });
    }
  });

  // Characters endpoints
  fastify.get('/api/characters', async (request: FastifyRequest<{ Querystring: SearchQuery }>, reply: FastifyReply) => {
    try {
      const { q, category, edition, tags } = request.query;
      let characters = await dataManager.getAllCharacters();

      // Apply filters
      if (q) {
        characters = await dataManager.searchCharacters(q);
      }

      if (category) {
        characters = characters.filter(c => c.category === category);
      }

      if (edition) {
        characters = characters.filter(c => c.edition.includes(edition));
      }

      if (tags) {
        const searchTags = tags.split(',').map(t => t.trim().toLowerCase());
        characters = characters.filter(c => 
          c.tags.some(tag => searchTags.includes(tag.toLowerCase()))
        );
      }

      return reply.send({ characters });
    } catch (error) {
      logger.error('Error fetching characters');
      return reply.status(500).send({ error: 'Failed to fetch characters' });
    }
  });

  fastify.get('/api/characters/:id', async (request: FastifyRequest<{ Params: CharacterParams }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const character = await dataManager.getCharacterById(id);
      
      if (!character) {
        return reply.status(404).send({ error: 'Character not found' });
      }

      return reply.send({ character });
    } catch (error) {
      logger.error('Error fetching character');
      return reply.status(500).send({ error: 'Failed to fetch character' });
    }
  });

  // Search endpoints
  fastify.get('/api/search/towns', async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
    try {
      const { q } = request.query;
      if (!q) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }

      const towns = await dataManager.searchTowns(q);
      return reply.send({ towns });
    } catch (error) {
      logger.error('Error searching towns');
      return reply.status(500).send({ error: 'Failed to search towns' });
    }
  });

  fastify.get('/api/search/characters', async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
    try {
      const { q } = request.query;
      if (!q) {
        return reply.status(400).send({ error: 'Query parameter "q" is required' });
      }

      const characters = await dataManager.searchCharacters(q);
      return reply.send({ characters });
    } catch (error) {
      logger.error('Error searching characters');
      return reply.status(500).send({ error: 'Failed to search characters' });
    }
  });

  // Statistics endpoint
  fastify.get('/api/statistics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const statistics = await dataManager.getStatistics();
      return reply.send({ statistics });
    } catch (error) {
      logger.error('Error fetching statistics');
      return reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  // Import endpoints (for admin use)
  fastify.post('/api/import/towns', async (request: FastifyRequest<{ Body: { filePath: string } }>, reply: FastifyReply) => {
    try {
      const { filePath } = request.body;
      if (!filePath) {
        return reply.status(400).send({ error: 'File path is required' });
      }

      await dataManager.importTownsFromFile(filePath);
      return reply.send({ success: true, message: 'Towns imported successfully' });
    } catch (error) {
      logger.error('Error importing towns');
      return reply.status(500).send({ error: 'Failed to import towns' });
    }
  });

  fastify.post('/api/import/characters', async (request: FastifyRequest<{ Body: { filePath: string } }>, reply: FastifyReply) => {
    try {
      const { filePath } = request.body;
      if (!filePath) {
        return reply.status(400).send({ error: 'File path is required' });
      }

      await dataManager.importCharactersFromFile(filePath);
      return reply.send({ success: true, message: 'Characters imported successfully' });
    } catch (error) {
      logger.error('Error importing characters');
      return reply.status(500).send({ error: 'Failed to import characters' });
    }
  });

  // Export endpoint
  fastify.post('/api/export', async (request: FastifyRequest<{ Body: { outputDir: string } }>, reply: FastifyReply) => {
    try {
      const { outputDir } = request.body;
      if (!outputDir) {
        return reply.status(400).send({ error: 'Output directory is required' });
      }

      await dataManager.exportData(outputDir);
      return reply.send({ success: true, message: 'Data exported successfully' });
    } catch (error) {
      logger.error('Error exporting data');
      return reply.status(500).send({ error: 'Failed to export data' });
    }
  });

  // Script data endpoints
  const scriptDataSource = new NodeScriptDataSource();

  fastify.get('/api/data/scripts/:scriptPath*/characters', async (request: FastifyRequest<{ Params: { scriptPath: string } }>, reply: FastifyReply) => {
    try {
      const { scriptPath } = request.params;
      const characters = await scriptDataSource.loadCharacters(scriptPath);
      return reply.send(characters);
    } catch (error) {
      logger.error(`Error loading characters for script ${request.params.scriptPath}:`, error);
      return reply.status(404).send({ error: 'Script characters not found' });
    }
  });

  fastify.get('/api/data/scripts/:scriptPath*/metadata', async (request: FastifyRequest<{ Params: { scriptPath: string } }>, reply: FastifyReply) => {
    try {
      const { scriptPath } = request.params;
      const metadata = await scriptDataSource.loadMetadata(scriptPath);
      return reply.send(metadata);
    } catch (error) {
      logger.error(`Error loading metadata for script ${request.params.scriptPath}:`, error);
      return reply.status(404).send({ error: 'Script metadata not found' });
    }
  });

  fastify.get('/api/data/scripts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const scripts = await scriptDataSource.listAvailableScripts();
      return reply.send({ scripts });
    } catch (error) {
      logger.error('Error listing available scripts:', error);
      return reply.status(500).send({ error: 'Failed to list scripts' });
    }
  });
}
