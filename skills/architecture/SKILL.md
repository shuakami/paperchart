---
name: paperchart-architecture
description: Render a system-architecture diagram. Services are grouped into labeled panels (client, edge, backend, data, observability, …); each panel stacks its services vertically. Connections draw smooth cubic bézier curves between services and can be marked accent, dashed, or bidirectional. Use for architecture posts, design documents, onboarding diagrams.
license: MIT
metadata:
  parent: paperchart
  slug: architecture
  file: src/charts/ArchitectureChart.tsx
---

# paperchart &mdash; architecture

Grouped service diagram. Each top-level group is a labeled panel with its own
header and caption; services stack inside the panel. Connections cross panel
boundaries and are drawn with smooth bézier curves plus arrowheads.

## When to use

- System architecture posts (client / edge / backend / data).
- Explaining request routing and data dependencies.
- Any layered system with grouping semantics.

## Input shape

```json
{
  "data": {
    "groups": [
      { "id": "client",  "label": "client",  "caption": "browser + native",
        "services": [
          { "id": "web",     "label": "web app",    "caption": "React SPA" },
          { "id": "mobile",  "label": "mobile",     "caption": "iOS + Android" }
        ]
      },
      { "id": "edge",    "label": "edge",    "caption": "global, stateless",
        "services": [
          { "id": "gateway", "label": "API gateway", "caption": "auth + rate limit", "accent": true }
        ]
      },
      { "id": "backend", "label": "backend", "caption": "regional, stateful",
        "services": [
          { "id": "search", "label": "search service" },
          { "id": "users",  "label": "users service" }
        ]
      }
    ],
    "connections": [
      { "from": "web",     "to": "gateway", "accent": true },
      { "from": "mobile",  "to": "gateway" },
      { "from": "gateway", "to": "search" },
      { "from": "gateway", "to": "users",   "dashed": true }
    ]
  }
}
```

## Connection options

- `label` — text rendered on the curve, with a bg-tinted box behind it.
- `accent: true` — draws in the theme accent.
- `dashed: true` — dashed stroke (optional, async, fallback path).
- `bidirectional: true` — arrowheads on both ends.

## Layout

- Groups are stacked left-to-right by order in the input.
- Services inside a group stack top-to-bottom.
- Group widths auto-distribute across the canvas; all groups share the same
  height (determined by the group with the most services).
- Labels on edges stagger along the path index so parallel fan-out edges
  (one gateway → many services) don't stack at the same midpoint.

## CLI

```bash
paperchart architecture -i data.json -o arch.png
paperchart architecture --defaults -o arch.png
```
