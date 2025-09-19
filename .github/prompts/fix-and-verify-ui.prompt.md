---
name: "Fix & Verify UI (Playwright + ImageSorcery)"
description: "Create minimal fix, run Playwright, compare screenshots, and confirm no regressions."
mode: agent
---

## Workflow
- **Condition**: Summarize the user‑reported symptom; include repro steps.
- **Cause**: Run 5 Whys on likely root; confirm assumptions.
- **Correction**: Propose smallest effective code change + unit/visual test.
- **Confirmation**: Execute `/Sequential Flow – UI Debug` to verify.

## Constraints
- Keep patch diff small and reversible.
- Prefer aria‑role/testid selectors for stability.
- Cache artifacts under `tests/ui/__screenshots__`.
- Emit PR‑ready summary with links to artifacts.