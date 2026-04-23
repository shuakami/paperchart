---
name: paperchart-delivery-panels
description: Render a three-up side-by-side panel comparison for architecture options or delivery variants. Each panel has a heading, a subtitle, a list of assets with their sizes, and a totals strip at the bottom. Exactly one panel is accented so the reader understands which option is recommended or which one the post will focus on.
license: MIT
metadata:
  parent: paperchart
  slug: delivery
  file: src/charts/Delivery.tsx
---

# paperchart &mdash; delivery panels

Three side-by-side cards used to compare architecture options or delivery strategies. The layout reads like a small decision matrix: same fields in each column, same vertical alignment, only the colour changes.

## When to use

- A/B/C architecture comparisons.
- Before / middle / after evolution stories in an engineering blog.
- "here are three ways to ship this; we chose column three" narratives.

## Visual rules

- One column uses `#C75F3C` fills on its asset rows; the other two stay neutral (`#D6B99B`). The accented column is the recommended or final choice.
- Every column shares the same subheading ("what the browser fetches on /docs", or equivalent) directly under the title so scanning across is frictionless.
- Each asset row has a label, a one-line detail in 62&nbsp;% opacity ink, and a right-aligned size in tabular numerals.
- Totals at the bottom: first-load total on the left, deferred total on the right. Only the accented column's first-load number is coloured.

## How to use

1. Edit `src/charts/Delivery.tsx`.
2. Adjust the three `Panel` invocations: title, subtitle, `accent: boolean`, `assets` list, and the one-line `note` at the bottom.
3. `npm run dev`, open `/#/delivery`.
4. `npm run snap` to render to `out/delivery.png`.
