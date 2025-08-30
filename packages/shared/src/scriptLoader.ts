import { Character, LoadedScript, ScriptMetadata, CharacterSchema, ScriptMetadataSchema } from './types';

export interface ScriptDataSource {
  loadCharacters(scriptPath: string): Promise<any>;
  loadMetadata(scriptPath: string): Promise<any>;
}

export class ScriptLoader {
  private static scriptsCache = new Map<string, LoadedScript>();
  
  constructor(private dataSource: ScriptDataSource) {}

  async loadScript(scriptName: string): Promise<LoadedScript> {
    if (ScriptLoader.scriptsCache.has(scriptName)) {
      return ScriptLoader.scriptsCache.get(scriptName)!;
    }

    try {
      const [charactersData, metaData] = await Promise.all([
        this.dataSource.loadCharacters(scriptName),
        this.dataSource.loadMetadata(scriptName).catch(() => null)
      ]);

      const characters = this.parseCharacters(charactersData);
      const meta = metaData ? this.parseMetadata(metaData) : undefined;

      const script: LoadedScript = {
        id: scriptName,
        name: this.formatScriptName(scriptName),
        characters,
        meta
      };

      ScriptLoader.scriptsCache.set(scriptName, script);
      return script;
    } catch (error) {
      throw new Error(`Failed to load script: ${scriptName} - ${error}`);
    }
  }

  async getAllScripts(): Promise<LoadedScript[]> {
    const scriptNames = [
      'trouble-brewing',
      'bad-moon-rising', 
      'sects-and-violets',
      'experimental',
      'fabled',
      'travellers',
      'catfishing',
      'chaos-theory',
      'greatest-hits',
      'mad-as-a-hatter',
      'no-greater-joy',
      'on-thin-ice'
    ];

    return Promise.all(scriptNames.map(name => this.loadScript(name)));
  }

  private parseCharacters(data: any): Character[] {
    // Handle different JSON formats
    let characterArray: any[];
    
    if (Array.isArray(data)) {
      // Check if it's an array of strings or objects
      if (data.length > 0 && typeof data[0] === 'string') {
        // Format: ["character-id", "character-id", ...]
        characterArray = data.map(id => ({ id, name: this.formatCharacterName(id) }));
      } else {
        // Format: [{...}, {...}] - array of character objects
        characterArray = data;
      }
    } else if (data.characters && Array.isArray(data.characters)) {
      // Format: { "characters": [{...}, {...}] }
      characterArray = data.characters;
    } else {
      throw new Error('Invalid character data format');
    }

    return characterArray.map(char => this.validateAndTransformCharacter(char));
  }

  private parseMetadata(data: any): ScriptMetadata {
    return ScriptMetadataSchema.parse({
      id: data.id,
      name: data.name,
      author: data.author,
      description: data.description,
      version: data.version,
      tags: data.tags,
      playerCount: data.player_count ? {
        min: data.player_count.min,
        max: data.player_count.max,
        optimal: data.player_count.optimal
      } : undefined,
      complexity: data.complexity,
      estimatedTime: data.estimated_time,
      characterList: data.character_list,
      characterDistribution: data.character_distribution,
      scriptNotes: data.script_notes,
      // Legacy fields
      region: data.region,
      population: data.population,
      notableLocations: data.notable_locations,
      resources: data.resources,
      governance: data.governance,
      coordinates: data.coordinates,
      connections: data.connections,
      wikiUrl: data.wiki_url,
      imageUrl: data.image_url
    });
  }

  private validateAndTransformCharacter(data: any): Character {
    // Transform legacy format to new format
    const transformed = {
      id: data.id,
      name: data.name || this.formatCharacterName(data.id),
      team: this.mapCategoryToTeam(data.category),
      ability: data.abilitySummary || data.ability_summary || data.ability || '',
      firstNight: data.firstNight || undefined,
      otherNights: data.otherNights || undefined,
      reminders: data.tokensUsed || data.tokens_used || [],
      setup: data.tags?.includes('setup') || false,
      special: data.special || undefined,
      // Legacy fields
      category: data.category,
      edition: data.edition || data.editions,
      abilitySummary: data.abilitySummary || data.ability_summary,
      firstNightAction: data.firstNightAction || data.first_night_action,
      otherNightsAction: data.otherNightsAction || data.other_nights_action,
      dayAction: data.dayAction || data.day_action,
      tags: data.tags || [],
      tokensUsed: data.tokensUsed || data.tokens_used || [],
      wikiUrl: data.wikiUrl || data.wiki_url || undefined,
      imageUrl: data.imageUrl || data.image_url || undefined
    };

    return CharacterSchema.parse(transformed);
  }

  private mapCategoryToTeam(category?: string): 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' {
    if (!category) return 'townsfolk';
    
    switch (category.toLowerCase()) {
      case 'townsfolk': return 'townsfolk';
      case 'outsider': return 'outsider';
      case 'minion': return 'minion';
      case 'demon': return 'demon';
      case 'traveller': return 'traveller';
      case 'fabled': return 'fabled';
      default: return 'townsfolk';
    }
  }

  private parseNightOrder(action?: string | null): number | undefined {
    if (!action || action === null) return undefined;
    // This could be enhanced to parse actual night order from action text
    return undefined;
  }

  private formatScriptName(scriptName: string): string {
    return scriptName
      .split('/')
      .pop()!
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatCharacterName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  clearCache(): void {
    ScriptLoader.scriptsCache.clear();
  }
}

// Validation utilities
export function validateCharacter(data: any): data is Character {
  try {
    CharacterSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function validateScript(data: any): data is LoadedScript {
  return (
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.characters) &&
    data.characters.every(validateCharacter)
  );
}
