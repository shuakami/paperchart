---
name: paperchart-table
description: Render a comparison table in the spirit of Anthropic and OpenAI model-release posts. Use when comparing two or more models, configurations, vendors or tiers across a shared set of numeric or textual columns. Supports column groups (capability / evaluation / pricing), right-aligned numerics, one highlighted "current" row, and per-column unit suffixes.
license: MIT
metadata:
  parent: paperchart
  slug: table
  file: src/charts/TableChart.tsx
---

# paperchart &mdash; comparison table

A horizontally laid out comparison table. Rows are the things being compared; columns are the shared dimensions; an optional column group band sits on top. Exactly one row carries a left-edge accent rail &mdash; that row is the focal subject.

## When to use

- Side-by-side model comparisons (context length, latency, evals, pricing).
- Plan or tier tables on a product page.
- Any time a reader needs to look up a single value at the intersection of a row and a column.

## Input shape

```json
{
  "data": {
    "columns": [
      { "key": "context",  "label": "context",     "align": "right", "unit": "K",   "group": "capability" },
      { "key": "latency",  "label": "p50 latency", "align": "right", "unit": "ms",  "group": "capability" },
      { "key": "coding",   "label": "coding",      "align": "right", "unit": "%",   "group": "evaluation" },
      { "key": "price_in", "label": "input",       "align": "right", "unit": "$/M", "group": "pricing" }
    ],
    "rows": [
      { "label": "previous generation", "caption": "q1 2025", "values": { "context": 200, "latency": 820, "coding": 74.3, "price_in": 3 } },
      { "label": "current model",       "caption": "q1 2026", "highlight": true, "values": { "context": 400, "latency": 310, "coding": 82.7, "price_in": 3 } }
    ]
  }
}
```

## Visual rules

- Exactly one row with `highlight: true`. That row gets a panel background and the accent rail.
- Numeric columns right-aligned. Decimal precision picked automatically by the renderer.
- Column groups drawn as a single muted label over a thin divider.
- No cell borders, no zebra striping.
