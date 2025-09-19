---
name: "Run UI Spec with Playwright"
description: "Execute the UI spec with Playwright MCP: navigate, act, assert, screenshot."
mode: agent
---

## Inputs
- The YAML from "UI Spec – What to Test" (or the plan from "UX Spec → Playwright Plan").

## Plan
1) Confirm assumptions (ports, routes, credentials).
2) Start/verify app per `setup`.
3) Set viewport; disable animations if possible.
4) Execute actions and assertions.
5) Save screenshots to `tests/ui/__screenshots__/current`.
6) Emit a short run report with artifact paths.

## Tool Calls
- Use **Playwright MCP** for page ops and screenshots.
- Use **Terminal** for startup/seed commands.

## Output
- Report: pass/fail per step
- Screenshot file list
- Logs needed for triage