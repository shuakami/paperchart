# paperchart

Clean chart PNGs for technical blog posts. One command in, one image out.

```bash
npx github:shuakami/paperchart latency -i data.json -o latency.png
```

Or install as an open agent skill so Claude Code, Cursor, Codex and Gemini can pick the style up automatically:

```bash
npx skills add shuakami/paperchart
```

Six chart primitives, a single warm palette, a headless-Chromium pipeline that renders every figure at 2&times;-DPR. Designed to be driven by AI agents &mdash; feed it a structured JSON file, get a figure you can ship.

---

## Quick start

```bash
# pick any chart type, point it at JSON, name the output:
npx github:shuakami/paperchart latency -i data.json -o out/latency.png
npx github:shuakami/paperchart bytes   -i data.json -o out/bytes.png
npx github:shuakami/paperchart recall  -i data.json -o out/recall.png

# render a sample without writing any JSON first:
npx github:shuakami/paperchart latency --defaults -o sample.png
```

The CLI starts a tiny local HTTP server, renders the React view inside headless Chromium, screenshots it, and exits. No dev server to run, no `npm install` inside your project, no React editing.

**First run** downloads the Chromium binary (~200&nbsp;MB). Re-runs are fast.

## The chart primitives

| slug | what it is | good for |
| --- | --- | --- |
| `latency` | grouped horizontal bars, log-scaled x axis | before / after distributions, percentile comparisons |
| `bytes` | stacked horizontal bars with an explicit gap | splitting a payload into a first-load block and a deferred block |
| `pack-layout` | byte-level composition + bit header | explaining a binary format on a single page |
| `delivery` | three-up panel comparison | architecture options where only one variant is emphasised |
| `recall` | per-row dot plot with overlapping markers | showing that two or more engines return the same result set |
| `critical-path` | horizontal timeline with named milestones | network waterfalls, deferred vs blocking resources |

Hit each live at [shuakami.github.io/paperchart](https://shuakami.github.io/paperchart/).

## JSON schemas

Every type takes a single JSON document. Numbers stay raw; the renderer handles units, alignment, colour.

### `latency` &mdash; `Row[]`

```jsonc
[
  {
    "group": "baseline",
    "caption": "fuzzy scoring over the JSON index shipped inside the chunk",
    "color": "neutral",            // "neutral" | "accent"
    "bars": [
      { "level": "p50", "ms": 13.32 },
      { "level": "p95", "ms": 23.94 },
      { "level": "p99", "ms": 25.41 }
    ]
  },
  { "group": "inverted index",   "caption": "...", "color": "neutral", "bars": [ /* ... */ ] },
  { "group": "externalized pack", "caption": "...", "color": "accent",  "bars": [ /* ... */ ] }
]
```

Row count is fixed at 3 in v0.1.

### `bytes` &mdash; `Row[]`

```jsonc
[
  {
    "group": "baseline",
    "caption": "index + pages JSON inlined as a string literal inside the JS chunk",
    "accent": false,
    "segments": [
      { "kb": 87, "fill": "neutral", "tag": "JSON index + pages" },
      { "kb": 20, "fill": "neutral", "tag": "runtime + UI glue" }
    ],
    "firstLoadKB": 107,
    "deferredKB": 0
  }
  // up to 3 rows
]
```

`fill` accepts `"neutral"` or `"accent"` (or a hex string, for escape hatches).

### `recall` &mdash; `Query[]`

```jsonc
[
  { "query": "weather", "hits": 5, "sets": "equal" },
  { "query": "bilibili", "hits": 7, "sets": "equal" },
  { "query": "图片",     "hits": 12, "sets": "equal" }
  // 20 queries in the default layout
]
```

### `critical-path` &mdash; `Row[]`

```jsonc
[
  { "label": "index.html",       "detail": "server-rendered document shell", "startMs": 0,   "endMs": 40,  "kb": 4,  "critical": true },
  { "label": "framework runtime","detail": "React runtime chunk",            "startMs": 30,  "endMs": 140, "kb": 48, "critical": true },
  { "label": "/search-pack.bin", "detail": "fetched only when user searches","startMs": 620, "endMs": 760, "kb": 78, "critical": false }
]
```

6 rows in the default layout.

### `pack-layout` &mdash; `Segment[]`

```jsonc
[
  { "label": "Docs",        "detail": "id, title, url, summary",                  "bytes": 51842,  "accent": false },
  { "label": "Tokens",      "detail": "type flag + bytes + posting deltas",       "bytes": 212908, "accent": true  },
  { "label": "Corrections", "detail": "spell-correction candidates",              "bytes": 37270,  "accent": false }
]
```

### `delivery` &mdash; panel spec

```jsonc
{
  "header": "how search reaches the browser",
  "subheader": "same corpus, three delivery shapes",
  "panels": [
    {
      "title": "baseline",
      "subtitle": "JSON index + pages inlined inside the JS chunk",
      "accent": false,
      "assets": [
        { "label": "docs JS chunk", "detail": "pages JSON + index + UI", "kb": 87, "kind": "main" },
        { "label": "runtime",       "detail": "shipped in the same chunk", "kb": 20, "kind": "main" }
      ],
      "note": "Index, scorer and UI all travel together in the first-paint payload."
    }
    // up to 3 panels
  ]
}
```

## CLI flags

```
paperchart <type> -i data.json -o out.png [options]

  -i, --input <path>    Path to JSON input.
  -o, --output <path>   Path to PNG output.
      --defaults        Render the built-in sample (skip -i).
  -w, --width <px>      Viewport width in CSS pixels. Default 1600.
      --dpr <factor>    Device pixel ratio. Default 2.
      --help            Print usage.
```

## Palette

| hex | role |
| --- | --- |
| `#F6F1EA` | page background |
| `#C75F3C` | accent (exactly one element per chart) |
| `#D6B99B` | secondary neutral |
| `#2B2A27` | ink |
| `#E6DCCE` | rules / hairlines |

No gradients, no shadows, no rounded corners. Inline labels beat titles.

## Deeper customisation

If you need something the CLI does not cover &mdash; different sizes, an extra annotation layer, a different colour &mdash; clone the repo and edit the TSX directly:

```bash
git clone https://github.com/shuakami/paperchart.git
cd paperchart
npm install
npm run dev          # live preview at http://127.0.0.1:5173/
npm run snap         # render every chart to ./out/*.png
```

Each chart lives in its own file under [`src/charts/`](./src/charts); the default data array is at the top. Edit the numbers, save, open the URL &mdash; everything re-renders.

## Installing as an agent skill

This repo follows the [agentskills.io specification](https://agentskills.io/specification): a root [`SKILL.md`](./SKILL.md) teaches agents the overall style and how to call the CLI; focused per-chart skills live under [`skills/`](./skills).

```bash
npx skills add shuakami/paperchart
```

After install, the skill is visible to Claude Code, Cursor, Codex, Gemini CLI and anything else that loads SKILL.md files from `.agents/skills/` or `.claude/skills/`. Agents will know the palette, the typography rules, the six chart shapes, and how to call `paperchart` from the shell.

## License

MIT &copy; [shuakami](https://github.com/shuakami)
