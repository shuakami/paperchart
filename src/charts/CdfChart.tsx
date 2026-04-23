// Cumulative distribution function (CDF / ECDF). Accepts either raw values
// or pre-sorted (x, p) points; multiple series are overlaid.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  bool,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Series = {
  label: string;
  accent?: boolean;
  values?: number[];
  points?: { x: number; p: number }[];
  markers?: number[]; // p-values to annotate (e.g. [0.5, 0.95, 0.99])
};

type CdfLayout = BaseLayout & {
  xMin?: number;
  xMax?: number;
  log?: boolean;
  xTicks?: number[];
};

const DEFAULT_SERIES: Series[] = [
  {
    label: "legacy runtime",
    accent: false,
    values: Array.from({ length: 400 }, () => 8 + Math.random() * 30),
    markers: [0.5, 0.95, 0.99],
  },
  {
    label: "new engine",
    accent: true,
    values: Array.from({ length: 400 }, () => 0.05 + Math.random() * 0.6),
    markers: [0.5, 0.95, 0.99],
  },
];

function computeEcdf(values: number[]): { x: number; p: number }[] {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.map((x, i) => ({ x, p: (i + 1) / sorted.length }));
}

function quantile(pts: { x: number; p: number }[], q: number): number {
  const hit = pts.find((p) => p.p >= q);
  return hit ? hit.x : pts[pts.length - 1].x;
}

export default function CdfChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Series[]>(data);
  const L = layout as CdfLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const SERIES = input ?? DEFAULT_SERIES;
  const resolved = SERIES.map((s) => ({
    ...s,
    points: s.points ?? computeEcdf(s.values ?? []),
  }));

  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 920);
  const LEFT = num(L.padding?.left, 120);
  const RIGHT = num(L.padding?.right, 260);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 110);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;

  const isLog = bool(L.log, false);
  const all = resolved.flatMap((r) => r.points.map((p) => p.x));
  const rawMin = isLog ? Math.max(1e-6, Math.min(...all)) : Math.min(...all);
  const rawMax = Math.max(...all);
  const xMin = num(L.xMin, isLog ? rawMin * 0.8 : Math.min(0, rawMin));
  const xMax = num(L.xMax, rawMax * 1.05);
  const sx = (v: number) => {
    if (!isLog) return LEFT + ((v - xMin) / (xMax - xMin || 1)) * PW;
    const lg = Math.log10(Math.max(xMin, v));
    return LEFT + ((lg - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin))) * PW;
  };
  const sy = (p: number) => TOP + PH - p * PH;

  const yTicks = [0, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 1];

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
        yTicks.map((p, i) => (
          <line
            key={i}
            x1={LEFT}
            x2={LEFT + PW}
            y1={sy(p)}
            y2={sy(p)}
            stroke={RULE}
            strokeWidth={1}
          />
        ))}

      {yTicks.map((p, i) => (
        <text
          key={`yl-${i}`}
          x={LEFT - 12}
          y={sy(p) + 5}
          fill={INK}
          fontSize={13 * fs}
          textAnchor="end"
          opacity={0.72}
          className="tab-nums"
        >
          {p}
        </text>
      ))}

      {resolved.map((r, ri) => {
        const color = r.accent ? ACCENT : NEUTRAL;
        const d = r.points
          .map((p, i) => (i === 0 ? "M" : "L") + sx(p.x) + " " + sy(p.p))
          .join(" ");
        // find right-side label anchor near p=0.95
        const anchor = quantile(r.points, 0.95);
        return (
          <g key={ri}>
            <path d={d} fill="none" stroke={color} strokeWidth={3} />
            {/* p-value markers */}
            {r.markers?.map((m, mi) => {
              const xv = quantile(r.points, m);
              return (
                <g key={mi}>
                  <circle cx={sx(xv)} cy={sy(m)} r={6} fill={color} />
                  <text
                    x={sx(xv) + 10}
                    y={sy(m) - 6}
                    fill={INK}
                    fontSize={13 * fs}
                    opacity={0.82}
                    className="tab-nums"
                  >
                    p{Math.round(m * 100)}={xv.toFixed(xv < 1 ? 3 : 2)}
                  </text>
                </g>
              );
            })}
            <text
              x={sx(anchor) + 10}
              y={sy(0.95) + 26 + ri * 22}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={600}
            >
              {r.label}
            </text>
          </g>
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
