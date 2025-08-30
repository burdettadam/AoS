import { z } from 'zod';
import { Alignment, RoleType } from './types';

// Raw scraped town/edition metadata from the wiki
export const ScrapedTownSchema = z.object({
  id: z.string().min(1), // slug, e.g., 'trouble-brewing'
  name: z.string().min(1), // display name
  wikiUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
  region: z.string().optional(),
  population: z.number().int().nonnegative().optional(),
  notableLocations: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional(),
  governance: z.string().optional(),
  coordinates: z.object({
    x: z.number().optional(),
    y: z.number().optional()
  }).optional(),
  connections: z.array(z.string()).optional(),
  // Optional distribution details per player count (5..15). If absent, engine fallback rules apply.
  distributionByPlayerCount: z
    .record(
      z.string(), // player count as string key e.g., '5'
      z.object({
        [RoleType.TOWNSFOLK]: z.number().int().nonnegative(),
        [RoleType.OUTSIDER]: z.number().int().nonnegative(),
        [RoleType.MINION]: z.number().int().nonnegative(),
        [RoleType.DEMON]: z.number().int().nonnegative()
      })
    )
    .optional()
});
export type ScrapedTown = z.infer<typeof ScrapedTownSchema>;

// Raw scraped character from the wiki
export const ScrapedCharacterSchema = z.object({
  id: z.string().min(1), // machine-friendly slug, e.g., 'empath'
  name: z.string().min(1), // character name
  category: z.enum(['Townsfolk', 'Outsider', 'Minion', 'Demon', 'Traveller', 'Fabled']),
  edition: z.array(z.string()).min(1), // list of editions the character appears in
  abilitySummary: z.string().min(1), // concise ability description
  firstNightAction: z.string().nullable().optional(), // instructions for the first night (or null)
  otherNightsAction: z.string().nullable().optional(), // instructions for every other night (or null)
  dayAction: z.string().nullable().optional(), // actions triggered during the day (if any)
  tags: z.array(z.string()).optional(), // ["information", "misinformation", "killing", etc.]
  tokensUsed: z.array(z.string()).optional(), // names of reminder tokens used by the Storyteller
  wikiUrl: z.string().url().optional(), // source page
  imageUrl: z.string().url().optional() // link to character art if available
});
export type ScrapedCharacter = z.infer<typeof ScrapedCharacterSchema>;

// Bulk payloads
export const ScrapedCharactersFileSchema = z.object({
  characters: z.array(ScrapedCharacterSchema)
});
export type ScrapedCharactersFile = z.infer<typeof ScrapedCharactersFileSchema>;

export const ScrapedTownsFileSchema = z.object({
  towns: z.array(ScrapedTownSchema)
});
export type ScrapedTownsFile = z.infer<typeof ScrapedTownsFileSchema>;

// Helpers
export function toAlignment(category: ScrapedCharacter['category']): Alignment {
  switch (category) {
    case 'Townsfolk':
    case 'Outsider':
      return Alignment.GOOD;
    case 'Minion':
    case 'Demon':
      return Alignment.EVIL;
    default:
      return Alignment.GOOD; // Travellers and Fabled default to good
  }
}

export function toRoleType(category: ScrapedCharacter['category']): RoleType | null {
  switch (category) {
    case 'Townsfolk':
      return RoleType.TOWNSFOLK;
    case 'Outsider':
      return RoleType.OUTSIDER;
    case 'Minion':
      return RoleType.MINION;
    case 'Demon':
      return RoleType.DEMON;
    default:
      return null; // travellers and fabled are not modeled (yet)
  }
}

// Utility functions for data transformation
export class WikiDataTransformer {
  static generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  static parseNumber(value: string | number | undefined): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  static cleanArray(arr: string[] | undefined): string[] {
    return arr?.filter(item => item && item.trim()) || [];
  }

  static validateTownData(rawData: any): ScrapedTown {
    // Transform raw scraped data to match schema
    const transformed = {
      id: rawData.id || this.generateId(rawData.name),
      name: rawData.name,
      description: rawData.description || '',
      region: rawData.region || '',
      population: this.parseNumber(rawData.population),
      notableLocations: this.cleanArray(rawData.notable_locations || rawData.notableLocations),
      resources: this.cleanArray(rawData.resources),
      governance: rawData.governance || '',
      coordinates: {
        x: rawData.coordinates?.x || 0,
        y: rawData.coordinates?.y || 0
      },
      connections: this.cleanArray(rawData.connections),
      wikiUrl: rawData.wiki_url || rawData.wikiUrl,
      imageUrl: rawData.image_url || rawData.imageUrl,
      distributionByPlayerCount: rawData.distributionByPlayerCount
    };
    
    return ScrapedTownSchema.parse(transformed);
  }

  static validateCharacterData(rawData: any): ScrapedCharacter {
    // Transform raw scraped data to match schema
    const transformed = {
      id: rawData.id || this.generateId(rawData.name),
      name: rawData.name,
      category: rawData.category || this.mapLegacyTypeToCategory(rawData.type),
      edition: Array.isArray(rawData.edition) ? rawData.edition : 
               rawData.edition ? [rawData.edition] : 
               rawData.editionId ? [rawData.editionId] : ['Unknown'],
      abilitySummary: rawData.ability_summary || rawData.abilitySummary || rawData.abilityText || '',
      firstNightAction: rawData.first_night_action || rawData.firstNightAction || null,
      otherNightsAction: rawData.other_nights_action || rawData.otherNightsAction || null,
      dayAction: rawData.day_action || rawData.dayAction || null,
      tags: this.cleanArray(rawData.tags),
      tokensUsed: this.cleanArray(rawData.tokens_used || rawData.tokensUsed || rawData.reminders),
      wikiUrl: rawData.wiki_url || rawData.wikiUrl,
      imageUrl: rawData.image_url || rawData.imageUrl || rawData.iconUrl
    };
    
    return ScrapedCharacterSchema.parse(transformed);
  }

  private static mapLegacyTypeToCategory(type: string): string {
    if (!type) return 'Townsfolk';
    
    const typeMap: Record<string, string> = {
      'townsfolk': 'Townsfolk',
      'outsider': 'Outsider', 
      'minion': 'Minion',
      'demon': 'Demon',
      'traveller': 'Traveller',
      'fabled': 'Fabled'
    };
    
    return typeMap[type.toLowerCase()] || 'Townsfolk';
  }
}
