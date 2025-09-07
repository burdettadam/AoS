import { LoadedScript, Character, RoleType } from '@botc/shared';

type Counts = { townsfolk: number; outsiders: number; minions: number; demons: number };

const TEAM_TO_COUNTKEY: Record<string, keyof Counts> = {
  townsfolk: 'townsfolk',
  outsider: 'outsiders',
  minion: 'minions',
  demon: 'demons'
};

const COUNTKEY_TO_TEAM: Record<keyof Counts, string> = {
  townsfolk: 'townsfolk',
  outsiders: 'outsider',
  minions: 'minion',
  demons: 'demon'
};

function teamOf(id: string, characters: Character[]): string | undefined {
  return characters.find(c => c.id === id)?.team;
}

function summarizeCounts(ids: string[], characters: Character[]): Counts {
  const counts: Counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
  for (const id of ids) {
    const t = teamOf(id, characters);
    const key = t ? TEAM_TO_COUNTKEY[t] : undefined;
    if (key) counts[key]!++;
  }
  return counts;
}

function parseCompositionTarget(script: any, playerCount: number) {
  const comp = script.composition || {};
  const keys = Object.keys(comp);
  if (keys.length === 0) return null;
  if (comp[String(playerCount)]) return comp[String(playerCount)];
  for (const k of keys) {
    if (k.includes('-')) {
      const [a, b] = k.split('-').map((x: string) => parseInt(x, 10));
      if (Number.isFinite(a) && Number.isFinite(b) && playerCount >= a && playerCount <= b) return comp[k];
    }
  }
  return null;
}

function evalCountExpr(expr: number | string, players: number): number {
  if (typeof expr === 'number') return expr;
  if (typeof expr === 'string') {
    const m = expr.match(/^p\s*([-+])\s*(\d+)$/i);
    if (m) {
      const n = parseInt(m[2], 10);
      return m[1] === '-' ? players - n : players + n;
    }
    const asNum = Number(expr);
    if (Number.isFinite(asNum)) return asNum as number;
  }
  return 0;
}

function seedToTarget(selection: string[], targetCounts: Counts, pool: string[], characters: Character[]) {
  const notes: string[] = [];
  const result = new Set(selection);
  const counts = summarizeCounts([...result], characters);
  (['townsfolk','outsiders','minions','demons'] as (keyof Counts)[]).forEach(teamKey => {
    const singular = COUNTKEY_TO_TEAM[teamKey];
    while ((counts[teamKey] || 0) < (targetCounts[teamKey] || 0)) {
      const candidate = pool.find(id => teamOf(id, characters) === singular && !result.has(id));
      if (!candidate) break;
      result.add(candidate);
      counts[teamKey]!++;
      notes.push(`seed: added '${candidate}' to reach base ${teamKey}`);
    }
  });
  return { selection: [...result], notes };
}

export interface ResolveInput { script: LoadedScript; playerCount: number; selected?: string[] }
export interface ResolveOutput { selection: string[]; counts: Counts; notes: string[] }

export function resolveLineup({ script, playerCount, selected }: ResolveInput): ResolveOutput {
  const pool: string[] = (script.meta?.characterList as any) || ((script as any).characters?.map((c: Character) => c.id) as string[]) || [];
  const characters: Character[] = (script as any).characters || [];
  let selection = (selected || []).filter(id => pool.includes(id));
  const notes: string[] = [];

  const comp = parseCompositionTarget((script as any), playerCount);
  if (comp) {
    const baseTarget: Counts = {
      townsfolk: evalCountExpr(comp.townsfolk, playerCount),
      outsiders: evalCountExpr(comp.outsiders, playerCount),
      minions: evalCountExpr(comp.minions, playerCount),
      demons: evalCountExpr(comp.demons, playerCount)
    } as Counts;
    const res = seedToTarget(selection, baseTarget, pool, characters);
    selection = res.selection; notes.push(...res.notes);
  }

  // Note: server-side modifiers not yet ported; rely on validate in SetupManager for now
  const counts = summarizeCounts(selection, characters);
  return { selection, counts, notes };
}
