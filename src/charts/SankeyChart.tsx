// Two-column Sankey / flow diagram. Each source node flows into one or more
// target nodes; stroke width is proportional to flow magnitude. Targets are
// stacked on the right in input order. One source can be `accent: true` to
// highlight all flows originating from it.
//
// data shape:
//   { sources: [{ key, label, caption?, accent? }],
//     targets: [{ key, label, caption? }],
//     flows:   [{ from, to, value }] }

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Node = { key: string; label: string; caption?: string; accent?: boolean };
type Flow = { from: string; to: string; value: number };
type SankeyInput = { sources: Node[]; targets: Node[]; flows: Flow[] };

type SankeyLayout = BaseLayout & {
  nodeWidth?: number;
  nodeGap?: number;
  unit?: string;
};

const DEFAULT_DATA: SankeyInput = {
  sources: [
    { key: "users",   label: "direct users",     caption: "7.4M sessions/mo" },
    { key: "search",  label: "organic search",   caption: "Google + Bing",      accent: true },
    { key: "refer",   label: "referral",         caption: "HN / blogs / forum" },
    { key: "social",  label: "social",           caption: "X + LinkedIn" },
  ],
  targets: [
    { key: "docs",     label: "/docs",        caption: "reference" },
    { key: "api",      label: "/api",         caption: "sdk + http" },
    { key: "examples", label: "/examples",    caption: "cookbook" },
    { key: "blog",     label: "/blog",        caption: "articles" },
  ],
  flows: [
    { from: "users",  to: "docs",     value: 2900000 },
    { from: "users",  to: "api",      value: 1700000 },
    { from: "users",  to: "examples", value: 1500000 },
    { from: "users",  to: "blog",     value: 1300000 },
    { from: "search", to: "docs",     value: 3200000 },
    { from: "search", to: "api",      value: 1800000 },
    { from: "search", to: "examples", value: 1100000 },
    { from: "search", to: "blog",     value: 1900000 },
    { from: "refer",  to: "docs",     value:  750000 },
    { from: "refer",  to: "examples", value:  900000 },
    { from: "refer",  to: "blog",     value: 1500000 },
    { from: "social", to: "blog",     value:  980000 },
    { from: "social", to: "examples", value:  320000 },
  ],
};

function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2).replace(/\.0+$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.0+$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function SankeyChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<SankeyInput>(data);
  const L = layout as SankeyLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const SOFT = th.secondarySoft ?? th.secondary;
  const ACC_SOFT = th.accentSoft ?? ACCENT;

  const d = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 220);
  const RIGHT = num(L.padding?.right, 220);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 80);
  const nodeW = num(L.nodeWidth, 18);
  const nodeGap = num(L.nodeGap, 18);
  const plotTop = TOP;
  const plotBottom = H - BOTTOM;
  const plotH = plotBottom - plotTop;

  // compute per-node totals
  const srcTotal: Record<string, number> = {};
  const tgtTotal: Record<string, number> = {};
  d.flows.forEach((f) => {
    srcTotal[f.from] = (srcTotal[f.from] ?? 0) + f.value;
    tgtTotal[f.to] = (tgtTotal[f.to] ?? 0) + f.value;
  });
  const grandTotal = d.flows.reduce((a, b) => a + b.value, 0);
  const gapTotal = Math.max(0, d.sources.length - 1) * nodeGap;
  const availH = plotH - gapTotal;
  const perUnit = availH / grandTotal;

  // compute node positions
  type NodePos = { y0: number; y1: number; consumed: number };
  const srcPos: Record<string, NodePos> = {};
  const tgtPos: Record<string, NodePos> = {};
  {
    let y = plotTop;
    d.sources.forEach((n) => {
      const h = (srcTotal[n.key] ?? 0) * perUnit;
      srcPos[n.key] = { y0: y, y1: y + h, consumed: 0 };
      y += h + nodeGap;
    });
  }
  {
    let y = plotTop;
    d.targets.forEach((n) => {
      const h = (tgtTotal[n.key] ?? 0) * perUnit;
      tgtPos[n.key] = { y0: y, y1: y + h, consumed: 0 };
      y += h + nodeGap;
    });
  }

  const leftX = LEFT;
  const rightX = W - RIGHT - nodeW;
  const midLeft = leftX + nodeW;
  const midRight = rightX;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* flows (ribbons) */}
      {d.flows.map((f, i) => {
        const sp = srcPos[f.from];
        const tp = tgtPos[f.to];
        if (!sp || !tp) return null;
        const srcAccent = d.sources.find((n) => n.key === f.from)?.accent;
        const fy0 = sp.y0 + sp.consumed;
        const fh = f.value * perUnit;
        sp.consumed += fh;
        const ty0 = tp.y0 + tp.consumed;
        tp.consumed += fh;
        const midX = (midLeft + midRight) / 2;
        const pathD = `M ${midLeft} ${fy0}
                       C ${midX} ${fy0}, ${midX} ${ty0}, ${midRight} ${ty0}
                       L ${midRight} ${ty0 + fh}
                       C ${midX} ${ty0 + fh}, ${midX} ${fy0 + fh}, ${midLeft} ${fy0 + fh} Z`;
        return (
          <path
            key={`f-${i}`}
            d={pathD}
            fill={srcAccent ? ACC_SOFT : SOFT}
            opacity={srcAccent ? 0.72 : 0.55}
          />
        );
      })}

      {/* source nodes */}
      {d.sources.map((n) => {
        const p = srcPos[n.key];
        if (!p) return null;
        const h = p.y1 - p.y0;
        return (
          <g key={`src-${n.key}`}>
            <rect x={leftX} y={p.y0} width={nodeW} height={h} fill={n.accent ? ACCENT : INK} />
            <text
              x={leftX - 16}
              y={p.y0 + h / 2 - 4}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={500}
              textAnchor="end"
            >
              {n.label}
            </text>
            {n.caption && (
              <text
                x={leftX - 16}
                y={p.y0 + h / 2 + 14}
                fill={MUTED}
                fontSize={12 * fs}
                textAnchor="end"
              >
                {n.caption}
              </text>
            )}
            <text
              x={leftX - 16}
              y={p.y0 + h / 2 + 32}
              fill={MUTED}
              fontSize={11 * fs}
              textAnchor="end"
              className="tab-nums"
            >
              {compactNumber(srcTotal[n.key] ?? 0)}
            </text>
          </g>
        );
      })}

      {/* target nodes */}
      {d.targets.map((n) => {
        const p = tgtPos[n.key];
        if (!p) return null;
        const h = p.y1 - p.y0;
        return (
          <g key={`tgt-${n.key}`}>
            <rect x={rightX} y={p.y0} width={nodeW} height={h} fill={INK} />
            <text
              x={rightX + nodeW + 16}
              y={p.y0 + h / 2 - 4}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={500}
            >
              {n.label}
            </text>
            {n.caption && (
              <text
                x={rightX + nodeW + 16}
                y={p.y0 + h / 2 + 14}
                fill={MUTED}
                fontSize={12 * fs}
              >
                {n.caption}
              </text>
            )}
            <text
              x={rightX + nodeW + 16}
              y={p.y0 + h / 2 + 32}
              fill={MUTED}
              fontSize={11 * fs}
              className="tab-nums"
            >
              {compactNumber(tgtTotal[n.key] ?? 0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
