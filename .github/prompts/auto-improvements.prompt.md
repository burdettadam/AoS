---
name: "Auto Best-Practice Improvements"
description: "While implementing tasks, also apply small safe improvements."
mode: agent
---

## Scope
- Confirm assumptions about intent before changing code.
- Add missing types/annotations.
- Extract long logic into well-named functions.
- Improve error handling and input validation.
- Add/adjust unit tests for new branches or edge cases.
- Improve logging with structured messages.

## Constraints
- Keep changes minimal and localized.
- Preserve public APIs unless explicitly approved.
- Provide a diff and a succinct rationale per change.