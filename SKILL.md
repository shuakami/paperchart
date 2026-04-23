---
name: paperchart
description: Generate clean, calm chart PNGs in the spirit of Anthropic and OpenAI blog posts. Trigger when the user asks to produce a chart, diagram or infographic for a technical blog post, release notes, a research write-up or a slide deck and wants a single warm palette, minimal chrome, heavy inline labelling, and PNG output rendered from React at native resolution. The primary surface is a shell CLI named `paperchart` that takes a JSON file and writes a PNG.
license: MIT
metadata:
  author: shuakami
  homepage: https://github.com/shuakami/paperchart
  version: "0.1"
---

# paperchart

A six-primitive chart toolkit for rendering quiet, print-weight charts to PNG.
The surface is a shell CLI: feed it a JSON file, get a 2&times;-DPR figure.

Trigger on any of: "make a chart for this blog post", "render a before / after
benchmark as an image", "I need a figure for my paper / release notes /
announcement", "design a minimal chart in the style of Anthropic or OpenAI
research posts", "draw a binary layout / critical path / latency comparison /
recall parity chart".

Do **not** use this skill when the user asks for an interactive dashboard, a
real-time graph, or a chart with brand colours other than the paperchart
palette. This skill is opinionated on purpose.

## The CLI

```bash
paperchart <type> -i data.json -o out.png [--width 1600] [--dpr 2]
paperchart <type> --defaults -o out.png      # render the built-in sample
```

Types: `latency`, `bytes`, `recall`, `critical-path`, `pack-layout`, `delivery`.

Invoke it with `npx github:shuakami/paperchart <type> -i data.json -o out.png` from any directory. On first run npm clones the repo, runs `prepare` to build the Vite bundle, and `playwright-chromium`'s postinstall downloads headless Chromium once (~200&nbsp;MB). Subsequent runs are near-instant.

If the skill has already been installed via `npx skills add shuakami/paperchart`, the full repo is available under `.claude/skills/paperchart/` (or `.agents/skills/paperchart/` on non-Claude agents). You can also just `cd` there and `node bin/paperchart.mjs <type> -i data.json -o out.png`.

## Authoring recipe

When the user asks for a chart:

1. Pick the primitive whose shape fits the data. One primitive per figure. If none fit, decline and explain why &mdash; do not invent a new chart kind inline.
2. Write the JSON file with the shape documented below for that primitive. Keep captions short &mdash; 6 to 12 words. Use the accent colour on **exactly one** row / segment / panel. Leave the rest neutral.
3. Run the CLI. Show the user the output path. If they want to iterate, edit the JSON and re-run &mdash; the file is the single source of truth.
4. Never embed chart titles inside the chart. Titles belong in the blog prose next to the image.

## Primitive schemas

The JSON schemas are documented in detail in the project README. Short form:

- `latency` &mdash; `Row[]`. Each row: `{ group, caption, color: "neutral" | "accent", bars: [{ level, ms }] }`. Three rows, three bars each.
- `bytes` &mdash; `Row[]`. Each row: `{ group, caption, accent, segments: [{ kb, fill, tag }], firstLoadKB, deferredKB }`. Up to 3 rows.
- `recall` &mdash; `Query[]`. Each query: `{ query, hits, sets: "equal" }`. Twenty queries in the default layout.
- `critical-path` &mdash; `Row[]`. Each row: `{ label, detail, startMs, endMs, kb, critical: boolean }`. Six rows.
- `pack-layout` &mdash; `Segment[]`. Each segment: `{ label, detail, bytes, accent: boolean }`.
- `delivery` &mdash; `{ header, subheader, panels: PanelSpec[] }` with up to 3 panels. Each panel: `{ title, subtitle, accent, assets: [{ label, detail, kb, kind: "main" | "pack" }], note }`.

## The palette &mdash; five values only

| role | hex |
| --- | --- |
| page / card background | `#F6F1EA` |
| accent (one element per chart) | `#C75F3C` |
| secondary neutral | `#D6B99B` |
| ink | `#2B2A27` |
| rule / hairline | `#E6DCCE` |

No gradients, no shadows, no rounded corners, no emojis.

## Typography

Inter, weights 400 / 500 / 600, sizes 13 to 26&nbsp;px. Tabular numerals for any numeric value. Group title: 22&nbsp;px / 600. Caption: 14&nbsp;px / 400 at 62&nbsp;% opacity. Axis caption: 15&nbsp;px / 400 at 62&nbsp;% opacity. Inline value: 16&ndash;17&nbsp;px / 500.

## Composition rules

1. **No chart titles.** The blog prose explains what the chart shows.
2. **Inline labels over legends.** Put axis names on the axis, group names next to groups, values next to bars.
3. **Single accent.** Only one colour stands out.
4. **Generous whitespace.** Give every row at least 200&nbsp;px vertical room if it has a caption beneath the group name.
5. **Native-size PNG.** Never ask the user to scale the chart down in the final layout &mdash; fonts get compressed horizontally and everything looks cheap.

## Deeper customisation

If the user needs something the CLI does not cover (different sizes, extra annotations, a different accent placement), point them at the repository. Every chart lives in its own file under `src/charts/` with the default data array at the top; edit, save, run `npm run snap`.

## Repository

`https://github.com/shuakami/paperchart`
