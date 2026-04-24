// Radar / spider chart for multi-axis comparison. Each axis is a metric
// (0..1 range by default, or 0..max per axis). Each series is a polygon across
// all axes. One series may be `accent: true`.
//
// data shape:
//   { axes: [{ key, label, caption?, max? }],
//     series: [{ label, caption?, accent?, values: { [axisKey]: number } }] }

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Axis = { key: string; label: string; caption?: string; max?: number };
type Series = {
  label: string;
  caption?: string;
  accent?: boolean;
  values: Record<string, number>;
};
type RadarInput = { axes: Axis[]; series: Series[] };

type RadarLayout = BaseLayout & {
  rings?: number;
  showLegend?: boolean;
};

const DEFAULT_DATA: RadarInput = {
  axes: [
    { key: "reasoning", label: "reasoning",        caption: "GPQA Diamond" },
    { key: "coding",    label: "coding",           caption: "SWE-bench" },
    { key: "terminal",  label: "terminal",         caption: "T-Bench 2.0" },
    { key: "search",    label: "agentic search",   caption: "BrowseComp" },
    { key: "tools",     label: "tool use",         caption: "MCP-Atlas" },
    { key: "computer",  label: "computer use",     caption: "OSWorld" },
    { key: "finance",   label: "finance agent",    caption: "Fin-Agent 1.1" },
    { key: "cyber",     label: "cyber",            caption: "CyberGym" },
  ],
  series: [
    {
      label: "previous release",
      caption: "four months ago",
      values: {
        reasoning: 0.91, coding: 0.53, terminal: 0.65, search: 0.84,
        tools: 0.76, computer: 0.73, finance: 0.60, cyber: 0.74,
      },
    },
    {
      label: "current release",
      caption: "accent",
      accent: true,
      values: {
        reasoning: 0.94, coding: 0.64, terminal: 0.69, search: 0.79,
        tools: 0.77, computer: 0.78, finance: 0.64, cyber: 0.73,
      },
    },
  ],
};

export default function RadarChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<RadarInput>(data);
  const L = layout as RadarLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const SECONDARY = s.secondary ?? th.secondary;
  const BG = s.bg ?? th.bg;

  const d = input ?? DEFAULT_DATA;
  const axes = d.axes ?? [];
  const series = d.series ?? [];
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const LEFT = num(L.padding?.left, 80);
  const RIGHT = num(L.padding?.right, 80);
  const TOP = num(L.padding?.top, 80);
  const BOTTOM = num(L.padding?.bottom, 80);
  const rings = num(L.rings, 4);

  const cx = (LEFT + W - RIGHT) / 2;
  const cy = (TOP + H - BOTTOM) / 2;
  const radius = Math.max(60, Math.min(W - LEFT - RIGHT, H - TOP - BOTTOM) / 2 - 40);

  const n = axes.length;
  const angle = (i: number) => (-Math.PI / 2) + (i / n) * Math.PI * 2;
  const pt = (r: number, i: number) => ({
    x: cx + Math.cos(angle(i)) * r,
    y: cy + Math.sin(angle(i)) * r,
  });

  const normVal = (axis: Axis, v: number): number => {
    const max = axis.max ?? 1;
    return Math.max(0, Math.min(1, v / max));
  };

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* concentric rings */}
      {Array.from({ length: rings }, (_, ri) => {
        const r = ((ri + 1) / rings) * radius;
        const pts = axes.map((_, i) => pt(r, i));
        const dStr = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        return (
          <path
            key={`ring-${ri}`}
            d={dStr}
            fill="none"
            stroke={RULE}
            strokeWidth={1}
          />
        );
      })}

      {/* radial axes */}
      {axes.map((_, i) => {
        const p = pt(radius, i);
        return (
          <line
            key={`ax-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={RULE}
            strokeWidth={1}
          />
        );
      })}

      {/* series polygons */}
      {series.map((ss, si) => {
        const pts = axes.map((ax, i) =>
          pt(normVal(ax, ss.values?.[ax.key] ?? 0) * radius, i),
        );
        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
        const stroke = ss.accent ? ACCENT : SECONDARY;
        const fill = ss.accent ? ACCENT : SECONDARY;
        return (
          <g key={`s-${si}`}>
            <path d={pathD} fill={fill} fillOpacity={ss.accent ? 0.14 : 0.08} stroke={stroke} strokeWidth={ss.accent ? 2.25 : 1.6} strokeOpacity={ss.accent ? 1 : 0.7} />
            {pts.map((p, i) => (
              <circle
                key={`dot-${si}-${i}`}
                cx={p.x}
                cy={p.y}
                r={ss.accent ? 3.8 : 2.8}
                fill={stroke}
                opacity={ss.accent ? 1 : 0.8}
              />
            ))}
          </g>
        );
      })}

      {/* axis labels */}
      {axes.map((ax, i) => {
        const p = pt(radius + 28, i);
        const a = angle(i);
        const anchor = Math.cos(a) > 0.25 ? "start" : Math.cos(a) < -0.25 ? "end" : "middle";
        return (
          <g key={`lb-${i}`}>
            <text x={p.x} y={p.y - 4} fill={INK} fontSize={13 * fs} fontWeight={500} textAnchor={anchor}>
              {ax.label}
            </text>
            {ax.caption && (
              <text x={p.x} y={p.y + 12} fill={MUTED} fontSize={11 * fs} textAnchor={anchor}>
                {ax.caption}
              </text>
            )}
          </g>
        );
      })}

      {/* legend top-right */}
      {series.length > 0 && (
        <g transform={`translate(${W - RIGHT - 260}, ${TOP - 30})`}>
          {series.map((ss, si) => (
            <g key={`lg-${si}`} transform={`translate(0, ${si * 22})`}>
              <rect width={14} height={14} fill={ss.accent ? ACCENT : SECONDARY} opacity={ss.accent ? 1 : 0.7} />
              <text x={22} y={12} fill={INK} fontSize={13 * fs}>
                {ss.label}
              </text>
              {ss.caption && (
                <text x={22 + ss.label.length * 8 + 14} y={12} fill={MUTED} fontSize={12 * fs}>
                  {ss.caption}
                </text>
              )}
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
