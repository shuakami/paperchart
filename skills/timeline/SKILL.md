---
name: paperchart-timeline
description: Render a horizontal timeline with swim-lanes for teams or workstreams, phase bars along a continuous time axis, and optional milestone markers. Use for roadmaps, release histories, migration plans, and any narrative that places events on a shared clock.
license: MIT
metadata:
  parent: paperchart
  slug: timeline
  file: src/charts/TimelineChart.tsx
---

# paperchart &mdash; timeline

Rows are tracks (team, workstream, service). Within a row, spans sit on a shared time axis; one span per row can be accented, and per-row milestone markers sit above the axis with a short label.

## When to use

- Product roadmaps or quarterly plans.
- Release history showing overlapping workstreams.
- Migration timelines showing cut-over points.

## Input shape

```json
{
  "data": {
    "axis": { "min": 0, "max": 24, "unit": "weeks" },
    "rows": [
      {
        "label": "retrieval",
        "caption": "indexing + query pipeline",
        "spans": [
          { "start": 0, "end": 7,  "label": "fuse scorer" },
          { "start": 7, "end": 13, "label": "inverted index v1" },
          { "start": 13, "end": 24, "label": "externalized pack", "accent": true }
        ],
        "milestones": [{ "at": 13, "label": "cut-over" }]
      }
    ]
  }
}
```

## Visual rules

- One accent span per row at most.
- Milestones rendered as small open circles with a short caption beneath.
- Time axis on the bottom only; no vertical grid lines inside rows.

## CLI

```bash
paperchart timeline -i data.json -o timeline.png
paperchart timeline --defaults -o timeline.png
```
