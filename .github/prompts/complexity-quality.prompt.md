---
name: "Complexity & Code Quality Pass"
description: "Identify complexity hotspots and propose/apply targeted refactors."
mode: agent
---

## Checklist
- Confirm assumptions about affected code paths and expected load.
- Measure complexity (cyclomatic or heuristic) of changed files.
- Flag: long functions (>50 LOC), excessive parameters, deep nesting, duplicate logic.
- **Hog in the wall**: scan for hidden/permanent resource drains (heavy queries in hot paths, polling timers, unnecessary observers, global event listeners, chatty network loops, large eager imports).
- Suggest refactors: function extraction, early returns, inversion of control, lazy-loading, memoization, backpressure, batching.
- Ensure lint/test pass; fix small issues automatically.

## Output
- Short table of hotspots and reasons.
- “Hog in the wall” findings with severity and remediation.
- Proposed refactors (risk level: low/med/high).
- Apply low-risk refactors and show patch.
- Close with Four C’s (Condition, Cause, Correction, Confirmation).