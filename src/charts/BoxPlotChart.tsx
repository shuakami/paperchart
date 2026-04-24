// Horizontal box-and-whisker plot for distribution summaries.
// Each row is a series with { min, q1, median, q3, max, outliers? }.
// One row can be `accent: true` to get highlight color.
//
// data shape:
//   [
//     { label, caption?, min, q1, median, q3, max,
//       outliers?: number[], accent? },
//     ...
//   ]

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Row = {
  label: string;
  caption?: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers?: number[];
  accent?: boolean;
};

type BoxLayout = BaseLayout & {
  rowHeight?: number;
  boxHeight?: number;
  labelWidth?: number;
  xMin?: number;
  xMax?: number;
  xTicks?: number;
  xLabel?: (v: number) => string;
  unit?: string;
  logScale?: boolean;
};

const DEFAULT_DATA: Row[] = [
  {
    label: "legacy runtime",
    caption: "fuzzy scorer",
    min: 2.8, q1: 9.2, median: 14.6, q3: 23.1, max: 54.2,
    outliers: [72.4, 88.6, 117.3],
  },
  {
    label: "inverted index v1",
    caption: "inlined JSON",
    min: 0.8, q1: 1.7, median: 2.9, q3: 5.1, max: 13.2,
    outliers: [19.4, 31.0],
  },
  {
    label: "externalized pack",
    caption: "brotli-11, accent",
    min: 0.3, q1: 0.48, median: 0.61, q3: 0.87, max: 1.62,
    outliers: [2.4, 3.1, 4.8],
    accent: true,
  },
];

export default function BoxPlotChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Row[]>(data);
  const L = layout as BoxLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const SECONDARY = s.secondary ?? th.secondary;
  const BG = s.bg ?? th.bg;
  const SOFT = th.secondarySoft ?? SECONDARY;
  const ACC_SOFT = th.accentSoft ?? ACCENT;

  const rows = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const LEFT = num(L.padding?.left, 56);
  const RIGHT = num(L.padding?.right, 120);
  const TOP = num(L.padding?.top, 72);
  const BOTTOM = num(L.padding?.bottom, 88);
  const rowH = num(L.rowHeight, 120);
  const boxH = num(L.boxHeight, 44);
  const labelW = num(L.labelWidth, 240);
  const H = num(L.height, TOP + rows.length * rowH + BOTTOM);
  const useLog = !!L.logScale;

  const allXs = rows.flatMap((r) => [r.min, r.max, ...(r.outliers ?? [])]);
  const dataMin = Math.min(...allXs);
  const dataMax = Math.max(...allXs);
  const xMin0 = num(L.xMin, useLog ? Math.max(dataMin * 0.8, 1e-3) : Math.min(0, dataMin));
  const xMax0 = num(L.xMax, dataMax * 1.05);
  const plotLeft = LEFT + labelW;
  const plotRight = W - RIGHT;
  const plotW = plotRight - plotLeft;
  const xs = (v: number) => {
    if (useLog) {
      const lo = Math.log10(xMin0);
      const hi = Math.log10(xMax0);
      return plotLeft + ((Math.log10(Math.max(v, xMin0)) - lo) / (hi - lo)) * plotW;
    }
    return plotLeft + ((v - xMin0) / (xMax0 - xMin0)) * plotW;
  };
  const tickCount = num(L.xTicks, useLog ? 5 : 6);
  let ticks: number[];
  if (useLog) {
    const lo = Math.log10(xMin0);
    const hi = Math.log10(xMax0);
    ticks = Array.from({ length: tickCount }, (_, i) => Math.pow(10, lo + (i / (tickCount - 1)) * (hi - lo)));
  } else {
    ticks = Array.from({ length: tickCount }, (_, i) => xMin0 + (i / (tickCount - 1)) * (xMax0 - xMin0));
  }
  const xLabel = L.xLabel ?? ((v: number) => {
    if (v === 0) return "0";
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* vertical guides */}
      {ticks.map((t, i) => (
        <line
          key={`g-${i}`}
          x1={xs(t)}
          x2={xs(t)}
          y1={TOP - 8}
          y2={TOP + rows.length * rowH - 8}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}
      {/* bottom tick labels */}
      {ticks.map((t, i) => (
        <text
          key={`t-${i}`}
          x={xs(t)}
          y={TOP + rows.length * rowH + 12}
          fill={INK}
          fontSize={12 * fs}
          textAnchor="middle"
          opacity={0.72}
          className="tab-nums"
        >
          {xLabel(t)}
          {L.unit ? " " + L.unit : ""}
        </text>
      ))}

      {rows.map((r, ri) => {
        const y0 = TOP + ri * rowH;
        const cy = y0 + rowH / 2 - 6;
        const boxTop = cy - boxH / 2;
        const boxBottom = cy + boxH / 2;
        const x = {
          min: xs(r.min),
          q1: xs(r.q1),
          med: xs(r.median),
          q3: xs(r.q3),
          max: xs(r.max),
        };
        const fillBox = r.accent ? ACC_SOFT : SOFT;
        const strokeBox = r.accent ? ACCENT : INK;
        return (
          <g key={`r-${ri}`}>
            {/* left label */}
            <text x={LEFT} y={cy - 10} fill={INK} fontSize={15 * fs} fontWeight={500}>
              {r.label}
            </text>
            {r.caption && (
              <text x={LEFT} y={cy + 10} fill={MUTED} fontSize={12 * fs}>
                {r.caption}
              </text>
            )}

            {/* whisker line */}
            <line x1={x.min} x2={x.max} y1={cy} y2={cy} stroke={strokeBox} strokeWidth={1.5} opacity={0.8} />
            {/* whisker caps */}
            <line x1={x.min} x2={x.min} y1={cy - 12} y2={cy + 12} stroke={strokeBox} strokeWidth={1.5} opacity={0.8} />
            <line x1={x.max} x2={x.max} y1={cy - 12} y2={cy + 12} stroke={strokeBox} strokeWidth={1.5} opacity={0.8} />

            {/* box */}
            <rect
              x={x.q1}
              y={boxTop}
              width={Math.max(2, x.q3 - x.q1)}
              height={boxH}
              fill={fillBox}
              stroke={strokeBox}
              strokeWidth={r.accent ? 1.75 : 1.25}
            />

            {/* median line */}
            <line x1={x.med} x2={x.med} y1={boxTop} y2={boxBottom} stroke={strokeBox} strokeWidth={2.5} />

            {/* outliers */}
            {(r.outliers ?? []).map((o, oi) => (
              <circle
                key={`o-${ri}-${oi}`}
                cx={xs(o)}
                cy={cy}
                r={3.2}
                fill={BG}
                stroke={strokeBox}
                strokeWidth={1.25}
                opacity={0.85}
              />
            ))}

            {/* annotations on the right: median + q3 */}
            <text
              x={W - RIGHT + 16}
              y={cy - 8}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={600}
              className="tab-nums"
            >
              {xLabel(r.median)} {L.unit ?? ""} median
            </text>
            <text
              x={W - RIGHT + 16}
              y={cy + 10}
              fill={MUTED}
              fontSize={11 * fs}
              className="tab-nums"
            >
              p75 {xLabel(r.q3)}{L.unit ? " " + L.unit : ""}
            </text>
          </g>
        );
      })}

      {str(L.xAxisCaption, "") !== "" && (
        <text x={plotLeft} y={H - 26} fill={MUTED} fontSize={12 * fs}>
          {L.xAxisCaption}
        </text>
      )}
    </svg>
  );
}
