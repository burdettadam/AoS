---
name: "Review & Refactor"
description: "Perform a compact code review and apply safe refactors."
mode: agent
---

## Review Focus
- Correctness: edge cases, error paths.
- Maintainability: naming, cohesion, duplication, file layout.
- Performance: obvious N+1s, avoidable allocations.

## Actions
- Confirm assumptions about intent and expected behavior.
- Propose changes with brief justifications.
- Apply low-risk refactors and show a patch.
- Ensure tests still pass; if missing, add minimal tests.
- Wrap results in Four C’s (Condition → Cause → Correction → Confirmation).