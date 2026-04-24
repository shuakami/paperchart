---
name: paperchart-flowchart
description: Render a flowchart (Mermaid `flowchart TD` / `LR` equivalent). A directed graph of labeled nodes with decision diamonds, stadium terminals, cylinder stores, and orthogonal edges. The layout is a layered DAG computed from the longest forward path; back-edges (cycles / retries) are detected and drawn as loop-back arrows so the forward flow stays clean.
license: MIT
metadata:
  parent: paperchart
  slug: flowchart
  file: src/charts/FlowchartChart.tsx
---

# paperchart &mdash; flowchart

Layered flowchart. Nodes pick from five shapes; edges are orthogonal with triangular arrowheads; optional per-edge labels sit on the bend with a small bg-tinted box so they read over any crossing line.

## When to use

- Request / response pipelines with decisions.
- Retrieval, indexing, or build pipelines with retry branches.
- Any DAG where shape conveys role (terminal vs. decision vs. process vs. store).

## Input shape

```json
{
  "data": {
    "direction": "TD",
    "nodes": [
      { "id": "q",     "label": "user query",     "shape": "stadium" },
      { "id": "norm",  "label": "normalize",      "caption": "lower + nfc", "shape": "rect" },
      { "id": "cache", "label": "cache hit?",     "shape": "diamond" },
      { "id": "idx",   "label": "fetch pack",     "caption": "brotli decode", "shape": "cylinder" },
      { "id": "score", "label": "score + rank",   "shape": "rect", "accent": true },
      { "id": "out",   "label": "render results", "shape": "stadium" }
    ],
    "edges": [
      { "from": "q",     "to": "norm" },
      { "from": "norm",  "to": "cache" },
      { "from": "cache", "to": "idx",   "label": "no" },
      { "from": "cache", "to": "out",   "label": "yes" },
      { "from": "idx",   "to": "score" },
      { "from": "score", "to": "out" }
    ]
  }
}
```

## Node shapes

| shape      | use for                         |
|------------|----------------------------------|
| `stadium`  | start / end terminals            |
| `rect`     | process steps (default)          |
| `round`    | soft-edged process steps         |
| `diamond`  | decisions (yes / no, match / no) |
| `cylinder` | data stores (index, cache, db)   |

## Accents

- `node.accent: true` — outlines the node in accent and fills with `panel` tint.
- `edge.accent: true` — colors the arrow in accent (e.g. the happy path).
- `edge.dashed: true` — dashed line (retry, fallback, feedback edge).

## Direction

`TD` (top-down, default) or `LR` (left-to-right). The layout recomputes layers
accordingly; the back-edge detector is direction-agnostic.

## CLI

```bash
paperchart flowchart -i data.json -o flow.png
paperchart flowchart --defaults -o flow.png
```
