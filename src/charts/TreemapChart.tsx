// Two-level treemap via the squarified algorithm. Top-level items tile the
// canvas; if an item has `children`, those are tiled inside its cell. One
// top-level item may be `accent: true` to get the highlight fill.
//
// data shape:
//   [
//     { label, value, caption?, accent?, children?: [{ label, value }] },
//     ...
//   ]

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Leaf = { label: string; value: number };
type Item = {
  label: string;
  value: number;
  caption?: string;
  accent?: boolean;
  children?: Leaf[];
};

type TreemapLayout = BaseLayout & {
  cellPadding?: number;
  innerPadding?: number;
  valueFormat?: (v: number) => string;
};

const DEFAULT_DATA: Item[] = [
  {
    label: "index tokens",
    value: 302,
    caption: "KB (brotli-11)",
    accent: true,
    children: [
      { label: "corrections", value: 54 },
      { label: "tokens",      value: 148 },
      { label: "postings",    value: 72 },
      { label: "doc headers", value: 28 },
    ],
  },
  {
    label: "UI framework",
    value: 210,
    caption: "KB",
    children: [
      { label: "react",   value: 48 },
      { label: "router",  value: 26 },
      { label: "theme",   value: 32 },
      { label: "icons",   value: 104 },
    ],
  },
  {
    label: "markdown renderer",
    value: 88,
    caption: "KB",
  },
  {
    label: "shared utils",
    value: 56,
    caption: "KB",
  },
  {
    label: "fonts subset",
    value: 44,
    caption: "KB",
  },
];

// Classic squarified treemap (Bruls et al.) — tiles `items` into the given
// rectangle, keeping per-cell aspect ratios as close to 1 as possible. Works
// in pixel-area units internally (values are pre-scaled so sum == rect area).
type Rect = { x: number; y: number; w: number; h: number };
type Tile = Rect & { item: Leaf | Item };
type Scaled = { a: number; item: Leaf | Item };

function worst(row: Scaled[], w: number): number {
  if (row.length === 0) return Infinity;
  let s = 0;
  let rMax = -Infinity;
  let rMin = Infinity;
  for (const r of row) {
    s += r.a;
    if (r.a > rMax) rMax = r.a;
    if (r.a < rMin) rMin = r.a;
  }
  const w2 = w * w;
  const s2 = s * s || 1;
  return Math.max((w2 * rMax) / s2, s2 / (w2 * rMin || 1));
}

function layoutRow(row: Scaled[], rect: Rect): { tiles: Tile[]; next: Rect } {
  const rowSum = row.reduce((a, b) => a + b.a, 0);
  const tiles: Tile[] = [];
  if (rect.w <= rect.h) {
    // horizontal row across full width, thickness = rowSum / rect.w
    const thick = rowSum / rect.w;
    let x = rect.x;
    for (const it of row) {
      const w = it.a / thick;
      tiles.push({ x, y: rect.y, w, h: thick, item: it.item });
      x += w;
    }
    return {
      tiles,
      next: { x: rect.x, y: rect.y + thick, w: rect.w, h: rect.h - thick },
    };
  } else {
    // vertical row across full height, thickness = rowSum / rect.h
    const thick = rowSum / rect.h;
    let y = rect.y;
    for (const it of row) {
      const h = it.a / thick;
      tiles.push({ x: rect.x, y, w: thick, h, item: it.item });
      y += h;
    }
    return {
      tiles,
      next: { x: rect.x + thick, y: rect.y, w: rect.w - thick, h: rect.h },
    };
  }
}

function squarify(items: (Leaf | Item)[], rect: Rect): Tile[] {
  if (items.length === 0 || rect.w <= 0 || rect.h <= 0) return [];
  const total = items.reduce((a, b) => a + b.value, 0);
  if (total <= 0) return [];
  const area = rect.w * rect.h;
  const queue: Scaled[] = [...items]
    .sort((a, b) => b.value - a.value)
    .map((it) => ({ a: (it.value / total) * area, item: it }));

  const out: Tile[] = [];
  let remaining = { ...rect };
  let row: Scaled[] = [];
  let i = 0;
  while (i < queue.length) {
    const next = queue[i];
    const shorter = Math.min(remaining.w, remaining.h);
    const withNext = [...row, next];
    const worstBefore = worst(row, shorter);
    const worstAfter = worst(withNext, shorter);
    if (row.length === 0 || worstAfter <= worstBefore) {
      row = withNext;
      i += 1;
    } else {
      const { tiles, next: rem } = layoutRow(row, remaining);
      out.push(...tiles);
      remaining = rem;
      row = [];
    }
  }
  if (row.length > 0) {
    const { tiles } = layoutRow(row, remaining);
    out.push(...tiles);
  }
  return out;
}

export default function TreemapChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Item[]>(data);
  const L = layout as TreemapLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const SOFT = th.secondarySoft ?? th.secondary;
  const ACC_SOFT = th.accentSoft ?? ACCENT;

  const items = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 48);
  const RIGHT = num(L.padding?.right, 48);
  const TOP = num(L.padding?.top, 56);
  const BOTTOM = num(L.padding?.bottom, 56);
  const pad = num(L.cellPadding, 6);
  const innerPad = num(L.innerPadding, 4);

  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;

  const tiles = squarify(items, { x: LEFT, y: TOP, w: plotW, h: plotH });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {tiles.map((t, i) => {
        const it = t.item as Item;
        const accent = !!it.accent;
        const fill = accent ? ACC_SOFT : SOFT;
        const innerFill = accent ? ACCENT : INK;
        const x = t.x + pad / 2;
        const y = t.y + pad / 2;
        const w = Math.max(0, t.w - pad);
        const h = Math.max(0, t.h - pad);

        // sub-tiles
        const subArea: Rect = {
          x: x + innerPad,
          y: y + 52,
          w: Math.max(0, w - innerPad * 2),
          h: Math.max(0, h - 60 - innerPad),
        };
        const subs = it.children && it.children.length > 0 && subArea.w > 60 && subArea.h > 40
          ? squarify(it.children, subArea)
          : [];

        return (
          <g key={`t-${i}`}>
            <rect x={x} y={y} width={w} height={h} fill={fill} />
            {/* label zone */}
            {h > 48 && w > 72 && (
              <g>
                <text x={x + 14} y={y + 24} fill={innerFill} fontSize={15 * fs} fontWeight={600}>
                  {it.label}
                </text>
                <text x={x + 14} y={y + 42} fill={innerFill} fontSize={12 * fs} opacity={0.75}>
                  {it.value}
                  {it.caption ? " " + it.caption : ""}
                </text>
              </g>
            )}
            {/* sub tiles */}
            {subs.map((st, si) => {
              const leaf = st.item as Leaf;
              return (
                <g key={`st-${i}-${si}`}>
                  <rect
                    x={st.x}
                    y={st.y}
                    width={Math.max(0, st.w - 2)}
                    height={Math.max(0, st.h - 2)}
                    fill={BG}
                    opacity={0.86}
                  />
                  {st.w > 70 && st.h > 30 && (
                    <g>
                      <text
                        x={st.x + 8}
                        y={st.y + 18}
                        fill={INK}
                        fontSize={12 * fs}
                        fontWeight={500}
                      >
                        {leaf.label}
                      </text>
                      <text
                        x={st.x + 8}
                        y={st.y + 34}
                        fill={MUTED}
                        fontSize={11 * fs}
                        className="tab-nums"
                      >
                        {leaf.value}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      {/* subtle outline around full plot region */}
      <rect
        x={LEFT + 0.5}
        y={TOP + 0.5}
        width={plotW - 1}
        height={plotH - 1}
        fill="none"
        stroke={RULE}
        strokeWidth={1}
      />
    </svg>
  );
}
