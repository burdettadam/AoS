---
name: "UX Spec → Playwright Plan"
description: "Convert UX Spec YAML into Playwright MCP steps and minimal test code."
mode: agent
---

## Inputs
- The YAML produced by "/UI Spec – What to Test".

## Output
1) **Plan**: ordered list of Playwright MCP calls (goto, locator resolution, actions, expectations, screenshots).
2) **Code**: a Playwright test snippet (TS) respecting:
   - deterministic viewport
   - animation/transition suppression
   - role/testid-first locators
   - assertions mirrored from `assertions` and `acceptance`
   - screenshots to `tests/ui/__screenshots__/current`
3) **Assumptions to Confirm**: ports, routes, credentials, data readiness.
4) **Artifacts**: list of expected screenshots and their names.

## Rules
- Map `elements` → locator builders (`getByRole`, `getByTestId`, etc.).
- Map `actions` to Playwright steps; insert waits only when necessary.
- Emit `expect(...).toHaveScreenshot()` or `expect(image).toMatchSnapshot()` per acceptance.visual.
- Include skip notes for any unsupported assertion; suggest alternatives.