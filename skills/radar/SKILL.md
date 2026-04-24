---
name: paperchart-radar
description: Render a radar / spider chart with N axes and two-to-four series polygons. Use for model-capability profiles, product-feature comparisons, and any multi-axis before/after story where each axis has a shared 0-100 (or 0-`max`) scale.
license: MIT
metadata:
  parent: paperchart
  slug: radar
  file: src/charts/RadarChart.tsx
---

# paperchart &mdash; radar

Concentric rings mark the 0.25 / 0.5 / 0.75 / 1.0 steps of each axis. Each axis has a label at its tip and an optional caption (the benchmark / metric name). Each series is a closed polygon with small dots at axis intersections; one series can be accented and rendered on top with a thicker stroke.

## When to use

- Model capability profile across 6-10 evaluations.
- Product feature matrix where all axes share a 0-100 "coverage" scale.
- Before / after release comparison.

## Input shape

```json
{
  "data": {
    "axes": [
      { "key": "reasoning",    "label": "reasoning",    "caption": "GPQA Diamond", "max": 100 },
      { "key": "coding",       "label": "coding",       "caption": "SWE-bench",    "max": 100 },
      { "key": "terminal",     "label": "terminal",     "caption": "T-Bench 2.0",  "max": 100 }
    ],
    "series": [
      { "label": "previous release", "caption": "four months ago", "values": { "reasoning": 86, "coding": 62, "terminal": 58 } },
      { "label": "current release",  "caption": "accent", "accent": true, "values": { "reasoning": 94, "coding": 75, "terminal": 82 } }
    ]
  }
}
```

## Visual rules

- Axes always start at 12 o'clock and go clockwise.
- Accent series always drawn last so its polygon sits on top.
- At most 4 series before legibility suffers.

## CLI

```bash
paperchart radar -i data.json -o radar.png
paperchart radar --defaults -o radar.png
```
