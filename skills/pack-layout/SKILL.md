---
name: paperchart-pack-layout
description: Render a three-panel byte-layout diagram for a binary file format. Panel one shows the proportional byte share of each section, panel two shows a bit-level header breakdown with labelled bits, and panel three shows a full left-to-right entry layout. Use when a technical blog post needs to explain how a custom binary format is packed on disk or in memory.
license: MIT
metadata:
  parent: paperchart
  slug: pack-layout
  file: src/charts/PackLayout.tsx
---

# paperchart &mdash; pack layout

A one-page explanation of a binary format. Three stacked panels:

1. **Proportional section bar.** Horizontal strip, each section sized by its share of the total. The accented section is the one the reader should think about.
2. **Bit-level header breakdown.** Eight boxes, one per bit. Type bits get the accent; length bits stay neutral. Each group has a caption naming it and a sub-caption explaining the encoding.
3. **Entry layout, left to right.** The anatomy of a single record in the format, with a bold name and a monospace sub-line for each field.

## When to use

- Documenting a custom wire format.
- Explaining a varint / tag / length encoding.
- Showing how a packed index, page, or block is laid out in storage.

## Visual rules

- Proportional section bar has the accented section filled with `#C75F3C`, others with `#D6B99B`. Inside the accent, the foreground text flips to the page background (`#F6F1EA`) for contrast.
- Bit boxes use a fixed 110&nbsp;px square with 12&nbsp;px gaps; the letters are 48&nbsp;px / 600 for legibility.
- The full entry strip uses the same two colours; the first field (header byte) is always accented because it drives everything after it.

## How to use

1. Edit `src/charts/PackLayout.tsx`.
2. Replace `SEGMENTS` with your sections; replace the eight-bit array in the header panel; replace the five-field entry strip at the bottom.
3. `npm run dev`, open `/#/pack-layout`.
4. `npm run snap` to render to `out/pack-layout.png`.
