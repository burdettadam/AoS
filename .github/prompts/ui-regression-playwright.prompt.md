---
name: "UI Regression via Playwright"
description: "Run Playwright to capture/cached screenshots and compare to baseline."
mode: agent
---

## Directives
- Confirm assumptions: which routes/UI elements matter.
- Boot the app locally (document assumed start command or ask).
- Use Playwright to:
  1. Navigate to the impacted route(s), waiting for network idle.
  2. Take deterministic screenshots (set viewport, disable animations if possible).
  3. Write current screenshots to `tests/ui/__screenshots__/current`.
  4. If `baseline` exists, compare and save diffs to `tests/ui/__screenshots__/diffs`.
  5. If `baseline` missing, copy current → `baseline` and note that future runs will compare.
- Output a concise report listing changed/added/removed screenshots and diff thresholds.

## Debugging Link
Follow the Four C’s:
- Condition: screenshot mismatch
- Cause: DOM/stylesheet change
- Correction: adjust code or update baseline
- Confirmation: rerun test → no diff