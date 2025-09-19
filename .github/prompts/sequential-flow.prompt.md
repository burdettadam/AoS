---
name: "Sequential Flow – UI Debug"
description: "Plan and orchestrate UI debug steps across prompts/tools."
mode: agent
---

## Objectives
- Produce plan → generate/merge spec → execute → compare → decide → confirm.
- Enforce confirmations and Four C’s checkpoints.

## Sequence
1) PLAN: Build a step list using SequentialThinking MCP.
2) CALL: `/Generate UX Spec from URL` to scaffold or update spec YAML (auth-aware).
3) CALL: `/UX Spec → Playwright Plan` to generate test code/steps from the YAML.
4) CALL: `/Run UI Spec with Playwright` to execute and capture screenshots.
5) CALL: `/Screenshot Compare (ImageSorcery)` to compute diffs.
6) DECIDE: If diffs exceed thresholds or assertions fail, generate a minimal **Correction** patch and propose tests; else recommend updating baseline.
7) CONFIRMATION: Re‑run steps 4–5 to prove green. Document the Four C’s in the output.

## Output
- Plan, Evidence, Decision, Next steps.