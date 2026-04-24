---
name: paperchart-sankey
description: Render a two-column Sankey diagram. Source nodes on the left, target nodes on the right, flows drawn as smooth ribbons whose thickness encodes value. Use for traffic-source attribution, token-budget allocation, error-origin routing, and any allocation story where inputs split into outputs.
license: MIT
metadata:
  parent: paperchart
  slug: sankey
  file: src/charts/SankeyChart.tsx
---

# paperchart &mdash; sankey

Two columns. Source nodes on the left stack top-to-bottom proportional to their total out-flow. Target nodes on the right stack proportional to their total in-flow. Each flow is a B&eacute;zier ribbon between one source and one target; its thickness equals its value.

## When to use

- Traffic source &rarr; landing bucket attribution.
- Token allocation (query tokens &rarr; index postings vs. corrections vs. doc headers).
- Error routing (exception class &rarr; handler).

## Input shape

```json
{
  "data": {
    "sources": [
      { "key": "direct",  "label": "direct users",   "caption": "7.4M sessions/mo", "total": 7400000 },
      { "key": "organic", "label": "organic search", "caption": "Google + Bing",    "total": 8000000, "accent": true }
    ],
    "targets": [
      { "key": "docs", "label": "/docs", "caption": "reference" },
      { "key": "api",  "label": "/api",  "caption": "sdk + http" }
    ],
    "flows": [
      { "from": "direct",  "to": "docs", "value": 3800000 },
      { "from": "organic", "to": "docs", "value": 3050000 }
    ]
  }
}
```

## Visual rules

- One source or target node can carry `accent: true`; ribbons starting or ending there inherit the accent tint.
- Ribbons use multiply/darken blending so overlap is readable.
- Labels sit outside the column bars, never on the ribbons.

## CLI

```bash
paperchart sankey -i data.json -o sankey.png
paperchart sankey --defaults -o sankey.png
```
