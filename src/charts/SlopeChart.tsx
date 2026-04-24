// Slope chart. Two labelled columns (e.g. before / after) with lines
// connecting the two points of each series. Accent line for the featured
// subject; rest in muted neutral.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Series = {
  label: string;
  start: number;
  end: number;
  accent?: boolean;
};

type SlopeInput = {
  startLabel: string;
  endLabel: string;
  startCaption?: string;
  endCaption?: string;
  unit?: string;
  series: Series[];
};

type SlopeLayout = BaseLayout & {
  leftColX?: number;
  rightColX?: number;
  dotRadius?: number;
};

const DEFAULT_DATA: SlopeInput = {
  startLabel: "baseline",
  endLabel: "rebuilt",
  startCaption: "fuzzy scorer on inlined json",
  endCaption: "varint index, streamed on demand",
  unit: "ms",
  series: [
    { label: "p50 query", start: 8.12, end: 0.47, accent: true },
    { label: "p75 query", start: 12.4, end: 0.82 },
    { label: "p90 query", start: 16.8, end: 1.24 },
    { label: "p95 query", start: 17.3, end: 1.81 },
    { label: "p99 query", start: 25.4, end: 3.02 },
    { label: "index parse", start: 28.6, end: 4.1 },
  ],
};

export default function SlopeChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<SlopeInput>(data);
  const L = layout as SlopeLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const NEUTRAL = s.secondary ?? th.secondary;
  const BG = s.bg ?? th.bg;

  const d = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const LEFT = num(L.padding?.left, 260);
  const RIGHT = num(L.padding?.right, 260);
  const TOP = num(L.padding?.top, 110);
  const BOTTOM = num(L.padding?.bottom, 90);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const PH = H - TOP - BOTTOM;

  const x1 = num(L.leftColX, LEFT);
  const x2 = num(L.rightColX, W - RIGHT);

  const unit = str(d.unit, "");
  const values: number[] = [];
  d.series.forEach((s0) => {
    values.push(s0.start, s0.end);
  });
  const vMax = Math.max(...values) * 1.05;
  const vMin = Math.min(0, Math.min(...values));
  const sy = (v: number) => TOP + PH - ((v - vMin) / (vMax - vMin)) * PH;

  const dotR = num(L.dotRadius, 6);

  const fmt = (v: number) => {
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {/* column headers */}
      <text
        x={x1}
        y={TOP - 46}
        fill={INK}
        fontSize={16 * fs}
        fontWeight={600}
        textAnchor="middle"
      >
        {d.startLabel}
      </text>
      {d.startCaption && (
        <text
          x={x1}
          y={TOP - 26}
          fill={MUTED}
          fontSize={12 * fs}
          textAnchor="middle"
        >
          {d.startCaption}
        </text>
      )}
      <text
        x={x2}
        y={TOP - 46}
        fill={INK}
        fontSize={16 * fs}
        fontWeight={600}
        textAnchor="middle"
      >
        {d.endLabel}
      </text>
      {d.endCaption && (
        <text
          x={x2}
          y={TOP - 26}
          fill={MUTED}
          fontSize={12 * fs}
          textAnchor="middle"
        >
          {d.endCaption}
        </text>
      )}

      {/* column guides */}
      <line
        x1={x1}
        x2={x1}
        y1={TOP - 8}
        y2={TOP + PH + 8}
        stroke={RULE}
        strokeWidth={1}
      />
      <line
        x1={x2}
        x2={x2}
        y1={TOP - 8}
        y2={TOP + PH + 8}
        stroke={RULE}
        strokeWidth={1}
      />

      {d.series.map((s0, i) => {
        const color = s0.accent ? ACCENT : NEUTRAL;
        const y1 = sy(s0.start);
        const y2 = sy(s0.end);
        const delta = s0.end - s0.start;
        const pct = s0.start !== 0 ? (delta / s0.start) * 100 : 0;
        return (
          <g key={i}>
            <line
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
              stroke={color}
              strokeWidth={s0.accent ? 2.25 : 1.5}
              opacity={s0.accent ? 1 : 0.82}
            />
            <circle cx={x1} cy={y1} r={dotR} fill={color} />
            <circle cx={x2} cy={y2} r={dotR} fill={color} />

            {/* left value + label */}
            <text
              x={x1 - 22}
              y={y1 + 4}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={600}
              textAnchor="end"
              className="tab-nums"
            >
              {fmt(s0.start)}
              {unit ? ` ${unit}` : ""}
            </text>
            <text
              x={x1 - 22}
              y={y1 + 20}
              fill={MUTED}
              fontSize={11 * fs}
              textAnchor="end"
            >
              {s0.label}
            </text>

            {/* right value + delta */}
            <text
              x={x2 + 22}
              y={y2 + 4}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={600}
              textAnchor="start"
              className="tab-nums"
            >
              {fmt(s0.end)}
              {unit ? ` ${unit}` : ""}
            </text>
            <text
              x={x2 + 22}
              y={y2 + 20}
              fill={color}
              fontSize={11 * fs}
              textAnchor="start"
              className="tab-nums"
              opacity={0.9}
            >
              {pct >= 0 ? "+" : ""}
              {pct.toFixed(0)}%
            </text>
          </g>
        );
      })}

      {L.footnote && (
        <text x={LEFT} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
