---
name: paperchart-stacked-bar
description: Render a horizontal stacked bar chart showing how each category decomposes into parts that sum to 100 percent (or a fixed total). Use for composition questions like "what fraction of jobs in each industry are fully automated versus assistive", "usage breakdown by product surface", or "revenue by segment" where there are three to five segments per row.
license: MIT
metadata:
  parent: paperchart
  slug: stacked-bar
  file: src/charts/StackedBarChart.tsx
---

# paperchart &mdash; stacked bar

One bar per row, each bar composed of segments that sum to 100% (or to a free-form total). The first segment takes the accent colour; the rest fall back to secondary and soft-secondary tokens.

## When to use

- Composition per category.
- Part-to-whole when the whole is the same across rows.
- Avoid if you need to compare absolute totals &mdash; use `grouped-bar` instead.

## Input shape

```json
{
  "data": [
    {
      "label": "computer & math",
      "caption": "software, data, research",
      "segments": [
        { "key": "fully automated", "value": 41 },
        { "key": "assistive",       "value": 34 },
        { "key": "not observed",    "value": 25 }
      ]
    }
  ]
}
```

## Visual rules

- Up to three segment keys, shared across all rows.
- Legend at the top left of the plot, aligned with bar start.
- Value label inside each segment when the segment is wider than ~56px.
- Unit suffix default is `%`; override via `layout.unit`.
