#!/usr/bin/env ts-node
/**
 * UX Spec Generator (Auth-aware)
 * -------------------------------
 * Given a URL, visits the page with Playwright, inspects the live DOM,
 * and scaffolds/updates a UX Spec YAML at tests/ui/ux-specs/<slug>.yaml.
 *
 * - If the spec exists, it merges updates non-destructively.
 * - If not, it creates a new spec with reasonable defaults.
 * - Supports gated pages by authenticating first and reusing storage state.
 *
 * Usage:
 *   ts-node scripts/gen-ux-spec.ts --url http://localhost:3000/dashboard --name dashboard \
 *     --viewport 1280x800 --out tests/ui/ux-specs \
 *     --auth.storage .playwright/auth.json \
 *     --auth.loginUrl http://localhost:3000/login \
 *     --auth.user test@example.com --auth.pass 'P@ssw0rd!' \
 *     --auth.userSelector '[data-testid=email-input]' \
 *     --auth.passSelector '[data-testid=password-input]' \
 *     --auth.submitSelector 'button:has-text("Sign in")'
 *
 * Dependencies:
 *   npm i -D @playwright/test js-yaml yargs slugify
 */

import { chromium, BrowserContext } from '@playwright/test';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// ---------- Types matching our UX Spec schema ----------

type LocatorBy = 'role' | 'testid' | 'text' | 'css' | 'xpath';

interface UXElement {
  id: string;
  locator: { by: LocatorBy; value: string };
}

interface UXAction {
  use: string; // element id
  do: 'click' | 'type' | 'hover' | 'waitFor' | 'press';
  value?: string;
  expect?: string; // assertion id
}

interface UXAssertion {
  id: string;
  type: 'visible' | 'text' | 'count' | 'attribute' | 'url' | 'response';
  target: string; // element id or url
  value?: string | number;
}

interface UXVisualShot { name: string; selector?: string; tolerance?: number }

interface UXSpec {
  intent: string;
  personas?: string[];
  routes: string[];
  setup?: { start?: string[]; seed?: string[] };
  viewport?: string; // e.g., 1280x800
  elements: UXElement[];
  actions: UXAction[];
  assertions?: UXAssertion[];
  acceptance?: { functional?: string[]; visual?: { shots: UXVisualShot[] } };
  data?: any;
  accessibility?: string[];
  nonfunctional?: string[];
  flake_controls?: { wait?: 'load' | 'domcontentloaded' | 'networkidle'; retries?: number };
  notes?: string;
}

// ---------- CLI ----------

const args = yargs(hideBin(process.argv))
  .option('url', { type: 'string', demandOption: true })
  .option('name', { type: 'string', description: 'Logical name for the spec; defaults to URL slug' })
  .option('viewport', { type: 'string', default: '1280x800' })
  .option('out', { type: 'string', default: 'tests/ui/ux-specs' })
  .option('intent', { type: 'string', default: 'Page renders key interactive elements and primary CTA is visible' })
  .option('personas', { type: 'string', describe: 'Comma-separated personas', default: '' })
  .option('tolerance', { type: 'number', default: 0.01 })
  // Auth options
  .option('auth.storage', { type: 'string', description: 'Path to Playwright storageState JSON' })
  .option('auth.loginUrl', { type: 'string', description: 'Login page URL' })
  .option('auth.user', { type: 'string', description: 'Username/email for login' })
  .option('auth.pass', { type: 'string', description: 'Password for login' })
  .option('auth.userSelector', { type: 'string', description: 'Selector for username/email input' })
  .option('auth.passSelector', { type: 'string', description: 'Selector for password input' })
  .option('auth.submitSelector', { type: 'string', description: 'Selector for submit button' })
  .help()
  .parseSync();

// ---------- Helpers ----------

function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true });
}

function parseViewport(vp: string): { width: number; height: number } {
  const [w, h] = vp.split('x').map(Number);
  return { width: w || 1280, height: h || 800 };
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readSpec(file: string): UXSpec | null {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  return yaml.load(raw) as UXSpec;
}

function writeSpec(file: string, spec: UXSpec) {
  const doc = yaml.dump(spec, { noRefs: true, lineWidth: 120 });
  fs.writeFileSync(file, doc, 'utf8');
}

function mergeSpec(existing: UXSpec, incoming: UXSpec): UXSpec {
  const mapById = <T extends { id: string }>(arr: T[] = []) => new Map(arr.map(x => [x.id, x] as const));
  const exEls = mapById(existing.elements);
  for (const el of incoming.elements) if (!exEls.has(el.id)) existing.elements.push(el);

  const exAsserts = mapById(existing.assertions || []);
  for (const a of incoming.assertions || []) if (!exAsserts.has(a.id)) (existing.assertions ||= []).push(a);

  if (!existing.actions?.length && incoming.actions?.length) existing.actions = incoming.actions;

  const existingShots = new Set(existing.acceptance?.visual?.shots.map(s => s.name));
  for (const s of incoming.acceptance?.visual?.shots || []) {
    if (!existingShots.has(s.name)) {
      (existing.acceptance ||= {}).visual ||= { shots: [] };
      existing.acceptance.visual.shots.push(s);
    }
  }

  const routeSet = new Set([...(existing.routes || []), ...(incoming.routes || [])]);
  existing.routes = Array.from(routeSet);

  existing.intent ||= incoming.intent;
  existing.viewport ||= incoming.viewport;
  existing.flake_controls ||= incoming.flake_controls;
  existing.notes = [existing.notes, incoming.notes].filter(Boolean).join('\n');

  return existing;
}

// ---------- Auth ----------

async function getContextWithAuth(vp: { width: number; height: number }): Promise<BrowserContext> {
  const storagePath = (args as any)['auth.storage'] as string | undefined;
  if (storagePath && fs.existsSync(storagePath)) {
    return await chromium.launchPersistentContext(path.dirname(storagePath), {
      viewport: vp,
      storageState: storagePath,
      headless: true
    });
  }

  const loginUrl = (args as any)['auth.loginUrl'] as string | undefined;
  const user = (args as any)['auth.user'] as string | undefined;
  const pass = (args as any)['auth.pass'] as string | undefined;
  const userSel = (args as any)['auth.userSelector'] as string | undefined;
  const passSel = (args as any)['auth.passSelector'] as string | undefined;
  const submitSel = (args as any)['auth.submitSelector'] as string | undefined;

  if (loginUrl && user && pass && userSel && passSel && submitSel) {
    const context = await chromium.launchPersistentContext('', { viewport: vp, headless: true });
    const page = await context.newPage();
    await page.goto(loginUrl, { waitUntil: 'networkidle' });
    await page.fill(userSel, user);
    await page.fill(passSel, pass);
    await page.click(submitSel);
    await page.waitForLoadState('networkidle');

    // Save storage state if path provided
    if (storagePath) {
      ensureDir(path.dirname(storagePath));
      await context.storageState({ path: storagePath });
    }
    return context;
  }

  // no auth provided; normal context
  const browser = await chromium.launch();
  return await browser.newContext({ viewport: vp });
}

// ---------- DOM Inspection ----------

async function inspect(context: BrowserContext, url: string, viewport: { width: number; height: number }) {
  const page = await context.newPage();
  const elements: UXElement[] = [];
  const assertions: UXAssertion[] = [];

  await page.goto(url, { waitUntil: 'networkidle' });

  // Prefer testids
  const testids = await page.$$('[data-testid]');
  for (const handle of testids) {
    const testid = await handle.getAttribute('data-testid');
    if (!testid) continue;
    const id = toSlug(testid);
    elements.push({ id, locator: { by: 'testid', value: testid } });
  }

  // Buttons (role-based)
  const buttons = await page.getByRole('button').all();
  let btnIdx = 0;
  for (const b of buttons) {
    const nameAttr = await b.getAttribute('name');
    const txt = (await b.textContent())?.trim();
    const name = (nameAttr || txt || `button-${++btnIdx}`).trim();
    if (!name) continue;
    const id = toSlug(`btn-${name}`);
    elements.push({ id, locator: { by: 'role', value: `button[name=${JSON.stringify(name).slice(1,-1)}]` } });
  }

  // Headings
  const headings = await page.locator('h1,h2,h3').all();
  for (const h of headings) {
    const txt = (await h.textContent())?.trim();
    if (!txt) continue;
    const id = toSlug(`heading-${txt}`);
    elements.push({ id, locator: { by: 'text', value: txt } });
    if (!assertions.find(a => a.id === 'headline-visible')) {
      assertions.push({ id: 'headline-visible', type: 'visible', target: id });
    }
  }

  // Inputs
  const inputs = await page.locator('input,textarea,select').all();
  let inIdx = 0;
  for (const i of inputs) {
    const type = (await i.getAttribute('type')) || 'text';
    const placeholder = (await i.getAttribute('placeholder')) || '';
    const name = (await i.getAttribute('name')) || placeholder || `field-${++inIdx}`;
    const tag = await i.evaluate(el => el.tagName.toLowerCase());
    const id = toSlug(`${type}-${name}`);
    elements.push({ id, locator: { by: 'css', value: `${tag}[name="${name}"]` } });
  }

  const shots: UXVisualShot[] = [ { name: 'page.png', tolerance: args.tolerance as number } ];

  const spec: UXSpec = {
    intent: (args.intent as string),
    personas: (args.personas as string) ? (args.personas as string).split(',').map(s => s.trim()).filter(Boolean) : undefined,
    routes: [url],
    setup: { start: [], seed: [] },
    viewport: `${viewport.width}x${viewport.height}`,
    elements: dedupeElements(elements).slice(0, 50),
    actions: [],
    assertions: assertions.slice(0, 20),
    acceptance: { functional: assertions.map(a => a.id).slice(0, 10), visual: { shots } },
    accessibility: ['Key interactive controls have roles and names'],
    nonfunctional: ['No console errors during navigation'],
    flake_controls: { wait: 'networkidle', retries: 1 },
    notes: 'Auto-generated scaffold; confirm selectors and add actions.'
  };

  return spec;
}

function dedupeElements(elements: UXElement[]): UXElement[] {
  const seen = new Set<string>();
  const out: UXElement[] = [];
  for (const el of elements) {
    const key = `${el.locator.by}:${el.locator.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let id = el.id;
    let n = 2;
    while (out.find(e => e.id === id)) id = `${el.id}-${n++}`;
    out.push({ ...el, id });
  }
  return out;
}

// ---------- Main ----------

(async () => {
  const { url, name, viewport, out } = args as any;
  const vp = parseViewport(viewport);
  const baseName = name || toSlug(new URL(url).pathname.replace(/\/+/, '-') || 'page');
  const outDir = path.resolve(process.cwd(), out);
  ensureDir(outDir);
  const file = path.join(outDir, `${baseName || 'page'}.yaml`);

  const context = await getContextWithAuth(vp);
  try {
    const generated = await inspect(context, url, vp);

    const existing = readSpec(file);
    const finalSpec = existing ? mergeSpec(existing, generated) : generated;

    writeSpec(file, finalSpec);
    console.log(`[ux-spec] ${existing ? 'Updated' : 'Created'}: ${path.relative(process.cwd(), file)}`);
  } finally {
    await context.close();
  }
})();
