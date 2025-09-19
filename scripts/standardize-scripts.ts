#!/usr/bin/env ts-node

/**
 * Script to standardize script data and enrich with concise guidance
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as cheerio from 'cheerio';

const SCRIPTS_DIR = path.join(__dirname, '..', 'data', 'scripts');

const OFFICIAL_WIKI: Record<string, string> = {
  'trouble-brewing': 'https://wiki.bloodontheclocktower.com/Trouble_Brewing',
  'sects-and-violets': 'https://wiki.bloodontheclocktower.com/Sects_%26_Violets',
  'bad-moon-rising': 'https://wiki.bloodontheclocktower.com/Bad_Moon_Rising'
};

interface ScriptGuidance {
  howToRun: string;
  firstNight: string;
  tipsAndTricks: string;
  bluffing: string;
}

const GUIDANCE: Record<string, ScriptGuidance> = {
  'trouble-brewing': {
    howToRun:
      'Use the official Trouble Brewing night order. Provide starting info to Townsfolk (e.g., Washerwoman/Librarian/Investigator) and set up special markers (e.g., Fortune Teller red herring). Balance the puzzle with one Minion and one Demon appropriate to player count, apply Drunk/Poison effects as needed, and keep reminders accurate throughout the game.',
    firstNight:
      'Follow the TB first-night order. Resolve setup effects (e.g., Drunk assignment), then give initial info to Townsfolk as per roles in play. Mark the Fortune Teller red herring, and quietly set any ongoing status (e.g., Poisoner target).',
    tipsAndTricks:
      'Encourage early public claims of soft info and coordinate executions to confirm roles via Undertaker/Washes. Use Empath/Washerwoman/Librarian/Investigator footprints to build trust nets. Track deaths closely to spot Imp shenanigans and Minion support.',
    bluffing:
      'Evil should coordinate bluffs that explain night deaths and disrupt info patterns (e.g., claim Soldier/Saint to deter kills, or Fortune Teller with ambiguous results). Lean on Recluse ambiguity, fake Outsiders to confuse balance reads, and time star-pass or Scarlet Woman swaps carefully.'
  },
  'bad-moon-rising': {
    howToRun:
      'Expect multiple night deaths. Keep good protection and resurrection timing clear (Tea Lady, Innkeeper, Exorcist, Professor). Track who is protected or drunk/poisoned and resolve Demon/Minion kills in the correct order each night.',
    firstNight:
      'Introduce BMR roles per the night order. No complex setup like TB; focus on who has ongoing protections or risks before the first day begins.',
    tipsAndTricks:
      'Players should manage risk. Confirm Tea Lady triangles, use Gambler sparingly, and coordinate Exorcist/Innkeeper timing. Watch for Lunatic games and misleading Godfather kills.',
    bluffing:
      'Evil can weaponize extra deaths and create chaotic cause-and-effect. Fake protections or claim risky Townsfolk to bait kills. Minions should align with Demon kill patterns to sell a consistent story.'
  },
  'sects-and-violets': {
    howToRun:
      'Logic-heavy info script with widespread poisoning and madness. Track ongoing poison/drunk states carefully and resolve information roles with exact timing. Ensure Vortex, No Dashii, and other Demon auras are applied consistently.',
    firstNight:
      'Establish baseline info for roles in play and note sources of possible falsehood (e.g., Vortex, Poisoner). Make sure Madness and experimental roles are clearly understood if used.',
    tipsAndTricks:
      'Players should cross-check information webs and test for Vortex early. Verify contradictions over time and use seamstress/investigator-style hard checks to anchor the web.',
    bluffing:
      'Evil should seed subtle contradictions and leverage poisoning to invalidate clear info. Claim information roles with plausible-but-wrong results and keep a consistent narrative across days.'
  }
};

interface Script {
  id: string;
  name?: string;
  description?: string;
  characters: string[];
  tags?: string[];
  author?: string;
  wikiUrl?: string;
  howToRun?: string;
  firstNight?: string;
  tipsAndTricks?: string;
  bluffing?: string;
  _filePath?: string;
  [key: string]: any;
}

class ScriptStandardizer {
  private scripts: Script[] = [];

  async run(): Promise<void> {
    console.log('🔄 Starting script standardization...\n');

    try {
      await this.loadScripts();

      for (const script of this.scripts) {
        await this.standardizeScript(script);
      }

      await this.writeScripts();
      console.log('✅ Script standardization completed!');

    } catch (error) {
      console.error('❌ Failed:', error);
    }
  }

  async loadScripts(): Promise<void> {
    const files = await fs.readdir(SCRIPTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(SCRIPTS_DIR, file);
      const data = await fs.readFile(filePath, 'utf8');
      const script = JSON.parse(data) as Script;
      script._filePath = filePath;
      this.scripts.push(script);
    }

    console.log(`📂 Loaded ${this.scripts.length} scripts`);
  }

  async standardizeScript(script: Script): Promise<void> {
    console.log(`🔧 Standardizing ${script.id}...`);

    // Apply built-in guidance if available
    const guidance = GUIDANCE[script.id];
    if (guidance) {
      script.howToRun = guidance.howToRun;
      script.firstNight = guidance.firstNight;
      script.tipsAndTricks = guidance.tipsAndTricks;
      script.bluffing = guidance.bluffing;
    }

    // Set wiki URL if official
    if (OFFICIAL_WIKI[script.id]) {
      script.wikiUrl = OFFICIAL_WIKI[script.id];
    }

    // Ensure characters is array
    if (!Array.isArray(script.characters)) {
      script.characters = [];
    }

    // Ensure tags is array
    if (!Array.isArray(script.tags)) {
      script.tags = script.tags ? [script.tags] : [];
    }

    // Try to fetch additional info from wiki if available and guidance not hardcoded
    if (script.wikiUrl && !guidance) {
      await this.fetchWikiInfo(script);
    }
  }

  async fetchWikiInfo(script: Script): Promise<void> {
    console.log(`🌐 Fetching wiki info for ${script.id}...`);

    try {
      const html = await this.fetchPage(script.wikiUrl!);
      const $ = cheerio.load(html);

      // Extract basic description
      if (!script.description) {
        script.description = this.extractDescription($);
      }

      // Extract strategy info if not already provided
      if (!script.howToRun) {
        script.howToRun = this.extractSection($, 'How to Run') || 
                          this.extractSection($, 'Strategy') ||
                          this.extractSection($, 'Gameplay');
      }

    } catch (error: any) {
      console.log(`⚠️  Failed to fetch wiki for ${script.id}: ${error.message}`);
    }
  }

  async fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy(new Error('Request timeout'));
      });
    });
  }

  extractDescription($: cheerio.CheerioAPI): string {
    // Try to extract a basic description from the first paragraph
    const firstPara = $('p').first().text().trim();
    return firstPara.length > 20 ? firstPara : '';
  }

  extractSection($: cheerio.CheerioAPI, sectionTitle: string): string {
    const variations = [sectionTitle, sectionTitle.toLowerCase(), sectionTitle.replace(' ', ' & ')];
    
    for (const variant of variations) {
      let header = $(`h2:contains("${variant}")`);
      if (header.length === 0) header = $(`h3:contains("${variant}")`);
      if (header.length > 0) {
        let content = '';
        let current = header.next();
        while (current.length && !current.is('h2, h3')) {
          content += current.text().trim() + '\n';
          current = current.next();
        }
        return content.trim();
      }
    }
    return '';
  }

  async writeScripts(): Promise<void> {
    for (const script of this.scripts) {
      const { _filePath, ...data } = script;
      await fs.writeFile(_filePath!, JSON.stringify(data, null, 2));
    }
    console.log(`💾 Wrote ${this.scripts.length} scripts`);
  }
}

// Run the script
const standardizer = new ScriptStandardizer();
standardizer.run().catch(console.error);