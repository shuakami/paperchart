// Multi-series line chart. Every visual knob (canvas, padding, tick count,
// line thickness, dot size, legend position) is overridable via `layout`.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  bool,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Point = { x: number; y: number };
type Series = {
  label: string;
  caption?: string;
  accent?: boolean;
  points: Point[];
};

type LineLayout = BaseLayout & {
  xTicks?: number;
  yTicks?: number;
  lineWidth?: number;
  dotRadius?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xLabel?: (v: number) => string;
  yLabel?: (v: number) => string;
};

const DEFAULT_SERIES: Series[] = [
  {
    label: "legacy runtime",
    caption: "fuzzy scorer over inlined JSON",
    accent: false,
    points: Array.from({ length: 20 }, (_, i) => ({
      x: 2020 + i * 0.5,
      y: 14 + Math.sin(i / 3) * 2 + i * 0.3,
    })),
  },
  {
    label: "new engine",
    caption: "inverted index + externalized pack",
    accent: true,
    points: Array.from({ length: 20 }, (_, i) => ({
      x: 2020 + i * 0.5,
      y: 14 - i * 0.65 + Math.cos(i / 3) * 0.6,
    })),
  },
];

function niceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) count = 2;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

export default function LineChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Series[]>(data);
  const th = resolveTheme(theme);
  const L = layout as LineLayout;
  const s = style as StyleOverrides;
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const SERIES = input ?? DEFAULT_SERIES;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 110);
  const RIGHT = num(L.padding?.right, 320);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 110);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;
  const LW = num(L.lineWidth, 3);
  const DR = num(L.dotRadius, 5);

  const allX = SERIES.flatMap((ss) => ss.points.map((p) => p.x));
  const allY = SERIES.flatMap((ss) => ss.points.map((p) => p.y));
  const xMin = num(L.xMin, Math.min(...allX));
  const xMax = num(L.xMax, Math.max(...allX));
  const yMin = num(L.yMin, Math.min(0, ...allY));
  const yMax = num(L.yMax, Math.max(...allY) * 1.08);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const xs = (v: number) => LEFT + ((v - xMin) / xSpan) * PW;
  const ys = (v: number) => TOP + PH - ((v - yMin) / ySpan) * PH;

  const xTickCount = num(L.xTicks, 6);
  const yTickCount = num(L.yTicks, 5);
  const xTicks = niceTicks(xMin, xMax, xTickCount);
  const yTicks = niceTicks(yMin, yMax, yTickCount);
  const xLabel = L.xLabel ?? ((v: number) => v.toFixed(1).replace(/\.0$/, ""));
  const yLabel = L.yLabel ?? ((v: number) => v.toFixed(1).replace(/\.0$/, ""));
  const xCaption = str(L.xAxisCaption, "");
  const yCaption = str(L.yAxisCaption, "");
  const title = str(L.title, "");
  const subtitle = str(L.subtitle, "");
  const footnote = str(L.footnote, "");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {title && (
        <text x={LEFT} y={40} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {title}
        </text>
      )}
      {subtitle && (
        <text x={LEFT} y={title ? 64 : 46} fill={MUTED} fontSize={14 * fs}>
          {subtitle}
        </text>
      )}

      {/* grid + ticks */}
      {!bool(L.hideGrid) &&
        yTicks.map((v, i) => (
          <line
            key={`gy-${i}`}
            x1={LEFT}
            x2={LEFT + PW}
            y1={ys(v)}
            y2={ys(v)}
            stroke={RULE}
            strokeWidth={1}
          />
        ))}

      {!bool(L.hideYTicks) &&
        yTicks.map((v, i) => (
          <text
            key={`yt-${i}`}
            x={LEFT - 12}
            y={ys(v) + 5}
            fill={INK}
            fontSize={13 * fs}
            textAnchor="end"
            opacity={0.72}
            className="tab-nums"
          >
            {yLabel(v)}
          </text>
        ))}

      {!bool(L.hideXTicks) &&
        xTicks.map((v, i) => (
          <text
            key={`xt-${i}`}
            x={xs(v)}
            y={TOP + PH + 26}
            fill={INK}
            fontSize={13 * fs}
            textAnchor="middle"
            opacity={0.72}
            className="tab-nums"
          >
            {xLabel(v)}
          </text>
        ))}

      {/* baseline at bottom */}
      <line
        x1={LEFT}
        x2={LEFT + PW}
        y1={TOP + PH}
        y2={TOP + PH}
        stroke={INK}
        strokeWidth={1}
        opacity={0.28}
      />

      {/* lines */}
      {SERIES.map((s, si) => {
        const color = s.accent ? ACCENT : NEUTRAL;
        const d = s.points
          .map((p, i) => (i === 0 ? "M" : "L") + xs(p.x) + " " + ys(p.y))
          .join(" ");
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={color} strokeWidth={LW} />
            {s.points.map((p, i) => (
              <circle
                key={i}
                cx={xs(p.x)}
                cy={ys(p.y)}
                r={DR}
                fill={BG}
                stroke={color}
                strokeWidth={Math.max(2, LW - 1)}
              />
            ))}
            {/* inline right-hand label next to the last point */}
            {(() => {
              const last = s.points[s.points.length - 1];
              return (
                <g>
                  <text
                    x={xs(last.x) + 14}
                    y={ys(last.y) + 4}
                    fill={INK}
                    fontSize={15 * fs}
                    fontWeight={600}
                  >
                    {s.label}
                  </text>
                  {s.caption && (
                    <text
                      x={xs(last.x) + 14}
                      y={ys(last.y) + 24}
                      fill={MUTED}
                      fontSize={12 * fs}
                    >
                      {s.caption}
                    </text>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })}

      {xCaption && (
        <text
          x={LEFT + PW / 2}
          y={TOP + PH + 58}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {xCaption}
        </text>
      )}
      {yCaption && (
        <text
          x={30}
          y={TOP + PH / 2}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.62}
          transform={`rotate(-90, 30, ${TOP + PH / 2})`}
        >
          {yCaption}
        </text>
      )}

      {footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {footnote}
        </text>
      )}
    </svg>
  );
}
