// Dumbbell (connected-dot) chart — paired before/after values per row,
// with a connecting segment between the two dots.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Row = {
  label: string;
  caption?: string;
  before: number;
  after: number;
};

type DumbLayout = BaseLayout & {
  xMin?: number;
  xMax?: number;
  dotRadius?: number;
  rowHeight?: number;
  unit?: string;
};

const DEFAULT_ROWS: Row[] = [
  { label: "p50 latency", caption: "per-query", before: 13.32, after: 0.064 },
  { label: "p95 latency", caption: "per-query", before: 23.94, after: 0.302 },
  { label: "p99 latency", caption: "per-query", before: 25.41, after: 0.47 },
  { label: "docs first-load", caption: "JS brotli", before: 234, after: 76 },
  { label: "pack size", caption: "brotli", before: 116, after: 78 },
];

export default function DumbbellChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Row[]>(data);
  const L = layout as DumbLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const ROWS = input ?? DEFAULT_ROWS;
  const fs = num(L.fontScale, 1);
  const rowH = num(L.rowHeight, 100);
  const LEFT = num(L.padding?.left, 360);
  const RIGHT = num(L.padding?.right, 260);
  const TOP = num(L.padding?.top, 60);
  const BOTTOM = num(L.padding?.bottom, 80);
  const W = num(L.width, 1600);
  const H = num(L.height, TOP + ROWS.length * rowH + BOTTOM);
  const PW = W - LEFT - RIGHT;
  const DR = num(L.dotRadius, 12);
  const unit = str(L.unit, "");

  const all = ROWS.flatMap((r) => [r.before, r.after]);
  const xMin = num(L.xMin, 0);
  const xMax = num(L.xMax, Math.max(...all) * 1.05);
  const sx = (v: number) => LEFT + ((v - xMin) / (xMax - xMin || 1)) * PW;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {L.title && (
        <text x={40} y={40} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {L.title}
        </text>
      )}

      {ROWS.map((r, i) => {
        const y = TOP + i * rowH + rowH / 2;
        const x1 = sx(r.before);
        const x2 = sx(r.after);
        const delta = r.before === 0 ? 0 : ((r.after - r.before) / r.before) * 100;
        const improved = r.after < r.before;
        return (
          <g key={i}>
            <line
              x1={40}
              x2={W - 40}
              y1={TOP + i * rowH}
              y2={TOP + i * rowH}
              stroke={RULE}
              strokeWidth={1}
            />
            <text x={40} y={y - 6} fill={INK} fontSize={16 * fs} fontWeight={600}>
              {r.label}
            </text>
            {r.caption && (
              <text x={40} y={y + 16} fill={MUTED} fontSize={13 * fs}>
                {r.caption}
              </text>
            )}

            {/* connector */}
            <line
              x1={x1}
              x2={x2}
              y1={y}
              y2={y}
              stroke={RULE}
              strokeWidth={Math.max(3, DR / 3)}
            />

            {/* before */}
            <circle cx={x1} cy={y} r={DR} fill={NEUTRAL} />
            <text
              x={x1}
              y={y - DR - 10}
              fill={INK}
              fontSize={13 * fs}
              textAnchor="middle"
              opacity={0.78}
              className="tab-nums"
            >
              {r.before}{unit ? ` ${unit}` : ""}
            </text>

            {/* after */}
            <circle cx={x2} cy={y} r={DR} fill={ACCENT} />
            <text
              x={x2}
              y={y + DR + 24}
              fill={INK}
              fontSize={13 * fs}
              textAnchor="middle"
              opacity={0.78}
              className="tab-nums"
            >
              {r.after}{unit ? ` ${unit}` : ""}
            </text>

            {/* delta on right */}
            <text
              x={W - 40}
              y={y + 6}
              fill={improved ? ACCENT : INK}
              fontSize={19 * fs}
              fontWeight={600}
              textAnchor="end"
              className="tab-nums"
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </text>
          </g>
        );
      })}

      <line
        x1={40}
        x2={W - 40}
        y1={TOP + ROWS.length * rowH}
        y2={TOP + ROWS.length * rowH}
        stroke={RULE}
        strokeWidth={1}
      />

      {/* legend */}
      <g transform={`translate(${LEFT}, ${H - 40})`}>
        <circle cx={6} cy={6} r={7} fill={NEUTRAL} />
        <text x={22} y={11} fill={INK} fontSize={13 * fs} opacity={0.82}>
          before
        </text>
        <circle cx={110} cy={6} r={7} fill={ACCENT} />
        <text x={126} y={11} fill={INK} fontSize={13 * fs} opacity={0.82}>
          after
        </text>
      </g>

      {L.footnote && (
        <text x={40} y={H - 14} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
