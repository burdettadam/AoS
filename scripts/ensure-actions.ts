#!/usr/bin/env ts-node

/**
 * Ensure every character JSON has an `actions` object with all expected phases.
 * - Adds actions if missing
 * - Fills in any missing phase arrays if actions exists
 * Phases: firstNight, otherNights, day, nominations, voting, execution
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const CHAR_DIR = path.join(ROOT, 'data', 'characters');
const PHASES = ['firstNight', 'otherNights', 'day', 'nominations', 'voting', 'execution'] as const;

type Phase = typeof PHASES[number];
type ActionsObject = Record<Phase, any[]>;

interface Character {
  actions?: ActionsObject | any;
  [key: string]: any;
}

function skeletonActions(): ActionsObject {
  return PHASES.reduce((acc, k) => {
    acc[k] = [];
    return acc;
  }, {} as ActionsObject);
}

async function main(): Promise<void> {
  let updated = 0;
  let total = 0;
  const files = (await fs.readdir(CHAR_DIR)).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(CHAR_DIR, file);
    let json: Character;
    
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      json = JSON.parse(raw);
    } catch (err: any) {
      console.error(`❌ Failed to parse ${file}: ${err.message}`);
      continue;
    }

    total++;
    let changed = false;

    if (!json.actions || typeof json.actions !== 'object' || Array.isArray(json.actions)) {
      json.actions = skeletonActions();
      changed = true;
    } else {
      for (const phase of PHASES) {
        if (!Array.isArray(json.actions[phase])) {
          json.actions[phase] = [];
          changed = true;
        }
      }
      
      // Strip any unknown phases to keep things tidy (optional – comment out if you want to preserve)
      for (const k of Object.keys(json.actions)) {
        if (!PHASES.includes(k as Phase)) {
          delete json.actions[k];
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
      updated++;
    }
  }

  console.log(`✅ Ensured actions for ${total} characters; updated ${updated} files.`);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});