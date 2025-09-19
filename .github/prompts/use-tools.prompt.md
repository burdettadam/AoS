---
name: "Use Tools Aggressively"
description: "Leverage Playwright, terminal, filesystem, and git for reliable outcomes."
mode: agent
---

# Tooling Rules
- Prefer tools for verification over assumptions.
- Confirm assumptions before executing fixes.
- For web UI: use **Playwright** to open `http://localhost:PORT`, query elements, click, wait for selectors, and take screenshots.
- For code quality: run linters/tests in the **terminal**.
- For changes: write files via the **filesystem** and commit via **git** on a short-lived branch.

# Required Steps Template
**Plan** → list intended tool calls.
**Assumptions** → state/confirm with user.
**Run** → execute commands / Playwright steps.
**Report** → paste concise logs and artifact paths.
**Patch** → show diffs for code changes.