// Grouped vertical bars. Each category has N bars side-by-side (one per
// series). Useful for "theoretical vs observed", "before vs after", etc.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Group = {
  label: string;
  caption?: string;
  values: Record<string, number>;
};

type GroupedInput = {
  series: { key: string; label: string; color?: string }[];
  groups: Group[];
};

type GroupedLayout = BaseLayout & {
  barWidth?: number;
  barGap?: number;
  groupGap?: number;
  yMax?: number;
  unit?: string;
};

const DEFAULT_DATA: GroupedInput = {
  series: [
    { key: "theoretical", label: "theoretically feasible" },
    { key: "observed", label: "observed in traffic" },
  ],
  groups: [
    {
      label: "computer & math",
      caption: "software, data, research",
      values: { theoretical: 94, observed: 33 },
    },
    {
      label: "office & admin",
      values: { theoretical: 90, observed: 22 },
    },
    {
      label: "sales & related",
      values: { theoretical: 72, observed: 18 },
    },
    {
      label: "legal",
      values: { theoretical: 69, observed: 14 },
    },
    {
      label: "healthcare support",
      values: { theoretical: 38, observed: 9 },
    },
    {
      label: "construction",
      caption: "field, install, repair",
      values: { theoretical: 9, observed: 2 },
    },
  ],
};

export default function GroupedBarChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<GroupedInput>(data);
  const L = layout as GroupedLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const NEUTRAL = s.secondary ?? th.secondary;
  const SOFT = th.secondarySoft ?? NEUTRAL;
  const BG = s.bg ?? th.bg;

  const d = input ?? DEFAULT_DATA;
  const series = d.series ?? [];
  const groups = d.groups ?? [];

  // Prefer the theme's ordered N-color palette so 4+ series stay distinct.
  // Fall back to the legacy [accent, secondary, secondarySoft] triple, which
  // cycles for any fourth series — that's the "pairs of identical bars" bug.
  const palette = th.palette && th.palette.length >= 3
    ? th.palette
    : [ACCENT, NEUTRAL, SOFT];

  const fs = num(L.fontScale, 1);
  const LEFT = num(L.padding?.left, 88);
  const RIGHT = num(L.padding?.right, 48);
  const TOP = num(L.padding?.top, 88);
  const BOTTOM = num(L.padding?.bottom, 120);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;

  const unit = str(L.unit, "");
  const allValues: number[] = [];
  groups.forEach((g) =>
    series.forEach((se) => allValues.push(g.values[se.key] ?? 0)),
  );
  const yMax = num(L.yMax, Math.max(...allValues, 1) * 1.08);
  const sy = (v: number) => TOP + PH - (v / yMax) * PH;

  const nGroups = groups.length || 1;
  const groupW = PW / nGroups;
  const barGap = num(L.barGap, 6);
  const groupPad = num(L.groupGap, 0.22) * groupW;
  const barsAreaW = groupW - 2 * groupPad;
  const barW = num(
    L.barWidth,
    Math.max(6, (barsAreaW - barGap * (series.length - 1)) / Math.max(series.length, 1)),
  );

  // y ticks: 0, 25%, 50%, 75%, 100% of yMax
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {/* legend */}
      <g transform={`translate(${LEFT}, ${TOP - 42})`}>
        {series.map((se, i) => (
          <g key={se.key} transform={`translate(${i * 260}, 0)`}>
            <rect width={14} height={14} fill={se.color ?? palette[i % palette.length]} />
            <text x={22} y={12} fill={INK} fontSize={13 * fs} fontWeight={500}>
              {se.label}
            </text>
          </g>
        ))}
      </g>

      {/* y grid + ticks */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={LEFT}
            x2={LEFT + PW}
            y1={sy(t)}
            y2={sy(t)}
            stroke={RULE}
            strokeWidth={1}
            strokeDasharray={i === 0 ? "" : "2 4"}
          />
          <text
            x={LEFT - 14}
            y={sy(t) + 4}
            fill={MUTED}
            fontSize={12 * fs}
            textAnchor="end"
            className="tab-nums"
          >
            {Math.round(t)}
            {unit}
          </text>
        </g>
      ))}

      {/* bars */}
      {groups.map((g, gi) => {
        const gx = LEFT + gi * groupW + groupPad;
        const cy = TOP + PH;
        return (
          <g key={gi}>
            {series.map((se, si) => {
              const v = g.values[se.key] ?? 0;
              const x = gx + si * (barW + barGap);
              const y = sy(v);
              const h = cy - y;
              const color = se.color ?? palette[si % palette.length];
              return (
                <g key={se.key}>
                  <rect x={x} y={y} width={barW} height={h} fill={color} />
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    fill={INK}
                    fontSize={12 * fs}
                    fontWeight={600}
                    textAnchor="middle"
                    className="tab-nums"
                  >
                    {v.toFixed(0)}
                    {unit}
                  </text>
                </g>
              );
            })}
            <text
              x={gx + barsAreaW / 2}
              y={cy + 22}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={500}
              textAnchor="middle"
            >
              {g.label}
            </text>
            {g.caption && (
              <text
                x={gx + barsAreaW / 2}
                y={cy + 40}
                fill={MUTED}
                fontSize={11 * fs}
                textAnchor="middle"
              >
                {g.caption}
              </text>
            )}
          </g>
        );
      })}

      {L.xAxisCaption && (
        <text
          x={LEFT + PW / 2}
          y={H - 40}
          fill={INK}
          fontSize={13 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {L.xAxisCaption}
        </text>
      )}

      {L.footnote && (
        <text x={LEFT} y={H - 18} fill={INK} fontSize={11 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
