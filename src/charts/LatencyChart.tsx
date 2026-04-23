// Horizontal grouped bar chart, log x-axis.
// Every knob (canvas size, padding, font scale, corner annotation, axis caption)
// can be overridden via the `layout` prop. Colors come from the theme.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, num, str, bool, type BaseLayout, type StyleOverrides } from "../layout";

type Row = {
  group: string;
  caption: string;
  color: "neutral" | "accent";
  bars: { level: "p50" | "p95" | "p99"; ms: number }[];
};

type LatencyLayout = BaseLayout & {
  xMin?: number;
  xMax?: number;
  ticks?: number[];
  barHeight?: number;
  rowGap?: number;
};

const DEFAULT_ROWS: Row[] = [
  {
    group: "Fuse fuzzy matcher",
    caption: "fuzzy scoring over the JSON index shipped inside the chunk",
    color: "neutral",
    bars: [
      { level: "p50", ms: 13.32 },
      { level: "p95", ms: 23.94 },
      { level: "p99", ms: 25.41 },
    ],
  },
  {
    group: "Custom inverted index",
    caption: "token postings + feature scoring, pack embedded as base64 in the JS chunk",
    color: "neutral",
    bars: [
      { level: "p50", ms: 0.076 },
      { level: "p95", ms: 0.354 },
      { level: "p99", ms: 0.605 },
    ],
  },
  {
    group: "Externalized binary pack",
    caption: "same engine, pack served as /search-pack.bin and lazy-fetched on first search",
    color: "accent",
    bars: [
      { level: "p50", ms: 0.064 },
      { level: "p95", ms: 0.302 },
      { level: "p99", ms: 0.470 },
    ],
  },
];

const DEFAULT_TICKS = [0.01, 0.1, 1, 10, 100];

export default function LatencyChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const unwrapped = unwrap<Row[]>(data);
  const rowsInput = unwrapped.data;
  const layout = unwrapped.layout as LatencyLayout;
  const style = unwrapped.style as StyleOverrides;
  const th = resolveTheme(theme);

  const INK = style.ink ?? th.ink;
  const RULE = style.rule ?? th.rule;
  const NEUTRAL = style.secondary ?? th.secondary;
  const ACCENT = style.accent ?? th.accent;
  const BG = style.bg ?? th.bg;

  const ROWS = rowsInput ?? DEFAULT_ROWS;

  const fs = num(layout.fontScale, 1);
  const W = num(layout.width, 1600);
  const H = num(layout.height, 720);
  const LEFT = num(layout.padding?.left, 420);
  const RIGHT = num(layout.padding?.right, 200);
  const TOP = num(layout.padding?.top, 48);
  const BOTTOM = num(layout.padding?.bottom, 90);
  const PLOT_W = W - LEFT - RIGHT;
  const PLOT_H = H - TOP - BOTTOM;

  const X_MIN = num(layout.xMin, 0.01);
  const X_MAX = num(layout.xMax, 100);
  const logMin = Math.log10(X_MIN);
  const logMax = Math.log10(X_MAX);

  const TICKS = Array.isArray(layout.ticks) ? layout.ticks : DEFAULT_TICKS;

  const xScale = (v: number) => {
    const c = Math.min(Math.max(v, X_MIN), X_MAX);
    return LEFT + ((Math.log10(c) - logMin) / (logMax - logMin)) * PLOT_W;
  };

  const cornerLines: string[] | undefined = bool(layout.hideCorner)
    ? undefined
    : Array.isArray(layout.corner)
      ? layout.corner
      : [
          "Node microbench · Node v22, single thread",
          "20 queries × 200 trials · 20 warmup runs discarded",
        ];
  const xCaption = str(
    layout.xAxisCaption,
    "per-query latency in milliseconds, log scale",
  );

  const ROW_H = PLOT_H / ROWS.length;
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {/* Corner annotation (measurement context) */}
      {cornerLines && (
        <g>
          {cornerLines.map((line, idx) => (
            <text
              key={idx}
              x={W - RIGHT}
              y={TOP - 20 + idx * 18}
              fill={INK}
              textAnchor="end"
              fontSize={15 * fs}
              fontWeight={400}
              opacity={0.72}
            >
              {line}
            </text>
          ))}
        </g>
      )}

      {/* Vertical gridlines at log ticks */}
      {!bool(layout.hideGrid) &&
        TICKS.map((tk) => (
          <line
            key={tk}
            x1={xScale(tk)}
            x2={xScale(tk)}
            y1={TOP}
            y2={TOP + PLOT_H}
            stroke={RULE}
            strokeWidth={1}
          />
        ))}

      {/* Row separators */}
      {ROWS.map((_, i) =>
        i < ROWS.length ? (
          <line
            key={`sep-${i}`}
            x1={40}
            x2={W - RIGHT}
            y1={TOP + i * ROW_H}
            y2={TOP + i * ROW_H}
            stroke={RULE}
            strokeWidth={1}
          />
        ) : null,
      )}
      <line
        x1={40}
        x2={W - RIGHT}
        y1={TOP + PLOT_H}
        y2={TOP + PLOT_H}
        stroke={RULE}
        strokeWidth={1}
      />

      {/* Rows */}
      {ROWS.map((row, ri) => {
        const yTop = TOP + ri * ROW_H;
        const barAreaTop = yTop + 56;
        const barHeight = 22;
        const gap = 16;
        const color = row.color === "accent" ? ACCENT : NEUTRAL;
        return (
          <g key={row.group}>
            {/* group label (two lines) */}
            <text
              x={40}
              y={yTop + 38}
              fill={INK}
              fontSize={22}
              fontWeight={600}
            >
              {row.group}
            </text>
            <text
              x={40}
              y={yTop + 62}
              fill={INK}
              fontSize={14}
              fontWeight={400}
              opacity={0.62}
            >
              {row.caption}
            </text>
            {/* bars */}
            {row.bars.map((b, bi) => {
              const y = barAreaTop + bi * (barHeight + gap) + 20;
              const x1 = LEFT;
              const x2 = xScale(b.ms);
              return (
                <g key={b.level}>
                  <rect
                    x={x1}
                    y={y}
                    width={Math.max(1, x2 - x1)}
                    height={barHeight}
                    fill={color}
                  />
                  <text
                    x={x2 + 12}
                    y={y + barHeight - 6}
                    fill={INK}
                    fontSize={17}
                    fontWeight={500}
                    className="tab-nums"
                  >
                    <tspan fontWeight={600}>{b.level}</tspan>
                    <tspan dx={10}>{b.ms.toFixed(b.ms < 1 ? 3 : 2)} ms</tspan>
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* x-axis tick labels */}
      {!bool(layout.hideXTicks) &&
        TICKS.map((tk) => (
          <text
            key={tk}
            x={xScale(tk)}
            y={TOP + PLOT_H + 22}
            fill={INK}
            fontSize={14 * fs}
            textAnchor="middle"
            opacity={0.72}
            className="tab-nums"
          >
            {tk}
          </text>
        ))}

      {/* x-axis caption */}
      {xCaption ? (
        <text
          x={LEFT + PLOT_W / 2}
          y={TOP + PLOT_H + 50}
          fill={INK}
          fontSize={15 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {xCaption}
        </text>
      ) : null}
    </svg>
  );
}
