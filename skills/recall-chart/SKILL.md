---
name: paperchart-recall-chart
description: Render a per-row dot plot with two or three overlapping dots per row, used to prove that two or more engines, queries or models return exactly the same set of results. Use when a blog post needs a compact visual for set-equality or Jaccard = 1.00 parity across variants.
license: MIT
metadata:
  parent: paperchart
  slug: recall
  file: src/charts/RecallChart.tsx
---

# paperchart &mdash; recall / parity chart

A thin dot plot with one row per query. Each row has three overlapping dots at the same x position; two are neutral, one is accented, and the caption to the right confirms that all three engines returned the same set.

## When to use

- Search engine / retrieval model parity claims.
- "all three variants return the same top-k" stories.
- Any time you need to show a Jaccard similarity of 1.00 without resorting to a table of numbers.

## Visual rules

- One row per test case. The label sits to the left, right-aligned.
- Three circles at the same x coordinate, vertically offset by 6&nbsp;px each, so they read as stacked. Two neutral, one accented.
- A thin `#E6DCCE` track line connects the left axis to the dot so the eye lands on the right row.
- The right-side caption (e.g. `5 hits · Jaccard 1.00 across all three engines`) confirms equality in plain English.
- Legend at the bottom lists the three variants with a single colour dot each; no lines, no boxes.

## How to use

1. Edit `src/charts/RecallChart.tsx`.
2. Replace the `QUERIES` array with your test cases.
3. Update the legend labels if your variants are not labelled "engine A / B / C".
4. `npm run dev`, open `/#/recall`.
5. `npm run snap` to render to `out/recall.png`.
