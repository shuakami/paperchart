---
name: paperchart-funnel
description: Render a conversion funnel with stage bars whose widths are proportional to count, drop-off annotations between stages, and a final accented bar for the terminal stage. Use for acquisition / activation funnels, feature adoption funnels, and search-result click-through analysis.
license: MIT
metadata:
  parent: paperchart
  slug: funnel
  file: src/charts/FunnelChart.tsx
---

# paperchart &mdash; funnel

Stages stack vertically. Bar width is proportional to count. The last stage gets the accent. To the right of each subsequent stage, the renderer shows survival rate and absolute loss vs. the previous stage.

## When to use

- Acquisition funnels (visit &rarr; signup &rarr; activation &rarr; retention).
- Feature funnels (search opened &rarr; query submitted &rarr; result clicked &rarr; page consumed).
- Any multi-step conversion narrative.

## Input shape

```json
{
  "data": [
    { "label": "landing view",    "caption": "any /docs page",      "count": 14230000 },
    { "label": "search opened",   "caption": "\u2318K or / pressed", "count": 4610000 },
    { "label": "query submitted", "caption": "at least one keystroke", "count": 3980000 },
    { "label": "result clicked",  "caption": "first 10 hits",       "count": 2730000 },
    { "label": "page consumed",   "caption": "scrolled past fold",  "count": 1820000, "accent": true }
  ]
}
```

## Visual rules

- Counts auto-formatted with K / M / B suffix.
- Accent only on the final bar unless explicitly overridden.
- Drop-off percentage and absolute loss rendered to the right of each stage after the first.

## CLI

```bash
paperchart funnel -i data.json -o funnel.png
paperchart funnel --defaults -o funnel.png
```
