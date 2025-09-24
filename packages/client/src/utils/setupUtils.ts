// Utility functions for Game Setup page: role distribution, modifier application, night order extraction, script validation.

// (No direct shared enums required yet; keep file dependency-light)

export interface RoleDistribution { townsfolk: number; outsiders: number; minions: number; demons: number; }

export interface ScriptLike {
  id?: string;
  name?: string;
  characters?: any[]; // full character objects (lobby selection variant)
  roles?: any[]; // script.roles variant (server format)
  modifiers?: any[];
  composition?: Record<string, Partial<RoleDistribution>>;
  nightOrder?: any[];
  firstNight?: any;
  meta?: any;
  complexity?: string; // allow direct access fallback
}

// Base distribution (Trouble Brewing style) used when no composition entry applies
export function computeBaseDistribution(playerCount: number): RoleDistribution {
  if (playerCount >= 5 && playerCount <= 6) return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount >= 7 && playerCount <= 9) return { townsfolk: playerCount - 3, outsiders: 0, minions: 2, demons: 1 };
  if (playerCount >= 10 && playerCount <= 12) return { townsfolk: playerCount - 4, outsiders: 1, minions: 2, demons: 1 };
  if (playerCount >= 13 && playerCount <= 15) return { townsfolk: playerCount - 5, outsiders: 2, minions: 2, demons: 1 };
  return {
    townsfolk: Math.max(2, playerCount - 3),
    outsiders: Math.max(0, Math.min(2, playerCount - 6)),
    minions: Math.min(2, Math.max(1, Math.floor(playerCount / 4))),
    demons: 1,
  };
}

// Apply modifiers of type adjustCounts to a distribution copy
export function applyAdjustCountModifiers(dist: RoleDistribution, modifiers: any[] | undefined, selectedCharacterIds: string[] = []): RoleDistribution {
  if (!modifiers) return dist;
  const out: RoleDistribution = { ...dist };
  for (const m of modifiers) {
    if (m.type === 'adjustCounts') {
      // Activate only if whenCharacter is selected (if provided)
      if (m.whenCharacter && !selectedCharacterIds.includes(m.whenCharacter)) continue;
      if (m.delta) {
        for (const key of ['townsfolk','outsiders','minions','demons'] as (keyof RoleDistribution)[]) {
          if (typeof m.delta[key] === 'number') {
            out[key] = Math.max(0, out[key] + m.delta[key]);
          }
        }
      }
    }
  }
  return out;
}

// Resolve expected distribution: composition overrides > base, then modifiers
export function computeExpectedDistribution(playerCount: number, script: ScriptLike | undefined, selectedCharacterIds: string[] = []): RoleDistribution {
  if (!script) return computeBaseDistribution(playerCount);
  // Check composition table keys (exact or range like '7-9')
  let base = computeBaseDistribution(playerCount);
  if (script.composition) {
    for (const [key, comp] of Object.entries(script.composition)) {
      const m = key.match(/^(\d+)(?:-(\d+))?$/);
      if (m) {
        const a = parseInt(m[1], 10);
        const b = m[2] ? parseInt(m[2], 10) : a;
        if (playerCount >= a && playerCount <= b) {
          base = {
            townsfolk: evaluateExpression(comp.townsfolk, playerCount, base.townsfolk),
            outsiders: evaluateExpression(comp.outsiders, playerCount, base.outsiders),
            minions: evaluateExpression(comp.minions, playerCount, base.minions),
            demons: evaluateExpression(comp.demons, playerCount, base.demons),
          };
          break;
        }
      }
    }
  }
  return applyAdjustCountModifiers(base, script.modifiers, selectedCharacterIds);
}

function evaluateExpression(value: any, playerCount: number, fallback: number): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Support expressions like 'p-3'
    const expr = value.replace(/p/g, String(playerCount));
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`return (${expr})`)();
      const num = Number(result);
      if (!isNaN(num)) return num;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export interface ValidationIssue { type: string; message: string; related?: string[]; }

export interface ValidationResult { issues: ValidationIssue[]; isValid: boolean; }

export function validateSetup(script: ScriptLike | undefined, selectedCharacterIds: string[], expected: RoleDistribution): ValidationResult {
  if (!script) return { issues: [{ type: 'no-script', message: 'No script selected' }], isValid: false };
  const issues: ValidationIssue[] = [];
  // Tally selected teams
  const teamCounts: RoleDistribution = { townsfolk:0, outsiders:0, minions:0, demons:0 };
  const characterMap = new Map<string, any>();
  const roster = script.characters || script.roles || [];
  for (const c of roster) {
    const id = c.id || c.roleId || c;
    characterMap.set(id, c);
  }
  for (const id of selectedCharacterIds) {
    const c = characterMap.get(id);
    if (!c) continue;
    const team = (c.team || c.type || '').toString().toLowerCase();
    const key = team.startsWith('town') ? 'townsfolk' : team.startsWith('out') ? 'outsiders' : team.startsWith('min') ? 'minions' : 'demons';
    (teamCounts as any)[key] += 1;
  }
  for (const key of ['townsfolk','outsiders','minions','demons'] as (keyof RoleDistribution)[]) {
    if (teamCounts[key] !== expected[key]) {
      issues.push({ type: 'distribution', message: `${key} count ${teamCounts[key]} / ${expected[key]}`, related: [key] });
    }
  }
  // Modifiers: requires
  for (const m of script.modifiers || []) {
    if (m.type === 'requires') {
      const active = selectedCharacterIds.includes(m.whenCharacter);
      if (active) {
        for (const req of m.requireCharacters || []) {
          if (!selectedCharacterIds.includes(req)) {
            issues.push({ type: 'requires', message: `${m.whenCharacter} requires ${req}`, related: [m.whenCharacter, req] });
          }
        }
      }
    } else if (m.type === 'mutuallyExclusive') {
      const present = (m.characters || []).filter((cid: string) => selectedCharacterIds.includes(cid));
      if (present.length > 1) {
        issues.push({ type: 'mutuallyExclusive', message: `Exclusive characters together: ${present.join(', ')}`, related: present });
      }
    } else if (m.type === 'atLeastOneOf') {
      const present = (m.characters || []).some((cid: string) => selectedCharacterIds.includes(cid));
      if (!present) {
        issues.push({ type: 'atLeastOneOf', message: `Need at least one of: ${(m.characters || []).join(', ')}`, related: m.characters });
      }
    }
  }
  return { issues, isValid: issues.length === 0 };
}

export interface NightOrderEntry { id: string; type: string; description?: string; order?: number; raw?: any; }

export function extractNightOrder(script: ScriptLike | undefined): NightOrderEntry[] {
  if (!script) return [];
  const entries: NightOrderEntry[] = [];
  const source = Array.isArray(script.nightOrder) ? script.nightOrder : [];
  for (const item of source) {
    if (typeof item === 'string') {
      entries.push({ id: item, type: 'character', raw: item });
    } else if (item && typeof item === 'object') {
      entries.push({ id: item.id || item.action, type: item.type || 'meta', description: item.description, order: item.order, raw: item });
    }
  }
  // If empty, fallback: derive from characters sorted by (firstNight? otherNight?) metadata if available
  if (!entries.length && Array.isArray(script.characters)) {
    for (const c of script.characters) {
      const id = c.id || c.name;
      entries.push({ id, type: 'character', description: c.ability, raw: c });
    }
  }
  // Sort by explicit order if present
  entries.sort((a,b) => (a.order ?? 9999) - (b.order ?? 9999));
  return entries;
}

export function summarizeDifficulty(script: ScriptLike | undefined): string | undefined {
  return (script?.meta?.complexity as string | undefined) || script?.complexity;
}

export function detectScriptIssues(script: ScriptLike | undefined): string[] {
  if (!script) return ['No script loaded'];
  const issues: string[] = [];
  // Basic heuristic checks
  if (!Array.isArray(script.characters) || script.characters.length === 0) issues.push('Script has no characters');
  if (Array.isArray(script.characters) && script.characters.length < 10) issues.push('Very small character list – may be unbalanced');
  // Duplicate ids
  if (Array.isArray(script.characters)) {
    const seen = new Set<string>();
    for (const c of script.characters) {
      const id = (c.id || '').toLowerCase();
      if (seen.has(id)) issues.push(`Duplicate character id: ${id}`); else if (id) seen.add(id);
    }
  }
  return issues;
}
