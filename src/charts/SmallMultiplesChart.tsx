// Small multiples. A grid of the same shape (sparkline) repeated across
// subjects. Uses light axes, consistent y-range across panels, and one
// highlighted panel for the focal subject.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Panel = {
  label: string;
  caption?: string;
  values: number[];
  accent?: boolean;
};

type SmallMultiplesInput = {
  xLabels?: string[];
  unit?: string;
  panels: Panel[];
};

type SmLayout = BaseLayout & {
  cols?: number;
  panelGap?: number;
  yMin?: number;
  yMax?: number;
};

function mkSeries(start: number, end: number, len: number, noise = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < len; i++) {
    const t = i / (len - 1);
    const base = start + (end - start) * t;
    const bump = Math.sin(t * Math.PI * 2) * noise;
    out.push(Math.max(0, base + bump));
  }
  return out;
}

const DEFAULT_DATA: SmallMultiplesInput = {
  xLabels: ["'20", "'21", "'22", "'23", "'24", "'25", "'26"],
  unit: "%",
  panels: [
    {
      label: "computer programmers",
      caption: "coverage trend",
      values: mkSeries(6, 75, 7, 2.1),
      accent: true,
    },
    {
      label: "customer service",
      caption: "large, growing",
      values: mkSeries(4, 62, 7, 1.4),
    },
    {
      label: "data entry keyers",
      values: mkSeries(8, 67, 7, 0.8),
    },
    {
      label: "financial analysts",
      values: mkSeries(3, 44, 7, 1.0),
    },
    {
      label: "technical writers",
      values: mkSeries(5, 48, 7, 0.9),
    },
    {
      label: "graphic designers",
      values: mkSeries(2, 36, 7, 1.7),
    },
    {
      label: "paralegals",
      values: mkSeries(1, 29, 7, 0.6),
    },
    {
      label: "market analysts",
      values: mkSeries(2, 31, 7, 0.9),
    },
    {
      label: "accountants",
      values: mkSeries(2, 22, 7, 0.4),
    },
  ],
};

export default function SmallMultiplesChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<SmallMultiplesInput>(data);
  const L = layout as SmLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const NEUTRAL = s.secondary ?? th.secondary;
  const BG = s.bg ?? th.bg;

  const d = input ?? DEFAULT_DATA;
  const panels = d.panels ?? [];
  const xLabels = d.xLabels ?? [];

  const fs = num(L.fontScale, 1);
  const LEFT = num(L.padding?.left, 48);
  const RIGHT = num(L.padding?.right, 48);
  const TOP = num(L.padding?.top, 72);
  const BOTTOM = num(L.padding?.bottom, 80);
  const W = num(L.width, 1600);
  const H = num(L.height, 900);
  const PW = W - LEFT - RIGHT;
  const PH = H - TOP - BOTTOM;

  const cols = num(L.cols, 3);
  const rows = Math.ceil(panels.length / cols);
  const gap = num(L.panelGap, 28);
  const cellW = (PW - gap * (cols - 1)) / cols;
  const cellH = (PH - gap * (rows - 1)) / rows;

  const allValues = panels.flatMap((p) => p.values);
  const yMin = num(L.yMin, 0);
  const yMax = num(L.yMax, Math.max(...allValues, 1) * 1.1);

  const unit = str(d.unit, "");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {panels.map((p, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = LEFT + c * (cellW + gap);
        const y = TOP + r * (cellH + gap);
        const plotH = cellH - 60;
        const plotTop = y + 44;
        const sy = (v: number) => plotTop + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
        const sx = (idx: number) => x + 8 + (idx / (p.values.length - 1)) * (cellW - 16);
        const points = p.values.map((v, idx) => `${sx(idx)},${sy(v)}`).join(" ");
        const color = p.accent ? ACCENT : NEUTRAL;
        const last = p.values[p.values.length - 1] ?? 0;

        return (
          <g key={i}>
            {/* baseline */}
            <line
              x1={x}
              x2={x + cellW}
              y1={y + cellH - 16}
              y2={y + cellH - 16}
              stroke={RULE}
              strokeWidth={1}
            />

            <text x={x} y={y + 16} fill={INK} fontSize={13 * fs} fontWeight={600}>
              {p.label}
            </text>
            {p.caption && (
              <text x={x} y={y + 32} fill={MUTED} fontSize={11 * fs}>
                {p.caption}
              </text>
            )}

            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={p.accent ? 2.25 : 1.5}
              opacity={p.accent ? 1 : 0.85}
            />
            <circle
              cx={sx(p.values.length - 1)}
              cy={sy(last)}
              r={3.5}
              fill={color}
            />
            <text
              x={x + cellW}
              y={y + 16}
              fill={INK}
              fontSize={13 * fs}
              fontWeight={600}
              textAnchor="end"
              className="tab-nums"
            >
              {last.toFixed(0)}
              {unit}
            </text>

            {/* x axis first / last labels */}
            {xLabels.length > 0 && (
              <>
                <text
                  x={x + 2}
                  y={y + cellH - 2}
                  fill={MUTED}
                  fontSize={10 * fs}
                >
                  {xLabels[0]}
                </text>
                <text
                  x={x + cellW - 2}
                  y={y + cellH - 2}
                  fill={MUTED}
                  fontSize={10 * fs}
                  textAnchor="end"
                >
                  {xLabels[xLabels.length - 1]}
                </text>
              </>
            )}
          </g>
        );
      })}

      {L.footnote && (
        <text x={LEFT} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
