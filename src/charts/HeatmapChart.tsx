// Matrix heatmap. Rows and columns labeled, cells colored from rule → accent.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  bool,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Heatmap = {
  xLabels: string[];
  yLabels: string[];
  values: number[][]; // values[row][col]
};

type HeatLayout = BaseLayout & {
  cellSize?: number;
  min?: number;
  max?: number;
  showValues?: boolean;
  valueFormat?: (v: number) => string;
};

function interp(from: string, to: string, t: number): string {
  const ph = (h: string) =>
    /^#[0-9a-f]{6}$/i.test(h)
      ? [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16))
      : [200, 200, 200];
  const a = ph(from);
  const b = ph(to);
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t));
  return (
    "#" +
    c
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

const DEFAULT_HEATMAP: Heatmap = {
  xLabels: ["q=0.1", "q=0.5", "q=0.9", "q=0.99", "q=1.0"],
  yLabels: ["p50", "p75", "p90", "p95", "p99", "p99.9"],
  values: [
    [0.08, 0.12, 0.18, 0.22, 0.3],
    [0.1, 0.16, 0.22, 0.29, 0.4],
    [0.14, 0.22, 0.32, 0.44, 0.6],
    [0.2, 0.28, 0.4, 0.52, 0.8],
    [0.28, 0.42, 0.58, 0.74, 1.0],
    [0.55, 0.72, 0.9, 1.2, 1.6],
  ],
};

export default function HeatmapChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Heatmap>(data);
  const L = layout as HeatLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const HM = input ?? DEFAULT_HEATMAP;
  const cell = num(L.cellSize, 100);
  const fs = num(L.fontScale, 1);
  const nCols = HM.xLabels.length;
  const nRows = HM.yLabels.length;
  const LEFT = num(L.padding?.left, 200);
  const RIGHT = num(L.padding?.right, 220);
  const TOP = num(L.padding?.top, 120);
  const BOTTOM = num(L.padding?.bottom, 120);
  const W = num(L.width, LEFT + cell * nCols + RIGHT);
  const H = num(L.height, TOP + cell * nRows + BOTTOM);
  const flat = HM.values.flat();
  const vMin = num(L.min, Math.min(...flat));
  const vMax = num(L.max, Math.max(...flat));
  const showValues = bool(L.showValues, true);
  const fmt = L.valueFormat ?? ((v: number) => v.toFixed(2));

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {L.title && (
        <text x={LEFT} y={56} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {L.title}
        </text>
      )}
      {L.subtitle && (
        <text x={LEFT} y={L.title ? 82 : 56} fill={MUTED} fontSize={14 * fs}>
          {L.subtitle}
        </text>
      )}

      {/* row labels */}
      {HM.yLabels.map((label, r) => (
        <text
          key={`yl-${r}`}
          x={LEFT - 14}
          y={TOP + r * cell + cell / 2 + 5}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="end"
          opacity={0.85}
          className="tab-nums"
        >
          {label}
        </text>
      ))}

      {/* col labels */}
      {HM.xLabels.map((label, c) => (
        <text
          key={`xl-${c}`}
          x={LEFT + c * cell + cell / 2}
          y={TOP - 14}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.85}
          className="tab-nums"
        >
          {label}
        </text>
      ))}

      {/* cells */}
      {HM.values.map((row, r) =>
        row.map((v, c) => {
          const t = vMax === vMin ? 0 : (v - vMin) / (vMax - vMin);
          const color = interp(RULE, ACCENT, t);
          const dark = t > 0.55;
          return (
            <g key={`${r}-${c}`}>
              <rect
                x={LEFT + c * cell}
                y={TOP + r * cell}
                width={cell}
                height={cell}
                fill={color}
                stroke={BG}
                strokeWidth={2}
              />
              {showValues && (
                <text
                  x={LEFT + c * cell + cell / 2}
                  y={TOP + r * cell + cell / 2 + 5}
                  fill={dark ? BG : INK}
                  fontSize={14 * fs}
                  fontWeight={600}
                  textAnchor="middle"
                  className="tab-nums"
                >
                  {fmt(v)}
                </text>
              )}
            </g>
          );
        }),
      )}

      {/* legend */}
      <g transform={`translate(${LEFT + nCols * cell + 40}, ${TOP})`}>
        <text x={0} y={-6} fill={INK} fontSize={13 * fs} opacity={0.72}>
          scale
        </text>
        {Array.from({ length: 20 }, (_, i) => i).map((i) => (
          <rect
            key={i}
            x={0}
            y={i * 12}
            width={30}
            height={12}
            fill={interp(RULE, ACCENT, i / 19)}
            stroke={BG}
            strokeWidth={1}
          />
        ))}
        <text
          x={40}
          y={8}
          fill={INK}
          fontSize={13 * fs}
          opacity={0.72}
          className="tab-nums"
        >
          {fmt(vMax)}
        </text>
        <text
          x={40}
          y={20 * 12 - 2}
          fill={INK}
          fontSize={13 * fs}
          opacity={0.72}
          className="tab-nums"
        >
          {fmt(vMin)}
        </text>
      </g>

      {L.footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
