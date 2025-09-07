#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const ROOT = __dirname;
const CHAR_DIR = path.join(ROOT, 'data', 'characters');
const SCRIPT_DIR = path.join(ROOT, 'data', 'scripts');

async function loadJSON(fp) {
  return JSON.parse(await fs.readFile(fp, 'utf8'));
}

async function loadCharactersMap() {
  const files = await fs.readdir(CHAR_DIR);
  const map = new Map();
  for (const f of files.filter(f => f.endsWith('.json'))) {
    const c = await loadJSON(path.join(CHAR_DIR, f));
    map.set(c.id, c);
  }
  return map;
}

async function loadScriptById(id) {
  const fp = path.join(SCRIPT_DIR, `${id}.json`);
  return loadJSON(fp);
}

function teamOf(charId, charsMap) {
  const c = charsMap.get(charId);
  return c ? c.team : undefined;
}

const TEAM_TO_COUNTKEY = {
  townsfolk: 'townsfolk',
  outsider: 'outsiders',
  minion: 'minions',
  demon: 'demons'
};

const COUNTKEY_TO_TEAM = {
  townsfolk: 'townsfolk',
  outsiders: 'outsider',
  minions: 'minion',
  demons: 'demon'
};

function summarizeCounts(ids, charsMap) {
  const counts = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
  for (const id of ids) {
    const t = teamOf(id, charsMap);
    const key = TEAM_TO_COUNTKEY[t];
    if (key && counts.hasOwnProperty(key)) counts[key]++;
  }
  return counts;
}

function parseCompositionTarget(script, playerCount) {
  const comp = script.composition || {};
  const keys = Object.keys(comp);
  if (keys.length === 0) return null;
  // find exact match first
  if (comp[String(playerCount)]) return comp[String(playerCount)];
  // then ranges like "7-9"
  for (const k of keys) {
    if (k.includes('-')) {
      const [a, b] = k.split('-').map(x => parseInt(x, 10));
      if (Number.isFinite(a) && Number.isFinite(b) && playerCount >= a && playerCount <= b) return comp[k];
    }
  }
  return null;
}

function evalCountExpr(expr, players) {
  if (typeof expr === 'number') return expr;
  if (typeof expr === 'string') {
    // supports forms like "p-3", "p-4", "p-5"
    const m = expr.match(/^p\s*([-+])\s*(\d+)$/i);
    if (m) {
      const n = parseInt(m[2], 10);
      return m[1] === '-' ? players - n : players + n;
    }
    const asNum = Number(expr);
    if (Number.isFinite(asNum)) return asNum;
  }
  return 0;
}

function seedToTarget(selection, targetCounts, pool, charsMap) {
  const notes = [];
  const result = new Set(selection);
  const counts = summarizeCounts([...result], charsMap);
  for (const teamKey of ['townsfolk', 'outsiders', 'minions', 'demons']) {
    const singular = COUNTKEY_TO_TEAM[teamKey];
    while ((counts[teamKey] || 0) < (targetCounts[teamKey] || 0)) {
      const candidate = pool.find(id => teamOf(id, charsMap) === singular && !result.has(id));
      if (!candidate) break;
      result.add(candidate);
      counts[teamKey]++;
      notes.push(`seed: added '${candidate}' to reach base ${teamKey}`);
    }
  }
  return { selection: [...result], notes };
}

function ensureInScriptPool(ids, pool) {
  const set = new Set(pool);
  return ids.filter(id => set.has(id));
}

function applyMutuallyExclusive(selection, rules) {
  const notes = [];
  for (const r of rules) {
    const { characters } = r;
    let present = characters.filter(ch => selection.includes(ch));
    while (present.length > 1) {
      const drop = present[present.length - 1]; // drop the later-listed one
      selection = selection.filter(id => id !== drop);
      notes.push(`mutuallyExclusive: removed '${drop}' (${characters.join(', ')})`);
      present = characters.filter(ch => selection.includes(ch));
    }
  }
  return { selection, notes };
}

function applyRequires(selection, rules, pool) {
  const notes = [];
  const added = new Set();
  for (const r of rules) {
    if (!selection.includes(r.whenCharacter)) continue;
    for (const req of r.requireCharacters) {
      if (!selection.includes(req) && pool.includes(req)) {
        selection.push(req);
        added.add(req);
        notes.push(`requires: added '${req}' due to '${r.whenCharacter}'`);
      }
    }
  }
  return { selection, notes, added };
}

function applyAtLeastOneOf(selection, rules, pool) {
  const notes = [];
  const added = new Set();
  for (const r of rules) {
    const anyPresent = r.characters.some(ch => selection.includes(ch));
    if (!anyPresent) {
      const pick = r.characters.find(ch => pool.includes(ch));
      if (pick && !selection.includes(pick)) {
        selection.push(pick);
        added.add(pick);
        notes.push(`atLeastOneOf: added '${pick}' from [${r.characters.join(', ')}]`);
      }
    }
  }
  return { selection, notes, added };
}

function applyAdjustCounts(selection, rules, pool, charsMap, protectedSet) {
  const notes = [];
  // accumulate deltas
  const totalDelta = { townsfolk: 0, outsiders: 0, minions: 0, demons: 0 };
  for (const r of rules) {
    if (!selection.includes(r.whenCharacter)) continue;
    for (const k of Object.keys(r.delta)) {
      if (totalDelta.hasOwnProperty(k)) totalDelta[k] += r.delta[k] || 0;
    }
    notes.push(`adjustCounts: ${r.whenCharacter} => ${JSON.stringify(r.delta)}`);
  }
  if (Object.values(totalDelta).every(v => v === 0)) {
    return { selection, notes, targetCounts: summarizeCounts(selection, charsMap) };
  }

  const current = summarizeCounts(selection, charsMap);
  const target = {
    townsfolk: current.townsfolk + totalDelta.townsfolk,
    outsiders: current.outsiders + totalDelta.outsiders,
    minions: current.minions + totalDelta.minions,
    demons: current.demons + totalDelta.demons
  };

  // fill increases
  for (const teamKey of ['townsfolk', 'outsiders', 'minions', 'demons']) {
    const singular = COUNTKEY_TO_TEAM[teamKey];
    while ((summarizeCounts(selection, charsMap)[teamKey] || 0) < (target[teamKey] || 0)) {
      const candidate = pool.find(id => teamOf(id, charsMap) === singular && !selection.includes(id));
      if (!candidate) { notes.push(`adjustCounts: unable to fill +${team}`); break; }
      selection.push(candidate);
      notes.push(`adjustCounts: added '${candidate}' to meet ${teamKey} target`);
    }
  }

  // remove decreases
  for (const teamKey of ['townsfolk', 'outsiders', 'minions', 'demons']) {
    const singular = COUNTKEY_TO_TEAM[teamKey];
    while ((summarizeCounts(selection, charsMap)[teamKey] || 0) > (target[teamKey] || 0)) {
      // drop last non-protected of that team
      const idx = [...selection].reverse().findIndex(id => teamOf(id, charsMap) === singular && !protectedSet.has(id));
      if (idx === -1) { notes.push(`adjustCounts: unable to reduce ${team}`); break; }
      const realIdx = selection.length - 1 - idx;
      const removed = selection.splice(realIdx, 1)[0];
      notes.push(`adjustCounts: removed '${removed}' to meet ${teamKey} target`);
    }
  }

  return { selection, notes, targetCounts: summarizeCounts(selection, charsMap) };
}

async function resolve({ scriptId, playerCount, selected }) {
  const script = await loadScriptById(scriptId);
  const charsMap = await loadCharactersMap();
  const pool = script.characters || [];

  // seed selection: only ids present in pool
  let selection = ensureInScriptPool([...new Set(selected || [])], pool);
  const applied = [];

  // If script defines a composition, seed up to base target before applying modifiers
  const comp = parseCompositionTarget(script, playerCount);
  if (comp) {
    const baseTarget = {
      townsfolk: evalCountExpr(comp.townsfolk, playerCount),
      outsiders: evalCountExpr(comp.outsiders, playerCount),
      minions: evalCountExpr(comp.minions, playerCount),
      demons: evalCountExpr(comp.demons, playerCount)
    };
    const res = seedToTarget(selection, baseTarget, pool, charsMap);
    selection = res.selection; applied.push(...res.notes);
  }

  const mods = Array.isArray(script.modifiers) ? script.modifiers : [];
  const byType = (t) => mods.filter(m => m.type === t);

  // mutuallyExclusive
  let res = applyMutuallyExclusive(selection, byType('mutuallyExclusive'));
  selection = res.selection; applied.push(...res.notes);

  // requires
  res = applyRequires(selection, byType('requires'), pool);
  selection = res.selection; const protectedSet = new Set(res.added); applied.push(...res.notes);

  // atLeastOneOf
  res = applyAtLeastOneOf(selection, byType('atLeastOneOf'), pool);
  selection = res.selection; for (const a of res.added) protectedSet.add(a); applied.push(...res.notes);

  // adjustCounts
  res = applyAdjustCounts(selection, byType('adjustCounts'), pool, charsMap, protectedSet);
  selection = res.selection; applied.push(...res.notes);

  const counts = summarizeCounts(selection, charsMap);
  return { scriptId, playerCount, selection, counts, appliedModifiers: applied };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (name, def) => {
    const idx = args.findIndex(a => a === `--${name}`);
    if (idx >= 0) return args[idx + 1];
    return def;
  };
  const scriptId = get('script', 'trouble-brewing');
  const players = parseInt(get('players', '10'), 10);
  const selectArg = get('select', '');
  const selected = selectArg ? selectArg.split(',').map(s => s.trim()).filter(Boolean) : [];
  resolve({ scriptId, playerCount: players, selected }).then(out => {
    console.log(JSON.stringify(out, null, 2));
  }).catch(err => {
    console.error('Resolve failed:', err);
    process.exit(1);
  });
}

module.exports = { resolve };
