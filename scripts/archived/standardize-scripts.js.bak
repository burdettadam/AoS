#!/usr/bin/env node

/**
 * Script to standardize script data and enrich with concise guidance
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');

const SCRIPTS_DIR = path.join(__dirname, 'data', 'scripts');

const OFFICIAL_WIKI = {
  'trouble-brewing': 'https://wiki.bloodontheclocktower.com/Trouble_Brewing',
  'sects-and-violets': 'https://wiki.bloodontheclocktower.com/Sects_%26_Violets',
  'bad-moon-rising': 'https://wiki.bloodontheclocktower.com/Bad_Moon_Rising'
};

const GUIDANCE = {
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
  },
  // Custom/community scripts guidance
  'greatest-hits': {
    howToRun: 'Mix of iconic roles across editions—keep a clean night sheet and avoid stacking too many distortion sources at once. Pace days to let the table synthesize cross-edition info patterns.',
    firstNight: 'Seed 1–2 solid anchors (e.g., Washerwoman/Clockmaker) and 1 distortion (Poisoner/Vortox style) max. Ensure reminders for cross-edition quirks are set.',
    tipsAndTricks: 'Good: Look for consistent footprints that transcend editions; verify with Undertaker/Seamstress style checks. Evil: Borrow believable bluffs from any edition and keep lies simple and repeatable.',
    bluffing: 'Pick well-known roles and deliver a steady narrative; reference common edition patterns to sound credible.'
  },
  'anonymous-dishonesty': {
    howToRun: 'Leans into secrecy and deception. Encourage whispers, allow bluff windows, and keep private info flows crisp. Track any anonymity mechanics carefully.',
    firstNight: 'Prioritize roles that create private information trails. Set at most one global distortion so lies remain distinguishable from poison.',
    tipsAndTricks: 'Good: Cross-verify private claims in pairs; make liars commit early. Evil: Exploit private channels; keep stories short and consistent.',
    bluffing: 'Offer minimal details with confident delivery; avoid over-sharing. Claim roles that justify secrecy.'
  },
  'catfishing': {
    howToRun: 'Identity misdirection theme. Clarify timing on character identity effects. Keep a log of claims vs. ability results to spot reveals/conflicts.',
    firstNight: 'Introduce at least one truth anchor and one identity-bending effect. Remind players to timestamp claims.',
    tipsAndTricks: 'Good: Track who claimed what, when. Test for contradictions via hard-check roles. Evil: Impersonate low-info roles and pivot identities on schedule.',
    bluffing: 'Change claims sparingly with a reason (drunk/poison/morph), not randomly.'
  },
  'contempt': {
    howToRun: 'High-pressure, accusation-heavy table. Enforce clear nomination phrasing and voting cadence. Keep executions crisp to avoid social stalemates.',
    firstNight: 'Provide tools for de-escalation (confirmers) and one chaos source to fuel debate.',
    tipsAndTricks: 'Good: Demand receipts; align behind verifiable plans. Evil: Stoke rivalries, split votes, force time pressure.',
    bluffing: 'Adopt assertive personas; justify votes with simple heuristics that sound principled.'
  },
  'devout-theists': {
    howToRun: 'Likely features alignment/madness pledges or holy-themed protections. Make any vow/madness consequences explicit and consistent.',
    firstNight: 'Set blessings/curses early. Clarify any public vs. private effects.',
    tipsAndTricks: 'Good: Coordinate vows to net info without locking key roles. Evil: Weaponize vow constraints to trap truth-tellers.',
    bluffing: 'Claim blessed protection or absolution to explain survivals and misreads.'
  },
  'harold-holts-revenge': {
    howToRun: 'Expect disappearances/returns or sudden state shifts. Track all removals/returns on reminders so narrative remains coherent.',
    firstNight: 'Signal that unusual absences may occur; set expectations about how info persists across them.',
    tipsAndTricks: 'Good: Rebuild info webs after each disruption; preserve baselines in notes. Evil: Time disruptions to erase incriminating patterns.',
    bluffing: 'Blame gaps on script effects and use them to reset suspicious narratives.'
  },
  'hide-and-seek': {
    howToRun: 'Stealth and avoidance mechanics. Record who is “hidden” or unselectable each night. Ensure targeting rules are clear.',
    firstNight: 'Establish at least one discover-check and one hide mechanic to begin the dance.',
    tipsAndTricks: 'Good: Force reveals via checks/votes; corner hidden players with structure. Evil: Rotate hiding to muddy selection-based info.',
    bluffing: 'Claim roles that justify being hard to target without sounding invulnerable.'
  },
  'insanity-and-intuition': {
    howToRun: 'Madness and gut-reading theme. Enforce madness consistently but gently. Keep a list of declared intuitions to measure over time.',
    firstNight: 'Introduce a clear madness source and an intuition-confirming role.',
    tipsAndTricks: 'Good: Turn intuition into hypotheses and test them. Evil: Fake madness constraints to excuse contradictions.',
    bluffing: 'Claim intuitive pings and evolve them gradually to fit outcomes.'
  },
  'irrational-behaviour': {
    howToRun: 'Chaotic actions with logical resolution. State edge-case rulings upfront. Keep night order strict so “irrational” stays fair.',
    firstNight: 'Seed 1–2 chaos sources and 1 stabilizer role.',
    tipsAndTricks: 'Good: Separate noise from signal by aggregating over days. Evil: Add just-enough noise to make real contradictions look random.',
    bluffing: 'Blame oddities on the script; keep your story stable.'
  },
  'mad-as-a-hatter': {
    howToRun: 'Madness-heavy. Explain penalties and detection. Track who risks which madness each day.',
    firstNight: 'Set initial madness expectations and candidates.',
    tipsAndTricks: 'Good: Use safe-madness plays to bait evil. Evil: Accuse townsfolk of soft-breaking madness to discredit info.',
    bluffing: 'Perform controlled eccentricity that never breaks rules.'
  },
  'monkey-do-math': {
    howToRun: 'Combines chaos and numeric reads. Present results in tidy formats and highlight when randomness applies.',
    firstNight: 'Establish whether numbers include noise (e.g., red herrings).',
    tipsAndTricks: 'Good: Build rolling tallies; compare deltas. Evil: Shift poison targets to disrupt trending numbers.',
    bluffing: 'Quote small, precise numbers and keep them consistent.'
  },
  'no-greater-joy': {
    howToRun: 'Positive-leaning protections and benevolent twists. Ensure protection stacking is ruled. Celebrate reveals to keep pace fun.',
    firstNight: 'Start with at least one protection and one limited high-impact good ability.',
    tipsAndTricks: 'Good: Chain protections around confirmed players. Evil: Bypass protection indirectly (poison, misdirection).',
    bluffing: 'Claim soft utility roles that explain patience and survivals.'
  },
  'on-thin-ice': {
    howToRun: 'Risky plays and fragile states. Announce when conditions worsen or improve. Be consistent with break-once rules.',
    firstNight: 'Introduce a risk/reward role and an insurance role.',
    tipsAndTricks: 'Good: Take calculated risks early; cash out before endgame. Evil: Lure good into overcommitting or into lethal trades.',
    bluffing: 'Claim you’re saving a clutch once-per-game—until you “must” use it.'
  },
  'revenge-of-the-martian-vampires': {
    howToRun: 'High-lethality/stacked threats. Keep kill ordering crystal clear and announce death counts cleanly at dawn.',
    firstNight: 'Telegraph danger; add a stabilizer role so the town can plan.',
    tipsAndTricks: 'Good: Protect information hubs and force Demon tells through constrained choices. Evil: Sync minion/demon kills for maximum confusion.',
    bluffing: 'Alternate between safe utility bluffs and dramatic power claims to control pace.'
  },
  'the-midnight-oasis': {
    howToRun: 'Pockets of safety amid danger. Clearly mark “oasis” zones (when, who, how long).',
    firstNight: 'Establish the first safe window and how it’s discovered.',
    tipsAndTricks: 'Good: Time actions to coincide with oasis windows. Evil: Attack just outside safety to maximize fear.',
    bluffing: 'Claim you can extend or relocate safety to steer votes.'
  },
  'the-ones-you-least-expect': {
    howToRun: 'Surprise role reveals and twists. Keep transformation logs. Announce rule changes succinctly when they trigger.',
    firstNight: 'Set a low number of twist triggers so surprises are legible.',
    tipsAndTricks: 'Good: Re-evaluate assumptions after each reveal. Evil: Time twists to invalidate town’s confirms.',
    bluffing: 'Hint at a twist that justifies your pivot later.'
  },
  'trouble-with-violets': {
    howToRun: 'TB fundamentals with SV-style logic traps. Keep poisoning/falsehood sources light to preserve TB readability.',
    firstNight: 'Run TB setup, but foreshadow SV contradictions. Place a single red herring or aura.',
    tipsAndTricks: 'Good: Use TB anchors and then probe for SV-style distortions. Evil: Look TB-honest while inserting one clean contradiction path.',
    bluffing: 'Blend classic TB bluffs with a subtle SV twist.'
  },
  'uncertain-death': {
    howToRun: 'Deaths are unpredictable or conditional. State the resolution order and conditions clearly; log every prevented/redirected death.',
    firstNight: 'Introduce one prevention and one uncertain kill source.',
    tipsAndTricks: 'Good: Track who “should have died” vs. “did die”. Evil: Set up plausible deniability around failed kills.',
    bluffing: 'Explain survivals as expected outcomes of your claimed ability.'
  },
  'whose-cult-is-it-anyway': {
    howToRun: 'Cult dynamics and conversions. Make conversion rules explicit and limited. Track membership and voting impacts.',
    firstNight: 'Announce whether conversions can happen at night/day and who is eligible.',
    tipsAndTricks: 'Good: Guard key roles from conversion; verify loyalties often. Evil: Obscure membership and sow distrust about converts.',
    bluffing: 'Claim knowledge of cult effects to steer fear toward innocents.'
  },
  'Ravenswood_data': {
    howToRun: 'A minimal TB showcase. Keep it simple: one Demon, one Minion, clean info, minimal distortion.',
    firstNight: 'Run core TB first-night order and give straightforward info.',
    tipsAndTricks: 'Good: Share early, execute on confirmable leads. Evil: Keep lies tiny; big swings get caught in simple setups.',
    bluffing: 'Use classic TB bluffs (Soldier/Saint/Fortune Teller) and avoid complexity.'
  },
  'quick-maths': {
    howToRun: 'Use standard night order and maintain brisk pacing. Keep numeric outputs tidy and track modifiers precisely.',
    firstNight: 'Seed anchors (Mathematician/Clockmaker) and a single distortion. Emphasize recording exact results.',
    tipsAndTricks: 'Good: Compare deltas day-to-day; test for Vortox/poison early. Evil: Introduce small arithmetic lies and keep them consistent.',
    bluffing: 'Claim compact numerical roles and maintain a steady ledger.'
  },
  'punchy': {
    howToRun: 'Direct conflict script—clarify kill/protect timing and once-per-game windows. Keep day cadence tight.',
    firstNight: 'Highlight duel/force mechanics and provide one protection and one piercing threat.',
    tipsAndTricks: 'Good: Force commitments; bait Demon choices. Evil: Manufacture grudges and push fast executions.',
    bluffing: 'Adopt assertive presence; use protective bluffs to explain survivals.'
  }
};

class ScriptStandardizer {
  constructor() {
    this.scripts = [];
  }

  async run() {
    console.log('🔄 Starting script standardization...\n');
    await this.loadScripts();
    for (const s of this.scripts) {
      await this.standardize(s);
    }
    await this.writeScripts();
    console.log('✅ Script standardization completed!');
  }

  async loadScripts() {
    const files = await fs.readdir(SCRIPTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    for (const file of jsonFiles) {
      const filePath = path.join(SCRIPTS_DIR, file);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data);
      parsed._filePath = filePath;
      this.scripts.push(parsed);
    }
    console.log(`📂 Loaded ${this.scripts.length} scripts`);
  }

  normalizeComplexity(value) {
    const v = (value || '').toString().toLowerCase();
    if (['beginner', 'intro', 'easy'].includes(v)) return 'beginner';
    if (['intermediate', 'standard', 'normal'].includes(v)) return 'intermediate';
    if (['advanced', 'hard', 'expert'].includes(v)) return 'advanced';
    if (['storyteller'].includes(v)) return 'storyteller';
    return value || 'intermediate';
  }

  inferWikiUrl(id) {
    return OFFICIAL_WIKI[id] || null;
  }

  async standardize(script) {
    const id = script.id || path.basename(script._filePath, '.json');
    const name = script.name || this.formatName(id);
    const wikiUrl = script.wikiUrl || this.inferWikiUrl(id);

    const standardized = {
      id,
      name,
      description: script.description || '',
      author: script.author || '',
      version: script.version || '1.0.0',
      characters: Array.isArray(script.characters) ? script.characters : [],
      playerCount: (() => {
        const pc = script.playerCount || { min: 5, max: 15, optimal: '7-10' };
        return {
          min: pc.min ?? 5,
          max: pc.max ?? 15,
          optimal: pc.optimal ?? '7-10'
        };
      })(),
      complexity: this.normalizeComplexity(script.complexity),
      tags: Array.isArray(script.tags) ? script.tags : [],
      estimatedTime: script.estimatedTime || '',
      characterDistribution: script.characterDistribution || {},
      specialRules: Array.isArray(script.specialRules) ? script.specialRules : [],
      setupNotes: script.setupNotes || '',
      winConditions: script.winConditions || { good: 'Execute all Demons', evil: 'Equal or outnumber good players' },
      wikiUrl,
      // New fields
      howToRun: script.howToRun || (GUIDANCE[id]?.howToRun || ''),
      firstNight: script.firstNight || (GUIDANCE[id]?.firstNight || ''),
      tipsAndTricks: script.tipsAndTricks || (GUIDANCE[id]?.tipsAndTricks || ''),
      bluffing: script.bluffing || (GUIDANCE[id]?.bluffing || ''),
      legacy: script.legacy || null
    };

    // If wiki available, fetch sections to enrich
    if (standardized.wikiUrl) {
      try {
        const html = await this.fetchPage(standardized.wikiUrl);
        const $ = cheerio.load(html);
        const howToRun = this.extractSection($, 'How to Run') || this.extractSection($, 'How to run');
        const firstNight = this.extractSection($, 'First Night') || this.extractSection($, 'First night');
        const tips = this.extractSection($, 'Tips and Tricks') || this.extractSection($, 'Tips');
        const bluffing = this.extractSection($, 'Bluffing');

        standardized.howToRun = standardized.howToRun || howToRun;
        standardized.firstNight = standardized.firstNight || firstNight;
        standardized.tipsAndTricks = standardized.tipsAndTricks || tips;
        standardized.bluffing = standardized.bluffing || bluffing;
      } catch (e) {
        // ignore fetch errors and keep existing
      }
    }

    const filePath = script._filePath;
    Object.keys(script).forEach(k => delete script[k]);
    Object.assign(script, standardized);
    script._filePath = filePath;
  }

  formatName(id) {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  async writeScripts() {
    for (const s of this.scripts) {
      const { _filePath, ...data } = s;
      await fs.writeFile(_filePath, JSON.stringify(data, null, 2));
    }
    console.log(`💾 Wrote ${this.scripts.length} scripts`);
  }

  async fetchPage(url) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy(new Error('Request timeout'));
      });
    });
  }

  extractSection($, sectionTitle) {
    const variations = [sectionTitle, sectionTitle.toLowerCase(), sectionTitle.replace(' ', '&'), sectionTitle.replace(' ', '-')];
    for (const v of variations) {
      let header = $(`h2:contains("${v}")`);
      if (header.length === 0) header = $(`h3:contains("${v}")`);
      if (header.length === 0) header = $(`h4:contains("${v}")`);
      if (header.length > 0) {
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
}

new ScriptStandardizer().run();
