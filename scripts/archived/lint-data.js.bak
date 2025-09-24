#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function loadJSON(dir) {
  const files = await fs.readdir(dir);
  const out = [];
  for (const f of files.filter(f => f.endsWith('.json'))) {
    const full = path.join(dir, f);
    out.push({ path: full, data: JSON.parse(await fs.readFile(full, 'utf8')) });
  }
  return out;
}

async function main() {
  const root = __dirname;
  const chars = await loadJSON(path.join(root, 'data', 'characters'));
  const scripts = await loadJSON(path.join(root, 'data', 'scripts'));

  const charIds = new Set(chars.map(c => c.data.id));
  const errors = [];

  // 1) Every referenced character exists
  for (const s of scripts) {
    for (const cid of s.data.characters || []) {
      if (!charIds.has(cid)) {
        errors.push(`Script ${path.basename(s.path)} references missing character '${cid}'`);
      }
    }
  }

  // 2) Optional: flag duplicate character IDs across files
  const seen = new Map();
  for (const c of chars) {
    const id = c.data.id;
    if (seen.has(id)) {
      errors.push(`Duplicate character id '${id}' in ${path.basename(seen.get(id))} and ${path.basename(c.path)}`);
    } else {
      seen.set(id, c.path);
    }
  }

  if (errors.length) {
    console.error('❌ Lint errors found:');
    for (const e of errors) console.error('- ' + e);
    process.exitCode = 1;
  } else {
    console.log('✅ Data lint passed');
  }
}

main();
