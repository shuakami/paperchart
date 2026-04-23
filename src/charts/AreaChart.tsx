// Stacked area chart. Each series renders as a filled band stacked above the
// previous one. Good for composition-over-time stories.

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
type Band = {
  label: string;
  accent?: boolean;
  points: Point[];
};

type AreaLayout = BaseLayout & {
  yMax?: number;
  xTicks?: number;
  yTicks?: number;
};

const DEFAULT_BANDS: Band[] = [
  {
    label: "other chunks",
    accent: false,
    points: Array.from({ length: 12 }, (_, i) => ({
      x: i,
      y: 60 + Math.sin(i / 2) * 8,
    })),
  },
  {
    label: "search index",
    accent: true,
    points: Array.from({ length: 12 }, (_, i) => ({
      x: i,
      y: i < 6 ? 180 - i * 10 : 40 - (i - 6) * 5,
    })),
  },
];

function softer(hex: string, fallback: string): string {
  // build a slightly lighter variant of a hex color for stacking aesthetics
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * 0.35 + 255 * 0.65));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * 0.35 + 255 * 0.65));
  const b = Math.min(255, Math.round((n & 255) * 0.35 + 255 * 0.65));
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

export default function AreaChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Band[]>(data);
  const L = layout as AreaLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const BANDS = input ?? DEFAULT_BANDS;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 110);
  const RIGHT = num(L.padding?.right, 260);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 100);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;

  const xs = BANDS[0]?.points.map((p) => p.x) ?? [];
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const xSpan = xMax - xMin || 1;
  const sx = (v: number) => LEFT + ((v - xMin) / xSpan) * PW;

  // compute stacked y totals per x
  const totalsPerX = xs.map((_, i) =>
    BANDS.reduce((acc, b) => acc + (b.points[i]?.y ?? 0), 0),
  );
  const yMax = num(L.yMax, Math.max(...totalsPerX) * 1.08);
  const sy = (v: number) => TOP + PH - (v / yMax) * PH;

  // compute stacked values per band
  const stacked: { lower: number; upper: number }[][] = [];
  for (let si = 0; si < BANDS.length; si++) {
    stacked.push(
      BANDS[si].points.map((p, i) => {
        const prev = si === 0 ? 0 : stacked[si - 1][i].upper;
        return { lower: prev, upper: prev + p.y };
      }),
    );
  }

  const yTickCount = num(L.yTicks, 5);
  const yTicks = Array.from({ length: yTickCount }, (_, i) =>
    Math.round((yMax * i) / (yTickCount - 1)),
  );

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

      {/* stacked bands */}
      {BANDS.map((b, bi) => {
        const color = b.accent ? ACCENT : NEUTRAL;
        const soft = softer(color, color);
        const topPath = b.points
          .map((p, i) => (i === 0 ? "M" : "L") + sx(p.x) + " " + sy(stacked[bi][i].upper))
          .join(" ");
        const bottomPath = b.points
          .slice()
          .reverse()
          .map((p, i) => {
            const idx = b.points.length - 1 - i;
            return "L" + sx(p.x) + " " + sy(stacked[bi][idx].lower);
          })
          .join(" ");
        const d = topPath + " " + bottomPath + " Z";
        // inline label at right edge
        const last = b.points[b.points.length - 1];
        const yMid =
          (sy(stacked[bi][b.points.length - 1].upper) +
            sy(stacked[bi][b.points.length - 1].lower)) /
          2;
        return (
          <g key={bi}>
            <path d={d} fill={b.accent ? color : soft} stroke={color} strokeWidth={1.5} />
            <text
              x={sx(last.x) + 14}
              y={yMid + 4}
              fill={INK}
              fontSize={14 * fs}
              fontWeight={600}
            >
              {b.label}
            </text>
          </g>
        );
      })}

      {/* x-axis ticks: use BANDS[0] xs */}
      {!bool(L.hideXTicks) &&
        xs.map((v, i) => (
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
            {v}
          </text>
        ))}

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

      {footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {footnote}
        </text>
      )}
    </svg>
  );
}
