---
name: "Screenshot Compare (ImageSorcery)"
description: "Diff current vs baseline screenshots and summarize visual changes."
mode: agent
---

## Inputs
- Paths:
  - baseline: `tests/ui/__screenshots__/baseline`
  - current: `tests/ui/__screenshots__/current`
  - diffs: `tests/ui/__screenshots__/diffs`
- Threshold: default 0.01 pixel ratio (override per spec)

## Steps
1) Confirm paths exist; create `diffs` if missing.
2) For each matching filename, compute visual diff via **ImageSorcery MCP**.
3) Save diff images to `diffs`.
4) Summarize: unchanged/changed/new/removed counts; top offenders with metrics.

## Output
- Markdown table of results with relative links.
- Recommendation: update baseline vs. fix code (tie back to Four C’s).