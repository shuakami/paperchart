---
name: paperchart-treemap
description: Render a two-level squarified treemap (Bruls et al.). Top-level items carve the plot into rectangles whose area is proportional to `value`; per-item children further subdivide. Use for bundle-size composition, token-budget breakdowns, market-share stacks, and any hierarchical-proportion story.
license: MIT
metadata:
  parent: paperchart
  slug: treemap
  file: src/charts/TreemapChart.tsx
---

# paperchart &mdash; treemap

Classic squarified layout. Items are sorted by value, laid out row-by-row along the shorter side of the remaining rectangle, and the algorithm greedily extends a row while its worst aspect ratio improves. Optional per-item children subdivide that item's tile the same way.

## When to use

- JS / CSS bundle breakdown (`index.js` &rarr; frameworks vs. app code vs. vendor).
- Token-budget composition for a search index.
- Cost or resource allocation stacks.

## Input shape

```json
{
  "data": [
    {
      "label": "index tokens", "caption": "302 KB (brotli-11)", "value": 302, "accent": true,
      "children": [
        { "label": "tokens",    "value": 148 },
        { "label": "postings",  "value": 72 },
        { "label": "corrections","value": 54 },
        { "label": "doc headers","value": 28 }
      ]
    },
    {
      "label": "UI framework", "caption": "210 KB", "value": 210,
      "children": [
        { "label": "icons",  "value": 104 },
        { "label": "react",  "value": 48 },
        { "label": "theme",  "value": 32 },
        { "label": "router", "value": 26 }
      ]
    }
  ]
}
```

## Visual rules

- One top-level item can carry `accent: true` (filled with accent tint; its children use a lighter tint of the same hue).
- Minimum label area: text only renders if the tile is large enough to fit it without overlap.
- Children omitted when their parent tile is below a size threshold.

## CLI

```bash
paperchart treemap -i data.json -o treemap.png
paperchart treemap --defaults -o treemap.png
```
