// Scatter plot with optional regression line. Accepts two groups
// (distinguished by accent flag) or flat points list.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  bool,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Point = { x: number; y: number; label?: string };
type Group = {
  label: string;
  accent?: boolean;
  points: Point[];
};

type ScatterLayout = BaseLayout & {
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  yTicks?: number;
  dotRadius?: number;
  regression?: boolean;
};

const DEFAULT_GROUPS: Group[] = [
  {
    label: "docs with inline pack",
    accent: false,
    points: Array.from({ length: 40 }, (_, i) => ({
      x: 120 + i * 2 + Math.random() * 12,
      y: 8 + i * 0.15 + Math.random() * 3,
    })),
  },
  {
    label: "docs with external pack",
    accent: true,
    points: Array.from({ length: 40 }, (_, i) => ({
      x: 20 + i * 1.3 + Math.random() * 8,
      y: 0.4 + i * 0.015 + Math.random() * 0.3,
    })),
  },
];

function regression(points: Point[]): { m: number; b: number } | null {
  if (points.length < 2) return null;
  const n = points.length;
  const sx = points.reduce((a, p) => a + p.x, 0);
  const sy = points.reduce((a, p) => a + p.y, 0);
  const sxy = points.reduce((a, p) => a + p.x * p.y, 0);
  const sxx = points.reduce((a, p) => a + p.x * p.x, 0);
  const d = n * sxx - sx * sx;
  if (d === 0) return null;
  const m = (n * sxy - sx * sy) / d;
  const b = (sy - m * sx) / n;
  return { m, b };
}

export default function ScatterChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Group[]>(data);
  const L = layout as ScatterLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const GROUPS = input ?? DEFAULT_GROUPS;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 1000);
  const LEFT = num(L.padding?.left, 130);
  const RIGHT = num(L.padding?.right, 300);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 110);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;
  const DR = num(L.dotRadius, 6);

  const all = GROUPS.flatMap((g) => g.points);
  const xMin = num(L.xMin, Math.min(0, ...all.map((p) => p.x)));
  const xMax = num(L.xMax, Math.max(...all.map((p) => p.x)) * 1.05);
  const yMin = num(L.yMin, Math.min(0, ...all.map((p) => p.y)));
  const yMax = num(L.yMax, Math.max(...all.map((p) => p.y)) * 1.1);
  const sx = (v: number) => LEFT + ((v - xMin) / (xMax - xMin || 1)) * PW;
  const sy = (v: number) => TOP + PH - ((v - yMin) / (yMax - yMin || 1)) * PH;

  const xTickCount = num(L.xTicks, 6);
  const yTickCount = num(L.yTicks, 6);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => xMin + ((xMax - xMin) * i) / (xTickCount - 1));
  const yTicks = Array.from({ length: yTickCount }, (_, i) => yMin + ((yMax - yMin) * i) / (yTickCount - 1));

  const showReg = bool(L.regression, true);

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
            {v.toFixed(1).replace(/\.0$/, "")}
          </text>
        ))}

      {!bool(L.hideXTicks) &&
        xTicks.map((v, i) => (
          <text
            key={`xt-${i}`}
            x={sx(v)}
            y={TOP + PH + 26}
            fill={INK}
            fontSize={13 * fs}
            textAnchor="middle"
            opacity={0.72}
            className="tab-nums"
          >
            {v.toFixed(1).replace(/\.0$/, "")}
          </text>
        ))}

      <line
        x1={LEFT}
        x2={LEFT + PW}
        y1={TOP + PH}
        y2={TOP + PH}
        stroke={INK}
        strokeWidth={1}
        opacity={0.28}
      />

      {GROUPS.map((g, gi) => {
        const color = g.accent ? ACCENT : NEUTRAL;
        const reg = showReg ? regression(g.points) : null;
        return (
          <g key={gi}>
            {g.points.map((p, i) => (
              <circle
                key={i}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={DR}
                fill={color}
                opacity={0.82}
              />
            ))}
            {reg && (
              <line
                x1={sx(xMin)}
                x2={sx(xMax)}
                y1={sy(reg.m * xMin + reg.b)}
                y2={sy(reg.m * xMax + reg.b)}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.8}
              />
            )}
            {/* legend swatch on right */}
            <g transform={`translate(${LEFT + PW + 30}, ${TOP + 20 + gi * 36})`}>
              <circle cx={6} cy={6} r={6} fill={color} />
              <text x={22} y={11} fill={INK} fontSize={14 * fs} fontWeight={600}>
                {g.label}
              </text>
            </g>
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
      {L.yAxisCaption && (
        <text
          x={30}
          y={TOP + PH / 2}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.62}
          transform={`rotate(-90, 30, ${TOP + PH / 2})`}
        >
          {L.yAxisCaption}
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
