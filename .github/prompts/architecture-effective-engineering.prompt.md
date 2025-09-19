---
name: "Architecture – Effective Engineering"
description: "Design or refactor architecture using simplify→remove→simplify→accelerate→automate."
mode: agent
---

## Inputs
- Problem statement and non-negotiable constraints.
- Current system/context and pain points.
- Success metrics (latency, throughput, MTTR, cost, DX).

## Method (document each step)
1) **Simplify/Optimize Requirements**
   - Why do we need each requirement?
   - Is it for *form* or *function*? Remove form-only items.
2) **Remove Parts/Processes**
   - Why do we need each component/step?
   - Map each to a requirement function; delete the rest.
3) **Simplify/Optimize Design (Round 2)**
   - Merge responsibilities, reduce modes, standardize interfaces.
4) **Accelerate**
   - Sequence work for fast feedback; isolate risk; choose boring tech where possible.
5) **Automate**
   - Add scaffolds, CI checks, golden paths, codemods, templates.

## Deliverables
- Context diagram + data flow.
- ADRs for key decisions (trade-offs, rejected options).
- MVP slice plan with measurable checkpoints.
- Risk register + mitigation.
- Guardrails: tests, alerts, budgets, SLOs.