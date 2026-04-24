---
name: paperchart-table
description: Render a model / product / tier comparison table in the spirit of Anthropic and OpenAI release posts. Columns are the subjects being compared (models, vendors, tiers); rows are metrics. One focal column gets a tinted panel background; per-row winner is auto-bolded; cells can carry a secondary caption ("no tools" / "with tools" / "Pro").
license: MIT
metadata:
  parent: paperchart
  slug: table
  file: src/charts/TableChart.tsx
---

# paperchart &mdash; comparison table

Columns are the subjects being compared, rows are the metrics. Exactly one column is `highlight: true` and gets the panel tint. Any per-row winner is auto-bolded.

## When to use

- Side-by-side model comparisons across evaluations.
- Plan / tier tables on a product page.
- Any side-by-side comparison where one column should stand out.

## Input shape

```json
{
  "data": {
    "groups": [
      { "key": "own", "label": "our releases", "columns": ["opus_47", "opus_46"] },
      { "key": "other", "label": "other labs",  "columns": ["gpt54", "gemini31"] }
    ],
    "columns": [
      { "key": "opus_47",  "label": "Opus 4.7",    "highlight": true },
      { "key": "opus_46",  "label": "Opus 4.6" },
      { "key": "gpt54",    "label": "GPT-5.4",   "muted": true },
      { "key": "gemini31", "label": "Gemini 3.1 Pro", "muted": true }
    ],
    "rows": [
      {
        "label": "Agentic coding",
        "caption": "SWE-bench Pro",
        "unit": "%",
        "cells": {
          "opus_47":  { "value": 64.3 },
          "opus_46":  { "value": 53.4 },
          "gpt54":    { "value": 57.7 },
          "gemini31": { "value": 54.2 }
        }
      },
      {
        "label": "Multidisciplinary reasoning",
        "caption": "Humanity's Last Exam",
        "unit": "%",
        "cells": {
          "opus_47":  [{ "value": 46.9, "sub": "no tools" }, { "value": 54.7, "sub": "with tools" }]
        }
      }
    ]
  }
}
```

## Visual rules

- Exactly one column with `highlight: true`; others neutral. `muted: true` columns render at reduced opacity.
- Per-row winner detection: largest numeric value across the row is bolded.
- Numeric cells right-aligned. `—` for missing values.
- Optional column groups drawn as a single caption band across the header.
- No cell borders, no zebra striping, no accent rail on the focal column.

## CLI

```bash
paperchart table -i data.json -o table.png
paperchart table --defaults -o table.png
```
