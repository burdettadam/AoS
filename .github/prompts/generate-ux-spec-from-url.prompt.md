---
name: "Generate UX Spec from URL"
description: "Visit a URL with Playwright MCP, inspect the live DOM, and create/update a UX Spec YAML."
mode: agent
---


## Inputs
- url: page to inspect (required)
- name: logical spec name / filename (optional; default: slug of URL path)
- viewport: e.g., `1280x800` (default)
- outDir: output directory (default: `tests/ui/ux-specs`)
- auth (optional):
- storage: path to Playwright storageState JSON (e.g., `.playwright/auth.json`)
- loginUrl: login page URL
- user / pass: credentials
- userSelector / passSelector / submitSelector: stable selectors for auth


## Assumptions to Confirm
- App is reachable on the given URL.
- If auth is required, either `auth.storage` exists or login parameters are provided.


## Plan
1) Prepare viewport and output directory.
2) If `auth.storage` exists → use it; else if login details provided → perform login via Playwright MCP and (optionally) save storage.
3) Navigate to `url` and wait for `networkidle`.
4) Inspect DOM for stable locators in priority order: `data-testid`, then ARIA `role/name`, then semantic fallbacks.
5) Build a **UX Spec YAML** using the repository schema (intent, routes, elements, actions[], assertions[], acceptance.visual shots, accessibility, flake controls, notes).
6) If a spec named `<outDir>/<name>.yaml` exists → **merge non‑destructively**; otherwise create a new file.
7) Write the YAML to disk and report the relative path.


## Tooling
- **Playwright MCP**: open page, query selectors, capture content; optionally do login steps.
- **Filesystem**: read/write YAML file.
- **Terminal (optional)**: create directories if needed.


## Merge Rules
- Keep existing fields; append new `elements`/`assertions` if IDs are unique.
- Do **not** reorder existing `actions`; only set if empty.
- Union `routes`; accumulate `notes`.
- For acceptance.visual, add new shot names if missing.


## Output
- Path to spec file (created/updated)
- Summary counts: elements/assertions added, existing preserved
- Any unknowns or selectors needing confirmation


## YAML Template
Use this shape and fill discovered fields:
```yaml
intent: "<auto: primary CTA visible / customize>"
personas: []
routes: ["<url>"]
setup: { start: [], seed: [] }
viewport: "<WxH>"
elements:
- id: <slug>
locator: { by: testid|role|text|css, value: <string> }
actions: []
assertions:
- id: headline-visible
type: visible
target: <heading-id>
acceptance:
functional: [headline-visible]
visual:
shots: [{ name: page.png, tolerance: 0.01 }]
accessibility:
- "Key interactive controls have roles and names"
nonfunctional:
- "No console errors during navigation"
flake_controls: { wait: networkidle, retries: 1 }
notes: "Auto-generated scaffold; confirm selectors and add actions."
```


## Example Invocation
- Minimal: `url=http://localhost:3000/login`
- With auth: `url=http://localhost:3000/dashboard name=dashboard auth.storage=.playwright/auth.json`


## Post-Run Next Steps
- Run `/UX Spec → Playwright Plan` to turn this spec into runnable steps/tests.
- Run `/Run UI Spec with Playwright` then `/Screenshot Compare (ImageSorcery)`.
- If mismatches appear, proceed with `/Fix & Verify UI (Playwright + ImageSorcery)`.