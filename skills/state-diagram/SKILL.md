---
name: paperchart-state-diagram
description: Render a state diagram (Mermaid `stateDiagram-v2` equivalent). Rounded-rect states laid out in layers by longest-path from the start pseudostate; back-edges (retry / reset transitions) drawn as loop-back arrows. Supports start (●) and end (⊙) pseudostates, labeled transitions, dashed transitions (error paths), and an accent state/transition.
license: MIT
metadata:
  parent: paperchart
  slug: state-diagram
  file: src/charts/StateDiagramChart.tsx
---

# paperchart &mdash; state diagram

States as rounded rectangles, transitions as curved arrows with event labels.
Automatic layered layout; cycles (retry / reset transitions) are drawn as
back-edges that don't distort the forward flow.

## When to use

- UI state machines (idle → loading → success / error).
- Request lifecycle diagrams.
- Game or protocol state transitions.

## Input shape

```json
{
  "data": {
    "direction": "LR",
    "states": [
      { "id": "init",    "label": "•",         "start": true },
      { "id": "idle",    "label": "idle",      "caption": "awaiting input" },
      { "id": "loading", "label": "loading",   "caption": "fetching data",  "accent": true },
      { "id": "ok",      "label": "success" },
      { "id": "err",     "label": "error",     "caption": "surface to user" },
      { "id": "end",     "label": "⊙",         "end": true }
    ],
    "transitions": [
      { "from": "init",    "to": "idle" },
      { "from": "idle",    "to": "loading", "label": "submit" },
      { "from": "loading", "to": "ok",      "label": "200",    "accent": true },
      { "from": "loading", "to": "err",     "label": "fail",   "dashed": true },
      { "from": "ok",      "to": "idle",    "label": "close" },
      { "from": "err",     "to": "idle",    "label": "retry" },
      { "from": "ok",      "to": "end",     "label": "exit" }
    ]
  }
}
```

## Pseudostates

- `start: true` renders a filled dot (●) instead of a rounded rect.
- `end: true` renders a filled dot with an outer ring (⊙).
- Give them an `id` and a placeholder `label` (e.g. "•" / "⊙"); the label is
  not drawn over pseudostates, only the symbol.

## Direction

`LR` (default) or `TD`. Works the same as flowchart.

## CLI

```bash
paperchart state-diagram -i data.json -o state.png
paperchart state-diagram --defaults -o state.png
```
