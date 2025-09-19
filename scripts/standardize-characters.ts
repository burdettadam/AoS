#!/usr/bin/env ts-node

/**
 * Script to standardize character data and add wiki information
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as cheerio from 'cheerio';

const CHARACTERS_DIR = path.join(__dirname, '..', 'data', 'characters');

interface Character {
  id: string;
  name?: string;
  team: string;
  ability: string;
  firstNight?: string | null;
  otherNights?: string | null;
  reminders: string[];
  setup: boolean;
  special?: string | null;
  editions: string[];
  tags: string[];
  wikiUrl?: string | null;
  imageUrl?: string | null;
  howToRun: string;
  firstNightDescription: string;
  tipsAndTricks: string;
  bluffing: string;
  legacy?: any;
  _filePath?: string;
  [key: string]: any; // For handling legacy properties
}

class CharacterStandardizer {
  private characters: Character[] = [];

  async run(): Promise<void> {
    console.log('🔄 Starting character standardization...\n');

    try {
      // Read all character files
      await this.loadCharacters();

      // Standardize each character
      for (const char of this.characters) {
        await this.standardizeCharacter(char);
      }

      // Write back
      await this.writeCharacters();

      console.log('✅ Standardization completed!');

    } catch (error) {
      console.error('❌ Failed:', error);
    }
  }

  async loadCharacters(): Promise<void> {
    const files = await fs.readdir(CHARACTERS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(CHARACTERS_DIR, file);
      const data = await fs.readFile(filePath, 'utf8');
      const char = JSON.parse(data) as Character;
      char._filePath = filePath;
      this.characters.push(char);
    }

    console.log(`📂 Loaded ${this.characters.length} characters`);
  }

  async standardizeCharacter(char: Character): Promise<void> {
    console.log(`🔧 Standardizing ${char.id}...`);

    // Normalize to standard format
    const standardized: Character = {
      id: char.id,
      name: char.name || this.formatName(char.id),
      team: this.normalizeTeam(char.category || char.team),
      ability: char.ability_summary || char.abilitySummary || char.ability || char.ability_description || 'Unknown ability',
      firstNight: this.parseNightOrder(char.first_night_action || char.firstNightAction || char.first_night_reminder || char.firstNightReminder),
      otherNights: this.parseNightOrder(char.other_nights_action || char.otherNightsAction || char.other_night_reminder || char.otherNightReminder),
      reminders: char.tokens_used || char.tokensUsed || char.reminders || [],
      setup: char.setup || false,
      special: char.special || null,
      editions: char.editions || char.edition || [],
      tags: char.tags || [],
      wikiUrl: char.wiki_url || char.wikiUrl || null,
      imageUrl: char.image_url || char.imageUrl || null,
      // New fields
      howToRun: '',
      firstNightDescription: '',
      tipsAndTricks: '',
      bluffing: '',
      // Legacy
      legacy: char.legacy || {
        category: char.category,
        originalSource: char.edition || char.editions,
        firstNightReminder: char.first_night_reminder || char.firstNightReminder,
        otherNightReminder: char.other_night_reminder || char.otherNightReminder
      }
    };

    // Ensure editions is array
    if (!Array.isArray(standardized.editions)) {
      standardized.editions = [standardized.editions].filter(Boolean);
    }

    // If Trouble Brewing role and missing wiki URL, infer it
    if ((!standardized.wikiUrl || typeof standardized.wikiUrl !== 'string') &&
        Array.isArray(standardized.editions) && standardized.editions.includes('trouble-brewing')) {
      standardized.wikiUrl = this.inferWikiUrl(standardized);
    }

    // Fetch wiki info if available
    if (standardized.wikiUrl) {
      await this.fetchWikiInfo(standardized);
    }

    // Fallback: derive first night description from howToRun if empty
    if (!standardized.firstNightDescription && standardized.howToRun) {
      const lines = standardized.howToRun.split(/\n+/);
      const firstNightLines = lines.filter(l => /first night|prepare|preparing the first/i.test(l));
      if (firstNightLines.length) {
        standardized.firstNightDescription = firstNightLines.join('\n').trim();
      }
    }

    // Replace the original with standardized
    const filePath = char._filePath;
    Object.keys(char).forEach(key => delete char[key]);
    Object.assign(char, standardized);
    char._filePath = filePath;
  }

  normalizeTeam(team: string): string {
    const mapping: { [key: string]: string } = {
      'townsfolk': 'townsfolk',
      'townsfolks': 'townsfolk',
      'outsider': 'outsider',
      'minion': 'minion',
      'demon': 'demon'
    };
    return mapping[team] || team || 'townsfolk';
  }

  parseNightOrder(action: any): string | null {
    if (!action) return null;
    if (typeof action === 'string') return action;
    // Handle other formats if needed
    return action;
  }

  formatName(id: string): string {
    return id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  inferWikiUrl(char: Character): string {
    // Convert name or id to Wiki slug (Title_Case with underscores)
    const base = (char.name || this.formatName(char.id))
      .replace(/[^A-Za-z0-9\s-]/g, '')
      .trim()
      .split(/\s|-+/)
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('_');
    return `https://wiki.bloodontheclocktower.com/${base}`;
  }

  async fetchWikiInfo(char: Character): Promise<void> {
    console.log(`🌐 Fetching wiki for ${char.id}...`);

    try {
      const html = await this.fetchPage(char.wikiUrl!);
      const $ = cheerio.load(html);

      // Extract sections
      char.howToRun = this.extractSection($, 'How to Run');
      char.firstNightDescription = this.extractSection($, 'First Night');
      char.tipsAndTricks = this.extractSection($, 'Tips and Tricks') || this.extractSection($, 'Tips');
      char.bluffing = this.extractSection($, 'Bluffing');

    } catch (error: any) {
      console.log(`⚠️  Failed to fetch wiki for ${char.id}: ${error.message}`);
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

  extractSection($: cheerio.CheerioAPI, sectionTitle: string): string {
    // Try different variations
    const variations = [sectionTitle, sectionTitle.toLowerCase(), sectionTitle.replace(' ', ' & '), sectionTitle.replace(' ', '-')];
    
    for (const variant of variations) {
      let header = $(`h2:contains("${variant}")`);
      if (header.length === 0) header = $(`h3:contains("${variant}")`);
      if (header.length === 0) header = $(`h4:contains("${variant}")`);
      if (header.length > 0) {
        // Get all content until next header
        let content = '';
        let current = header.next();
        while (current.length && !current.is('h2, h3, h4')) {
          content += current.text().trim() + '\n';
          current = current.next();
        }
        return content.trim();
      }
    }
    return '';
  }

  async writeCharacters(): Promise<void> {
    for (const char of this.characters) {
      const { _filePath, ...data } = char;
      await fs.writeFile(_filePath!, JSON.stringify(data, null, 2));
    }
    console.log(`💾 Wrote ${this.characters.length} characters`);
  }
}

// Run the script
const standardizer = new CharacterStandardizer();
standardizer.run().catch(console.error);