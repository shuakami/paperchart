// Frequency histogram. Accepts pre-binned `bins` or raw `values`.
// Optional overlay line for comparison distribution.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  bool,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Bin = { from: number; to: number; count: number };
type HistInput = {
  bins?: Bin[];
  values?: number[];
  binCount?: number;
  overlay?: { label: string; bins: Bin[] };
};

type HistLayout = BaseLayout & {
  yMax?: number;
  yTicks?: number;
  highlightRange?: [number, number];
};

const DEFAULT_INPUT: HistInput = {
  bins: [
    { from: 0, to: 0.05, count: 2 },
    { from: 0.05, to: 0.1, count: 6 },
    { from: 0.1, to: 0.15, count: 14 },
    { from: 0.15, to: 0.2, count: 28 },
    { from: 0.2, to: 0.25, count: 42 },
    { from: 0.25, to: 0.3, count: 64 },
    { from: 0.3, to: 0.35, count: 72 },
    { from: 0.35, to: 0.4, count: 58 },
    { from: 0.4, to: 0.45, count: 36 },
    { from: 0.45, to: 0.5, count: 18 },
    { from: 0.5, to: 0.55, count: 9 },
    { from: 0.55, to: 0.6, count: 3 },
  ],
};

function buildBins(values: number[], count: number): Bin[] {
  if (!values.length) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const step = (hi - lo) / count || 1;
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({
    from: lo + i * step,
    to: lo + (i + 1) * step,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(count - 1, Math.max(0, Math.floor((v - lo) / step)));
    bins[idx].count += 1;
  }
  return bins;
}

export default function HistogramChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<HistInput>(data);
  const L = layout as HistLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const raw = input ?? DEFAULT_INPUT;
  const bins: Bin[] = raw.bins ?? buildBins(raw.values ?? [], num(raw.binCount, 20));

  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 110);
  const RIGHT = num(L.padding?.right, 120);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 110);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;

  const yMax = num(L.yMax, Math.max(...bins.map((b) => b.count)) * 1.08);
  const xMin = bins[0]?.from ?? 0;
  const xMax = bins[bins.length - 1]?.to ?? 1;
  const sx = (v: number) => LEFT + ((v - xMin) / (xMax - xMin || 1)) * PW;
  const sy = (v: number) => TOP + PH - (v / (yMax || 1)) * PH;

  const yTickCount = num(L.yTicks, 5);
  const yTicks = Array.from({ length: yTickCount }, (_, i) =>
    Math.round((yMax * i) / (yTickCount - 1)),
  );

  const hr = L.highlightRange;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {L.title && (
        <text x={LEFT} y={40} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {L.title}
        </text>
      )}
      {L.subtitle && (
        <text x={LEFT} y={L.title ? 64 : 46} fill={MUTED} fontSize={14 * fs}>
          {L.subtitle}
        </text>
      )}

      {!bool(L.hideGrid) &&
        yTicks.map((v, i) => (
          <line
            key={`gy-${i}`}
            x1={LEFT}
            x2={LEFT + PW}
            y1={sy(v)}
            y2={sy(v)}
            stroke={RULE}
            strokeWidth={1}
          />
        ))}

      {!bool(L.hideYTicks) &&
        yTicks.map((v, i) => (
          <text
            key={`yt-${i}`}
            x={LEFT - 12}
            y={sy(v) + 5}
            fill={INK}
            fontSize={13 * fs}
            textAnchor="end"
            opacity={0.72}
            className="tab-nums"
          >
            {v}
          </text>
        ))}

      {bins.map((b, i) => {
        const inHighlight = hr && b.from >= hr[0] && b.to <= hr[1];
        const color = inHighlight ? ACCENT : NEUTRAL;
        const x = sx(b.from);
        const w = sx(b.to) - sx(b.from);
        const y = sy(b.count);
        const h = TOP + PH - y;
        return (
          <g key={i}>
            <rect
              x={x + 1}
              y={y}
              width={Math.max(1, w - 2)}
              height={h}
              fill={color}
            />
          </g>
        );
      })}

      {/* x-axis baseline */}
      <line
        x1={LEFT}
        x2={LEFT + PW}
        y1={TOP + PH}
        y2={TOP + PH}
        stroke={INK}
        strokeWidth={1}
        opacity={0.3}
      />

      {/* x-axis tick labels: show bin edges at a subset */}
      {!bool(L.hideXTicks) &&
        bins.map((b, i) => {
          if (i % Math.max(1, Math.ceil(bins.length / 8)) !== 0 && i !== bins.length - 1)
            return null;
          return (
            <text
              key={`xt-${i}`}
              x={sx(b.from)}
              y={TOP + PH + 26}
              fill={INK}
              fontSize={13 * fs}
              textAnchor="middle"
              opacity={0.72}
              className="tab-nums"
            >
              {b.from.toFixed(2)}
            </text>
          );
        })}

      {L.xAxisCaption && (
        <text
          x={LEFT + PW / 2}
          y={TOP + PH + 58}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {L.xAxisCaption}
        </text>
      )}

      {L.footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
