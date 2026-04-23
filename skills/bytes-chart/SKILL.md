---
name: paperchart-bytes-chart
description: Render a stacked horizontal bar chart that splits a byte payload into a first-load block and a deferred block, separated by an explicit visible gap. Use when comparing delivery sizes across two or more options and you want to make it obvious that some bytes are on the critical path and others are not.
license: MIT
metadata:
  parent: paperchart
  slug: bytes
  file: src/charts/BytesChart.tsx
---

# paperchart &mdash; bytes chart

Stacked horizontal bars with an explicit gap that separates the first-load critical-path portion from the deferred portion. Each row has a title and a caption; each segment has a tag above or inside it with its size.

## When to use

- Bundle size breakdowns.
- Critical-path vs deferred resource splits.
- Comparing how a single payload is delivered across two or more architectures.

## Visual rules

- Solid segments sit on the critical path. Dashed segments are deferred and separated by a visible horizontal gap.
- "first-load critical path" and "deferred" band markers sit above the accented row, so the reader learns the convention from the accent example.
- Totals are printed on the right edge of each bar: `107 KB br · first-load critical path` + `0 KB deferred`.
- X axis is linear in KB and the caption ("bytes on the wire after brotli-11 compression, kilobytes") sits below the ticks.

## How to use

1. Edit `src/charts/BytesChart.tsx`.
2. Rewrite `ROWS`: each row has `group`, `caption`, `segments` (with `kb`, `fill`, `tag`, optional `dashed`), `firstLoadKB`, `deferredKB`, optional `deferredGap`.
3. `npm run dev`, open `/#/bytes`.
4. `npm run snap` to render to `out/bytes.png`.
