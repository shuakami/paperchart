---
name: paperchart-calendar-heatmap
description: Render a GitHub-style calendar heatmap. A grid with 7 rows (weekdays) and 53 columns (ISO weeks). Each cell is one day, shaded by `value` using four-bucket opacity steps of the accent colour. Use for daily-activity grids, deployment-frequency maps, error-incidence calendars.
license: MIT
metadata:
  parent: paperchart
  slug: calendar-heatmap
  file: src/charts/CalendarHeatmapChart.tsx
---

# paperchart &mdash; calendar heatmap

52-53 columns &times; 7 rows. Columns are ISO weeks, rows are weekdays (Sun-Sat). Each square is one day, shaded by `value` using four-bucket opacity steps. Month labels sit above the grid; a small `less &hellip; more` legend sits at the bottom right.

## When to use

- Contribution / commit activity over a year.
- Deployment frequency or incident calendar.
- Any daily-count dataset spanning roughly one year.

## Input shape

```json
{
  "data": {
    "start": "2025-06-01",
    "buckets": 4,
    "days": [
      { "date": "2025-06-01", "value": 0 },
      { "date": "2025-06-02", "value": 3 },
      { "date": "2025-06-03", "value": 7 }
    ]
  }
}
```

Or just an array of `{ date, value }`:

```json
{ "data": [{ "date": "2025-06-01", "value": 0 }, { "date": "2025-06-02", "value": 3 }] }
```

## Visual rules

- Missing dates render as empty (zero-value) cells.
- Accent is applied to the highest bucket; lower buckets use tinted versions of the same hue.
- Month labels only above the first column of each month.

## CLI

```bash
paperchart calendar-heatmap -i data.json -o cal.png
paperchart calendar-heatmap --defaults -o cal.png
```
