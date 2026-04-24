---
name: paperchart-sequence
description: Render a sequence diagram (Mermaid `sequenceDiagram` equivalent). Actor boxes along the top, dashed lifelines descending, messages drawn as horizontal arrows in time order. Supports notes spanning one or more actors, reply arrows (dashed + open head), async arrows (open head, solid line), self-calls (right-hand loop), and an accent color for a single emphasized message.
license: MIT
metadata:
  parent: paperchart
  slug: sequence
  file: src/charts/SequenceChart.tsx
---

# paperchart &mdash; sequence

Classic request-flow sequence diagram. Actors across the top, time flowing
downward. Good for HTTP request flows, RPC traces, event interchanges.

## When to use

- API request / response flows across services.
- RPC traces with returns.
- Explaining ordering guarantees between concurrent actors.

## Input shape

```json
{
  "data": {
    "actors": [
      { "id": "client",  "label": "browser",  "caption": "web app" },
      { "id": "edge",    "label": "edge",     "caption": "CDN + runtime" },
      { "id": "origin",  "label": "origin",   "caption": "API server" }
    ],
    "steps": [
      { "kind": "msg",  "from": "client", "to": "edge",   "label": "GET /api/search" },
      { "kind": "note", "over": "edge",   "text": "parse and normalize query" },
      { "kind": "msg",  "from": "edge",   "to": "origin", "label": "lookup(q)", "accent": true },
      { "kind": "msg",  "from": "origin", "to": "edge",   "label": "18 hits", "reply": true },
      { "kind": "msg",  "from": "edge",   "to": "client", "label": "200 OK",  "reply": true }
    ]
  }
}
```

## Step kinds

- `{ "kind": "msg", "from", "to", "label?", "reply?", "async?", "accent?" }` —
  horizontal arrow. `reply: true` draws a dashed line with open arrowhead;
  `async: true` draws a solid line with open arrowhead; `accent: true` uses
  the theme accent color.
- `{ "kind": "note", "over": "actorId" | [idA, idB], "text": "..." }` — a note
  box over one actor, or spanning two.

## Self-calls

`from === to` draws a short loop to the right of the actor's lifeline, useful
for "validate" / "score" / "retry internally" steps.

## CLI

```bash
paperchart sequence -i data.json -o seq.png
paperchart sequence --defaults -o seq.png
```
