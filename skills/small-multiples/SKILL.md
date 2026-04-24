---
name: paperchart-small-multiples
description: Render a grid of identical-shape sparklines, one per subject, for scanning trends across many subjects at once. Use when the reader should compare the shape of a time series across nine to twelve subjects and individual panels do not need axis ticks. Ideal for adoption curves, coverage by occupation, or per-region metrics.
license: MIT
metadata:
  parent: paperchart
  slug: small-multiples
  file: src/charts/SmallMultiplesChart.tsx
---

# paperchart &mdash; small multiples

A grid of panels (default 3 columns). Every panel has the same shape, the same y-range, the same x-range. Labels sit at the top of each panel; the final value is printed at the top-right. Exactly one panel uses the accent.

## When to use

- Trend comparisons across six to twelve subjects.
- When individual panels do not need axes &mdash; the reader scans the overall shape, not exact values.
- Prefer over `line` when you have more than four series and overplotting would hurt readability.

## Input shape

```json
{
  "data": {
    "xLabels": ["'20", "'21", "'22", "'23", "'24", "'25", "'26"],
    "unit": "%",
    "panels": [
      { "label": "computer programmers", "caption": "coverage trend", "values": [6,10,22,34,55,70,75], "accent": true },
      { "label": "customer service",     "values": [4,8,18,28,44,58,62] }
    ]
  }
}
```

## Visual rules

- Shared y-axis across all panels so shapes are directly comparable.
- First and last x labels only; nothing in between.
- Final value printed top-right, colored by the series.
- Exactly one panel with `accent: true`.
