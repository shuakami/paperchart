---
name: paperchart-latency-chart
description: Render a grouped horizontal bar chart on a log-scaled x axis for latency percentiles (p50 / p95 / p99) across several options. Use when comparing query, request or function latencies across two or more variants where values span multiple orders of magnitude and you want the chart to read at a glance in a technical blog post.
license: MIT
metadata:
  parent: paperchart
  slug: latency
  file: src/charts/LatencyChart.tsx
---

# paperchart &mdash; latency chart

A grouped horizontal bar chart on a log-scaled x axis. Each group has a bold title, a short caption underneath, and three bars for p50 / p95 / p99 with the numeric value printed to the right of each bar.

## When to use

- Before / after latency comparisons.
- Side-by-side benchmarks of three or more engines.
- Any percentile distribution where the values span several orders of magnitude (log scale matters).

## Visual rules

- Log x axis with ticks at `0.01 · 0.1 · 1 · 10 · 100` (or the equivalent decade sequence for your data).
- One group is coloured with the accent (`#C75F3C`) &mdash; the one the reader should notice. Others stay neutral (`#D6B99B`).
- Value labels sit to the right of each bar with a short prefix like `p50   0.47 ms`. Tabular numerals so decimals line up.
- Corner annotation (top-right) carries the measurement context: platform, sample size, warmup count.

## How to use

1. Clone `shuakami/paperchart`, open `src/charts/LatencyChart.tsx`.
2. Replace the `ROWS` array with your groups. Each row has `group`, `caption`, `color: "neutral" | "accent"`, and three `bars` entries.
3. `npm run dev`, open `/#/latency` to preview.
4. `npm run snap` to render to `out/latency.png`.

The axis ticks and log domain are constants at the top of the file &mdash; edit if your distribution sits outside `[0.01, 100]`.
