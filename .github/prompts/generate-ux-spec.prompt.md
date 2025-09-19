---
name: "Generate UX Spec from URL"
description: "Use Playwright MCP to open a URL (optionally with login), inspect DOM, and scaffold/update a UX Spec YAML."
mode: agent
---


## Inputs
- url: page to inspect
- name: slug for output YAML (defaults to URL slug)
- outDir: defaults to tests/ui/ux-specs
- viewport: e.g., 1280x800
- auth (optional):
- storage: path to .playwright/auth.json
- loginUrl: login page
- user: username/email
- pass: password
- userSelector / passSelector / submitSelector: CSS or role/testid selectors


## Steps
1) If `auth.storage` exists, reuse it. Otherwise, if `auth.loginUrl` and creds provided, navigate and log in, then save storage state.
2) Navigate to target `url`, wait for networkidle.
3) Collect candidate elements:
- data-testid attributes → element ids
- role=button, headings (h1/h2/h3), inputs → locators
4) Generate `elements` array with unique ids and locators.
5) Generate minimal `assertions` (e.g., visible heading).
6) Add default acceptance with one screenshot (page.png).
7) If YAML already exists at `outDir/name.yaml`, merge new findings (non-destructive).
8) Save/emit YAML.


## Output
- Path to YAML file (relative)
- Generated/merged YAML content
- Notes about assumptions or selectors