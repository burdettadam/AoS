---
name: "UI Spec – What to Test"
description: "Produce a minimal, testable spec for the target UI behavior."
mode: agent
---

## Goal
Create a compact, testable spec for the UI scenario under investigation.

## Output (YAML UX Spec)
- intent: short description of goal/outcome
- personas: roles relevant to the flow (e.g., guest, admin)
- routes: list of URLs/paths to visit in order
- setup:
  - start: shell commands to run app/services
  - seed: data setup or fixtures
- viewport: width x height (e.g., 1280x800)
- elements:
  - id: logical name (e.g., loginButton)
  - locator:
    - by: role|testid|text|css|xpath
    - value: e.g., role=button[name="Login"] or [data-testid="login-btn"]
- actions: ordered steps
  - use: <element id>
  - do: click|type|hover|waitFor|press
  - value: (optional) text/keys
  - expect: (optional) assertion id
- assertions:
  - id: logical name
  - type: visible|text|count|attribute|url|response
  - target: <element id or url>
  - value: expected text/regex/number/attribute
- acceptance:
  - functional: list of assertion ids that must pass
  - visual:
    - shots:
      - name: filename.png
      - selector: optional element id for element screenshot
      - tolerance: 0.01
- data: test user creds, ids, fixture refs
- accessibility: checks (role presence, aria states)
- nonfunctional: perf budgets (TTI, LCP proxy), error logs must be empty
- flake_controls: networkidle wait, disable animations CSS, retries: 1
- notes: risks, unknowns to confirm

## Constraints
- Prefer role-based or data-test selectors; avoid brittle text unless stable.
- Keep < 10 steps; smallest path to proof.
- Confirm assumptions and list unknowns.