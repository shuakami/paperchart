// Stacked horizontal bar (composition). One bar per row, segments sum to 100
// or to `total`. The first segment takes the accent color; the rest fall back
// to secondary variants from the theme.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Seg = { key: string; value: number; color?: string };
type Row = { label: string; segments: Seg[]; caption?: string };

type StackedLayout = BaseLayout & {
  barHeight?: number;
  rowGap?: number;
  unit?: string;
  labelWidth?: number;
  showValueLabels?: boolean;
};

const DEFAULT_ROWS: Row[] = [
  {
    label: "computer & math",
    caption: "software, data, research",
    segments: [
      { key: "fully automated", value: 41 },
      { key: "assistive", value: 34 },
      { key: "not observed", value: 25 },
    ],
  },
  {
    label: "office & admin",
    caption: "scheduling, records, support",
    segments: [
      { key: "fully automated", value: 22 },
      { key: "assistive", value: 44 },
      { key: "not observed", value: 34 },
    ],
  },
  {
    label: "education",
    caption: "teaching, grading, prep",
    segments: [
      { key: "fully automated", value: 8 },
      { key: "assistive", value: 38 },
      { key: "not observed", value: 54 },
    ],
  },
  {
    label: "installation & repair",
    caption: "hands-on, on-site",
    segments: [
      { key: "fully automated", value: 1 },
      { key: "assistive", value: 9 },
      { key: "not observed", value: 90 },
    ],
  },
  {
    label: "food preparation",
    caption: "cooks, bakers, prep",
    segments: [
      { key: "fully automated", value: 0 },
      { key: "assistive", value: 3 },
      { key: "not observed", value: 97 },
    ],
  },
];

export default function StackedBarChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Row[]>(data);
  const L = layout as StackedLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const NEUTRAL = s.secondary ?? th.secondary;
  const SOFT = th.secondarySoft ?? NEUTRAL;
  const BG = s.bg ?? th.bg;

  const rows = input ?? DEFAULT_ROWS;
  const fs = num(L.fontScale, 1);
  const barH = num(L.barHeight, 36);
  const gap = num(L.rowGap, 30);
  const LEFT = num(L.padding?.left, 48);
  const RIGHT = num(L.padding?.right, 72);
  const TOP = num(L.padding?.top, 90);
  const BOTTOM = num(L.padding?.bottom, 80);
  const labelW = num(L.labelWidth, 340);
  const rowH = barH + gap;
  const W = num(L.width, 1600);
  const H = num(L.height, TOP + rows.length * rowH + BOTTOM);
  const PW = W - LEFT - RIGHT - labelW;
  const showValues = L.showValueLabels !== false;
  const unit = str(L.unit, "%");

  const colorFor = (idx: number) => {
    if (idx === 0) return ACCENT;
    if (idx === 1) return NEUTRAL;
    return SOFT;
  };

  // collect union of series keys for the legend
  const seriesKeys: string[] = [];
  rows.forEach((r) =>
    r.segments.forEach((g) => {
      if (!seriesKeys.includes(g.key)) seriesKeys.push(g.key);
    }),
  );

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {/* legend, top of plot */}
      <g transform={`translate(${LEFT + labelW},${TOP - 40})`}>
        {seriesKeys.map((k, i) => (
          <g key={k} transform={`translate(${i * 220},0)`}>
            <rect width={14} height={14} fill={colorFor(i)} />
            <text
              x={22}
              y={12}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={500}
            >
              {k}
            </text>
          </g>
        ))}
      </g>

      {rows.map((r, i) => {
        const y = TOP + i * rowH;
        const total = r.segments.reduce((a, b) => a + b.value, 0) || 1;
        let cx = LEFT + labelW;
        return (
          <g key={i}>
            <text
              x={LEFT + labelW - 18}
              y={y + barH / 2 - 2}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={600}
              textAnchor="end"
            >
              {r.label}
            </text>
            {r.caption && (
              <text
                x={LEFT + labelW - 18}
                y={y + barH / 2 + 17}
                fill={MUTED}
                fontSize={12 * fs}
                textAnchor="end"
              >
                {r.caption}
              </text>
            )}

            {r.segments.map((seg, si) => {
              const w = (seg.value / total) * PW;
              const color = seg.color ?? colorFor(seriesKeys.indexOf(seg.key));
              const rect = (
                <rect
                  key={`rect-${si}`}
                  x={cx}
                  y={y}
                  width={w}
                  height={barH}
                />
              );
              const labelX = cx + w / 2;
              const label =
                showValues && w > 56 ? (
                  <text
                    key={`lab-${si}`}
                    x={labelX}
                    y={y + barH / 2 + 5}
                    fill={si === 0 ? th.bg : INK}
                    fontSize={12 * fs}
                    textAnchor="middle"
                    className="tab-nums"
                    fontWeight={600}
                  >
                    {seg.value.toFixed(seg.value < 10 ? 1 : 0)}
                    {unit}
                  </text>
                ) : null;
              cx += w;
              return (
                <g key={`seg-${si}`} fill={color}>
                  {rect}
                  {label}
                </g>
              );
            })}
          </g>
        );
      })}

      <line
        x1={LEFT + labelW}
        x2={LEFT + labelW + PW}
        y1={TOP + rows.length * rowH - gap + 6}
        y2={TOP + rows.length * rowH - gap + 6}
        stroke={RULE}
        strokeWidth={1}
      />

      {L.xAxisCaption && (
        <text
          x={LEFT + labelW + PW / 2}
          y={TOP + rows.length * rowH - gap + 36}
          fill={INK}
          fontSize={13 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {L.xAxisCaption}
        </text>
      )}

      {L.footnote && (
        <text x={LEFT} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
