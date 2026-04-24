---
name: paperchart-box-plot
description: Render a horizontal box-and-whisker plot for 2-8 rows. Each row shows min / q1 / median / q3 / max plus optional outlier dots. Supports linear or log x-axis. Use for latency-distribution comparisons across services, model-inference time distributions, or any five-number-summary side-by-side.
license: MIT
metadata:
  parent: paperchart
  slug: box-plot
  file: src/charts/BoxPlotChart.tsx
---

# paperchart &mdash; box plot

Rows stack vertically. Each row is the five-number summary `(min, q1, median, q3, max)` drawn as a horizontal box with whiskers; outliers are small open circles beyond the whiskers. One row can carry `accent: true` and is drawn in the accent colour.

## When to use

- Latency distribution comparison (p50 / p75 / p99 / max per build).
- Error-rate distribution across regions / services.
- Pre- / post-optimization latency deltas.

## Input shape

```json
{
  "data": {
    "axis": { "scale": "log", "label": "ms" },
    "rows": [
      {
        "label": "legacy runtime", "caption": "fuzzy scorer",
        "min": 3.2, "q1": 9.4, "median": 14.6, "q3": 23.1, "max": 62.0,
        "outliers": [82, 95, 120]
      },
      {
        "label": "externalized pack", "caption": "brotli-11, accent",
        "min": 0.32, "q1": 0.45, "median": 0.61, "q3": 0.87, "max": 1.9,
        "outliers": [3.1, 4.2],
        "accent": true
      }
    ]
  }
}
```

## Visual rules

- Log or linear x-axis. Tick labels on the bottom only.
- Median drawn as a thicker inner line inside the box.
- Right gutter shows median and p75 in tabular numerals.

## CLI

```bash
paperchart box-plot -i data.json -o box-plot.png
paperchart box-plot --defaults -o box-plot.png
```
