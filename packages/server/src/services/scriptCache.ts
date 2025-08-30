import { promises as fs } from 'fs';
import path from 'path';
import { LoadedScript, Character, ScriptMetadata } from '@botc/shared';
import { logger } from '../utils/logger';
import { characterDatabase } from './characterDatabase';

interface ScriptListItem {
  id: string;
  name: string;
  path: string;
}

class ScriptCache {
  private cache = new Map<string, LoadedScript>();
  private scriptsMetadata = new Map<string, ScriptListItem>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    logger.info('🎭 Initializing script cache...');
    const startTime = Date.now();
    
    // Initialize character database first
    await characterDatabase.initialize();
    
    await this.loadAllScripts();
    
    const endTime = Date.now();
    logger.info(`✅ Script cache initialized in ${endTime - startTime}ms - ${this.cache.size} scripts loaded`);
    this.initialized = true;
  }

  private async loadAllScripts(): Promise<void> {
    // Use the new centralized data architecture
    const dataPath = path.join(__dirname, '../../../../data');
    const scriptsPath = path.join(dataPath, 'scripts');
    
    try {
      // Read all files in the scripts directory
      const files = await fs.readdir(scriptsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Create script paths from all JSON files found
      const scriptPaths: ScriptListItem[] = jsonFiles.map(file => {
        const filePath = path.join('scripts', file);
        const fullPath = path.join(scriptsPath, file);
        return {
          id: file.replace('.json', ''), // Use filename without extension as id
          name: '', // Will be filled from JSON content
          path: filePath
        };
      });

      // Load all scripts in parallel for maximum speed
      const loadPromises = scriptPaths.map(async ({ id, path: scriptPath }) => {
        try {
          const fullScriptPath = path.join(dataPath, scriptPath);
          
          // Load script definition
          const scriptData = await fs.readFile(fullScriptPath, 'utf-8').then(JSON.parse);
          
          // Get characters from centralized database
          const characters = characterDatabase.getCharacters(scriptData.characters || []);
          
          if (characters.length === 0) {
            logger.warn(`⚠️  No characters found for script ${scriptData.name || id} - check character database`);
          }

          const script: LoadedScript = {
            id: scriptData.id || id,
            name: scriptData.name || id,
            characters: characters as Character[],
            meta: this.createScriptMetadataFromNewFormat(scriptData, scriptData.id || id)
          };

          this.cache.set(scriptData.id || id, script);
          this.scriptsMetadata.set(scriptData.id || id, { 
            id: scriptData.id || id, 
            name: scriptData.name || id, 
            path: scriptPath 
          });
          
          logger.info(`📜 Loaded script: ${scriptData.name || id} (${characters.length} characters)`);
          
        } catch (error) {
          logger.warn(`⚠️  Failed to load script ${id}:`, error instanceof Error ? error.message : 'Unknown error');
          
          // Create fallback script with empty character list
          const fallback: LoadedScript = {
            id,
            name: id,
            characters: [],
            meta: this.createScriptMetadata({ name: id }, id, 0)
          };
          this.cache.set(id, fallback);
          this.scriptsMetadata.set(id, { id, name: id, path: scriptPath });
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      logger.error('Failed to read scripts directory:', error);
      throw error;
    }
  }

  private formatCharacterName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private createScriptMetadata(townData: any, scriptId: string, characterCount: number): ScriptMetadata {
    const fallbackImages: Record<string, string> = {
      'trouble-brewing': 'https://wiki.bloodontheclocktower.com/File:Logo_trouble_brewing.png',
      'bad-moon-rising': 'https://wiki.bloodontheclocktower.com/File:Logo_bad_moon_rising.png',
      'sects-and-violets': 'https://wiki.bloodontheclocktower.com/File:Logo_sects_and_violets.png'
    };

    const meta: ScriptMetadata = {
      id: scriptId,
      name: townData?.name || this.scriptsMetadata.get(scriptId)?.name || scriptId,
      author: townData?.author,
      description: townData?.description,
      version: townData?.version || '1.0.0',
      tags: townData?.tags,
      playerCount: townData?.player_count || this.getDefaultPlayerCount(scriptId),
      complexity: townData?.complexity || this.getComplexity(scriptId),
      estimatedTime: townData?.estimated_time,
      characterList: townData?.character_list,
      characterDistribution: townData?.character_distribution,
      scriptNotes: townData?.script_notes,
      // Legacy fields
      region: townData?.region,
      population: townData?.population,
      notableLocations: townData?.notable_locations,
      resources: townData?.resources,
      governance: townData?.governance,
      coordinates: townData?.coordinates,
      connections: townData?.connections,
      wikiUrl: townData?.wiki_url,
      imageUrl: townData?.image_url
    };

    if (!meta.imageUrl && fallbackImages[scriptId]) {
      meta.imageUrl = fallbackImages[scriptId];
    }

    return meta;
  }

  private createScriptMetadataFromNewFormat(scriptData: any, scriptId: string): ScriptMetadata {
    const meta: ScriptMetadata = {
      id: scriptId,
      name: scriptData.name || scriptId,
      author: scriptData.author || 'Blood on the Clocktower',
      description: scriptData.description || `${scriptData.name || scriptId} script for Blood on the Clocktower.`,
      version: scriptData.version || '1.0.0',
      tags: scriptData.tags || [],
      playerCount: scriptData.playerCount || this.getDefaultPlayerCount(scriptId),
      complexity: scriptData.complexity || this.getComplexity(scriptId),
      estimatedTime: scriptData.estimatedTime || '60-90 minutes',
      characterList: scriptData.characters || [],
      characterDistribution: scriptData.characterDistribution || {},
      scriptNotes: scriptData.specialRules || [],
      imageUrl: `/script-art/${scriptId}.png` // Use local script art
    };

    return meta;
  }

  private getComplexity(scriptId: string): 'beginner' | 'intermediate' | 'advanced' {
    const complexityMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      'trouble-brewing': 'beginner',
      'bad-moon-rising': 'intermediate',
      'sects-and-violets': 'advanced',
      'experimental': 'advanced',
      'fabled': 'intermediate',
      'travellers': 'intermediate',
      'no-greater-joy': 'beginner',
      'catfishing': 'intermediate',
      'chaos-theory': 'advanced',
      'greatest-hits': 'intermediate',
      'mad-as-a-hatter': 'advanced',
      'on-thin-ice': 'intermediate'
    };
    return complexityMap[scriptId] || 'intermediate';
  }

  private getDefaultPlayerCount(scriptId: string): { min: number; max: number; optimal?: string } {
    const standardCounts: Record<string, { min: number; max: number; optimal?: string }> = {
      'trouble-brewing': { min: 5, max: 15, optimal: '7-10' },
      'bad-moon-rising': { min: 5, max: 15, optimal: '7-10' },
      'sects-and-violets': { min: 5, max: 15, optimal: '7-10' },
      'experimental': { min: 5, max: 20, optimal: '8-12' },
      'fabled': { min: 5, max: 20, optimal: '8-12' },
      'travellers': { min: 5, max: 20, optimal: '8-12' },
      'no-greater-joy': { min: 5, max: 6, optimal: '5-6' },
    };
    
    return standardCounts[scriptId] || { min: 5, max: 15, optimal: '7-10' };
  }

  getAllScripts(): LoadedScript[] {
    return Array.from(this.cache.values());
  }

  getScript(id: string): LoadedScript | null {
    return this.cache.get(id) || null;
  }

  getScriptsList(): Array<{ id: string; name: string }> {
    return Array.from(this.scriptsMetadata.values()).map(({ id, name }) => ({ id, name }));
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getStats(): { scriptCount: number; totalCharacters: number } {
    const scripts = this.getAllScripts();
    return {
      scriptCount: scripts.length,
      totalCharacters: scripts.reduce((total, script) => total + script.characters.length, 0)
    };
  }
}

// Export singleton instance
export const scriptCache = new ScriptCache();
