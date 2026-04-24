---
name: paperchart-grouped-bar
description: Render vertical bars arranged in groups for side-by-side categorical comparison. Use when each category has two or three values that deserve equal visual weight, for example "theoretical feasibility versus observed traffic", "model A versus model B across benchmarks", or "before versus after versus projection". Not for part-to-whole data.
license: MIT
metadata:
  parent: paperchart
  slug: grouped-bar
  file: src/charts/GroupedBarChart.tsx
---

# paperchart &mdash; grouped bar

Vertical bars grouped by category. Each category gets N bars side by side (one per series). Useful for paired or triple comparisons where each series matters on its own and the reader wants to compare heights directly.

## When to use

- Two or three series across five to eight categories.
- Any time bars should be read in absolute terms, not normalised.
- Avoid if series values span many orders of magnitude &mdash; prefer `slope` or `latency` (log scale).

## Input shape

```json
{
  "data": {
    "series": [
      { "key": "theoretical", "label": "theoretically feasible" },
      { "key": "observed",    "label": "observed in traffic" }
    ],
    "groups": [
      { "label": "computer & math", "values": { "theoretical": 94, "observed": 33 } },
      { "label": "office & admin",  "values": { "theoretical": 90, "observed": 22 } }
    ]
  }
}
```

## Visual rules

- Accent colour on the first series, secondary on the second.
- Value labels above every bar; x labels below each group.
- Five gridlines at 0 / 25 / 50 / 75 / 100 of `yMax`.
