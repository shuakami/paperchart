// Timeline of phases / milestones across a continuous time axis. Each row is
// one track (team / workstream / release channel). Each row has a sequence of
// spans (start, end, label) and optional point milestones. One span per row
// may be `accent: true` to get the highlight color.
//
// data shape:
//   [
//     { label, caption?, spans: [{ start, end, label, accent? }],
//       milestones?: [{ at, label }] },
//     ...
//   ]
// Start / end are numbers (days, weeks, "2024.3" etc — treated as numeric).

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Span = { start: number; end: number; label: string; accent?: boolean };
type Milestone = { at: number; label: string };
type Row = {
  label: string;
  caption?: string;
  spans: Span[];
  milestones?: Milestone[];
};

type TimelineLayout = BaseLayout & {
  barHeight?: number;
  rowGap?: number;
  xMin?: number;
  xMax?: number;
  xTicks?: number;
  labelWidth?: number;
  xLabel?: (v: number) => string;
};

const DEFAULT_DATA: Row[] = [
  {
    label: "retrieval",
    caption: "indexing + query pipeline",
    spans: [
      { start: 0, end: 6, label: "fuse scorer" },
      { start: 6, end: 13, label: "inverted index v1" },
      { start: 13, end: 24, label: "externalized pack", accent: true },
    ],
    milestones: [{ at: 13, label: "cut-over" }],
  },
  {
    label: "docs site",
    caption: "bundle + routing",
    spans: [
      { start: 0, end: 9, label: "inlined JSON" },
      { start: 9, end: 24, label: "streamed artifact" },
    ],
  },
  {
    label: "edge worker",
    caption: "CDN delivery",
    spans: [
      { start: 2, end: 11, label: "origin proxy" },
      { start: 11, end: 24, label: "brotli-11 cached" },
    ],
  },
  {
    label: "observability",
    caption: "latency + recall probes",
    spans: [
      { start: 4, end: 18, label: "query p99 dashboards" },
      { start: 18, end: 24, label: "pack entropy monitors" },
    ],
  },
];

export default function TimelineChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Row[]>(data);
  const L = layout as TimelineLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const SECONDARY = s.secondary ?? th.secondary;
  const BG = s.bg ?? th.bg;
  const SOFT = th.secondarySoft ?? SECONDARY;

  const rows = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const LEFT = num(L.padding?.left, 56);
  const RIGHT = num(L.padding?.right, 64);
  const TOP = num(L.padding?.top, 64);
  const BOTTOM = num(L.padding?.bottom, 80);
  const labelW = num(L.labelWidth, 260);
  const barH = num(L.barHeight, 34);
  const rowGap = num(L.rowGap, 42);
  const rowH = barH + rowGap;
  const H = num(L.height, TOP + rows.length * rowH + BOTTOM);

  const allX = rows.flatMap((r) => r.spans.flatMap((sp) => [sp.start, sp.end]));
  const xMin = num(L.xMin, Math.min(...allX));
  const xMax = num(L.xMax, Math.max(...allX));
  const xSpan = xMax - xMin || 1;
  const plotLeft = LEFT + labelW;
  const plotRight = W - RIGHT;
  const plotW = plotRight - plotLeft;
  const xs = (v: number) => plotLeft + ((v - xMin) / xSpan) * plotW;

  const xTicks = num(L.xTicks, 7);
  const ticks = Array.from({ length: xTicks }, (_, i) =>
    xMin + (i / (xTicks - 1)) * xSpan,
  );
  const xLabel = L.xLabel ?? ((v: number) => v.toFixed(1).replace(/\.0$/, ""));

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* vertical guides */}
      {ticks.map((v, i) => (
        <line
          key={`g-${i}`}
          x1={xs(v)}
          x2={xs(v)}
          y1={TOP - 12}
          y2={TOP + rows.length * rowH - rowGap + 8}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}

      {/* rows */}
      {rows.map((r, ri) => {
        const y0 = TOP + ri * rowH;
        return (
          <g key={`row-${ri}`}>
            <text x={LEFT} y={y0 + barH / 2 - 2} fill={INK} fontSize={15 * fs} fontWeight={500}>
              {r.label}
            </text>
            {r.caption && (
              <text x={LEFT} y={y0 + barH / 2 + 16} fill={MUTED} fontSize={12 * fs}>
                {r.caption}
              </text>
            )}
            {r.spans.map((sp, si) => {
              const x1 = xs(sp.start);
              const x2 = xs(sp.end);
              const w = Math.max(2, x2 - x1);
              const fill = sp.accent ? ACCENT : SOFT;
              const textColor = sp.accent ? "#FFFFFF" : INK;
              return (
                <g key={`sp-${ri}-${si}`}>
                  <rect x={x1} y={y0} width={w} height={barH} fill={fill} />
                  {w > 60 && (
                    <text
                      x={x1 + 12}
                      y={y0 + barH / 2 + 4}
                      fill={textColor}
                      fontSize={12 * fs}
                      fontWeight={sp.accent ? 500 : 400}
                      opacity={sp.accent ? 1 : 0.85}
                    >
                      {sp.label}
                    </text>
                  )}
                </g>
              );
            })}
            {(r.milestones ?? []).map((m, mi) => {
              const mx = xs(m.at);
              return (
                <g key={`ms-${ri}-${mi}`}>
                  <circle cx={mx} cy={y0 + barH / 2} r={5} fill={BG} stroke={INK} strokeWidth={1.5} />
                  <text
                    x={mx}
                    y={y0 + barH + 18}
                    fill={INK}
                    fontSize={11 * fs}
                    textAnchor="middle"
                    opacity={0.8}
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* bottom axis ticks */}
      {ticks.map((v, i) => (
        <text
          key={`t-${i}`}
          x={xs(v)}
          y={TOP + rows.length * rowH - rowGap + 28}
          fill={INK}
          fontSize={12 * fs}
          textAnchor="middle"
          opacity={0.72}
          className="tab-nums"
        >
          {xLabel(v)}
        </text>
      ))}

      {str(L.xAxisCaption, "") !== "" && (
        <text
          x={plotLeft}
          y={H - 26}
          fill={MUTED}
          fontSize={12 * fs}
        >
          {L.xAxisCaption}
        </text>
      )}
    </svg>
  );
}
