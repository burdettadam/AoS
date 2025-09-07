import { promises as fs } from 'fs';
import path from 'path';
import {
  Script,
  RoleDefinition,
  Alignment,
  RoleType,
  ScrapedCharactersFileSchema,
  ScrapedTownsFileSchema,
  toAlignment,
  toRoleType
} from '@botc/shared';
import { logger } from '../utils/logger';

// Minimal effect mapping: we don't encode full DSL from ability text yet.
// We derive timing and precedence where available; fallback to passive/no-op effect.

function buildRoleDefinition(input: {
  id: string;
  name: string;
  category: 'Townsfolk' | 'Outsider' | 'Minion' | 'Demon' | 'Traveller' | 'Fabled';
  abilitySummary: string;
  firstNightAction?: string | null;
  otherNightsAction?: string | null;
  dayAction?: string | null;
}): RoleDefinition | null {
  const roleType = toRoleType(input.category);
  if (!roleType) return null; // skip unsupported types for now

  const alignment = toAlignment(input.category);

  // Infer timing from available actions
  let timing: 'night' | 'day' | 'passive' = 'passive';
  if (input.firstNightAction || input.otherNightsAction) {
    timing = 'night';
  } else if (input.dayAction) {
    timing = 'day';
  }

  // precedence: default by role type (can be refined later)
  const precedence = defaultPrecedence(roleType);

  const rd: RoleDefinition = {
    id: input.id,
    name: input.name,
    alignment: alignment,
    type: roleType,
    ability: {
      id: `${input.id}-ability`,
      when: timing,
      target: 'any',
      effect: [
        {
          type: 'rules_text',
          text: input.abilitySummary
        }
      ]
    },
    visibility: {
      reveals: {
        public: 'none',
        privateTo: []
      }
    },
    precedence
  };

  return rd;
}

function defaultPrecedence(type: typeof RoleType[keyof typeof RoleType]): number {
  switch (type) {
    case RoleType.TOWNSFOLK:
      return 100;
    case RoleType.OUTSIDER:
      return 200;
    case RoleType.MINION:
      return 300;
    case RoleType.DEMON:
      return 400;
    case RoleType.TRAVELLER:
      return 500;
    case RoleType.FABLED:
      return 600;
    default:
      return 999;
  }
}

function inferTimingFromType(type: typeof RoleType[keyof typeof RoleType]): 'night' | 'day' | 'passive' {
  // weak heuristic: many townsfolk act at night; outsiders mostly passive; minions/demons at night
  switch (type) {
    case RoleType.TOWNSFOLK:
      return 'night';
    case RoleType.OUTSIDER:
      return 'passive';
    case RoleType.MINION:
      return 'night';
    case RoleType.DEMON:
      return 'night';
    case RoleType.TRAVELLER:
      return 'day';
    case RoleType.FABLED:
      return 'passive';
    default:
      return 'passive';
  }
}

export async function importWikiData(
  charactersJsonPath: string,
  townsJsonPath: string,
  outDir: string
): Promise<void> {
  const [charsRaw, townsRaw] = await Promise.all([
    fs.readFile(charactersJsonPath, 'utf8'),
    fs.readFile(townsJsonPath, 'utf8')
  ]);

  const charsParsed = JSON.parse(charsRaw);
  const townsParsed = JSON.parse(townsRaw);

  const characters = ScrapedCharactersFileSchema.parse(charsParsed).characters;
  const towns = ScrapedTownsFileSchema.parse(townsParsed).towns;

  // group characters by edition
  const byEdition = new Map<string, ReturnType<typeof buildRoleDefinition>[]>();
  for (const ch of characters) {
    const rd = buildRoleDefinition(ch);
    if (!rd) continue; // skip unsupported types
    
    // Character can appear in multiple editions
    for (const editionId of ch.edition) {
      if (!byEdition.has(editionId)) byEdition.set(editionId, []);
      byEdition.get(editionId)!.push(rd);
    }
  }

  await fs.mkdir(outDir, { recursive: true });

  // For each town/edition, produce a Script JSON file
  for (const town of towns) {
    const roles: RoleDefinition[] = (byEdition.get(town.id) ?? []) as RoleDefinition[];

    // Basic setup range; adjust if distribution provided
    const setup = {
      playerCount: { min: 5, max: 15 },
      distribution: {
        [RoleType.TOWNSFOLK]: 0,
        [RoleType.OUTSIDER]: 0,
        [RoleType.MINION]: 0,
        [RoleType.DEMON]: 1
  } as Record<typeof RoleType[keyof typeof RoleType], number>
    };

    const script: Script = {
      id: town.id,
      name: town.name,
      version: 'from-wiki-1',
      roles,
      setup
    };

    const file = path.join(outDir, `${town.id}.script.json`);
    await fs.writeFile(file, JSON.stringify(script, null, 2), 'utf8');
  }

  logger.info(`Imported ${byEdition.size} scripts to ${outDir}`);
}

// CLI
if (require.main === module) {
  const [charactersJsonPath, townsJsonPath, outDir] = process.argv.slice(2);
  if (!charactersJsonPath || !townsJsonPath || !outDir) {
    // eslint-disable-next-line no-console
    console.error('Usage: ts-node src/game/importer.ts <characters.json> <towns.json> <outDir>');
    process.exit(1);
  }
  importWikiData(charactersJsonPath, townsJsonPath, outDir).catch((e) => {
    logger.error('Import failed', e);
    process.exit(1);
  });
}
