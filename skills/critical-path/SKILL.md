---
name: paperchart-critical-path
description: Render a Gantt-style horizontal timeline for a network or load waterfall, with named milestone markers (DOMContentLoaded, user interaction, etc.) and two-colour bars that separate critical-path resources from deferred ones. Use when a technical blog post needs to explain a first-load network waterfall or an asset loading strategy.
license: MIT
metadata:
  parent: paperchart
  slug: critical-path
  file: src/charts/CriticalPathChart.tsx
---

# paperchart &mdash; critical path timeline

A horizontal timeline. One row per resource. The x axis is milliseconds since navigation start. Bars on the critical path use the accent colour; deferred bars use the secondary neutral. Two vertical dashed markers label key moments (e.g. DOMContentLoaded, user opens search).

## When to use

- Explaining why a chunk sits on the critical path.
- Showing a before / after network waterfall.
- Visualising a deferred-load strategy where only a few resources block first paint.

## Visual rules

- Accent bars (`#C75F3C`) sit on the critical path. Neutral bars (`#D6B99B`) are deferred.
- Two dashed vertical markers at named x positions. Their labels live in a dedicated band above the plot so they never collide with row labels.
- Each row has a bold label, a 62&nbsp;%-opacity one-line detail below, and a right-side annotation `N KB br · M ms`.
- Totals strip on the right: `X KB br · N resources on critical path` vs `Y KB br · M resources deferred`.
- X-axis ticks every 100&nbsp;ms, caption underneath.

## How to use

1. Edit `src/charts/CriticalPathChart.tsx`.
2. Replace the `ROWS` array with your resources: `label`, `detail`, `startMs`, `endMs`, `kb`, `critical`.
3. Adjust the two marker constants (`DOMContentLoaded`, `user opens search`) to match your story.
4. `npm run dev`, open `/#/critical-path`.
5. `npm run snap` to render to `out/critical-path.png`.
