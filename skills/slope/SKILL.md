---
name: paperchart-slope
description: Render a two-point slope chart connecting a before and after value for each series. Use when showing movement over a single interval - a performance optimisation (baseline to rebuilt), a policy change (pre and post), or any paired comparison where the reader should instantly see which series improved the most.
license: MIT
metadata:
  parent: paperchart
  slug: slope
  file: src/charts/SlopeChart.tsx
---

# paperchart &mdash; slope

Two labelled columns. Each series is a line connecting its `start` value on the left column to its `end` value on the right column, with percentage change printed next to the right endpoint. Exactly one series accented.

## When to use

- Before / after for multiple metrics at once.
- Policy impact across several subjects.
- Prefer over `dumbbell` when the two points live on the same axis scale and the slope itself carries meaning.

## Input shape

```json
{
  "data": {
    "startLabel": "baseline",
    "endLabel": "rebuilt",
    "startCaption": "fuzzy scorer on inlined json",
    "endCaption": "varint index, streamed on demand",
    "unit": "ms",
    "series": [
      { "label": "p50 query", "start": 8.12, "end": 0.47, "accent": true },
      { "label": "p99 query", "start": 25.4, "end": 3.02 }
    ]
  }
}
```

## Visual rules

- Pick series whose magnitudes are broadly comparable. Mixing 320 ms and 2 ms squashes the low rows.
- Exactly one series `accent: true`.
- Right column shows both the end value and the percentage change, coloured by the series.
