// Conversion funnel. Each stage is a horizontal bar whose width is
// proportional to its count. Drop-off between stages is rendered as a small
// muted delta ("-42%  −6.1M"). The bottom stage can be `accent: true`.
//
// data shape:
//   [
//     { label, caption?, count, accent? },
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

type Stage = { label: string; caption?: string; count: number; accent?: boolean };

type FunnelLayout = BaseLayout & {
  barHeight?: number;
  rowGap?: number;
  labelWidth?: number;
  valueFormat?: (v: number) => string;
  unit?: string;
};

const DEFAULT_DATA: Stage[] = [
  { label: "landing view",     caption: "any /docs page",              count: 14_230_000 },
  { label: "search opened",    caption: "⌘K or / pressed",             count: 4_610_000 },
  { label: "query submitted",  caption: "at least one keystroke",       count: 3_980_000 },
  { label: "result clicked",   caption: "first 10 hits",                count: 2_730_000 },
  { label: "page consumed",    caption: "scrolled past fold",           count: 1_820_000, accent: true },
];

function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2).replace(/\.0+$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.0+$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function FunnelChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Stage[]>(data);
  const L = layout as FunnelLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const SOFT = th.secondarySoft ?? th.secondary;

  const stages = input ?? DEFAULT_DATA;
  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const LEFT = num(L.padding?.left, 64);
  const RIGHT = num(L.padding?.right, 64);
  const TOP = num(L.padding?.top, 64);
  const BOTTOM = num(L.padding?.bottom, 64);
  const barH = num(L.barHeight, 58);
  const rowGap = num(L.rowGap, 48);
  const labelW = num(L.labelWidth, 280);
  const H = num(L.height, TOP + stages.length * (barH + rowGap) - rowGap + BOTTOM);

  const top = stages[0]?.count ?? 1;
  const plotLeft = LEFT + labelW;
  const plotRight = W - RIGHT - 180; // reserve right rail for delta
  const plotW = plotRight - plotLeft;
  const fmt = L.valueFormat ?? compactNumber;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {stages.map((st, i) => {
        const y0 = TOP + i * (barH + rowGap);
        const w = Math.max(4, (st.count / top) * plotW);
        const centerX = plotLeft + (plotW - w) / 2;
        const fill = st.accent ? ACCENT : SOFT;
        const valColor = st.accent ? ACCENT : INK;
        const prev = i > 0 ? stages[i - 1].count : null;
        const delta = prev !== null ? st.count / prev : null;
        const deltaLoss = prev !== null ? st.count - prev : null;
        return (
          <g key={`stage-${i}`}>
            {/* left label + caption */}
            <text x={LEFT} y={y0 + barH / 2 - 2} fill={INK} fontSize={15 * fs} fontWeight={500}>
              {st.label}
            </text>
            {st.caption && (
              <text x={LEFT} y={y0 + barH / 2 + 18} fill={MUTED} fontSize={12 * fs}>
                {st.caption}
              </text>
            )}

            {/* bar */}
            <rect x={centerX} y={y0} width={w} height={barH} fill={fill} />

            {/* absolute value on the bar's right-inside edge or just after */}
            <text
              x={centerX + w / 2}
              y={y0 + barH / 2 + 7}
              fill={st.accent ? "#FFFFFF" : INK}
              fontSize={19 * fs}
              fontWeight={600}
              textAnchor="middle"
              className="tab-nums"
              opacity={st.accent ? 1 : 0.9}
            >
              {fmt(st.count)}
              {L.unit ? " " + L.unit : ""}
            </text>

            {/* right: conversion from previous + absolute loss */}
            {delta !== null && (
              <g>
                <text
                  x={W - RIGHT}
                  y={y0 + barH / 2 - 2}
                  fill={valColor}
                  fontSize={15 * fs}
                  fontWeight={600}
                  textAnchor="end"
                  className="tab-nums"
                >
                  {(delta * 100).toFixed(1)}%
                </text>
                <text
                  x={W - RIGHT}
                  y={y0 + barH / 2 + 18}
                  fill={MUTED}
                  fontSize={12 * fs}
                  textAnchor="end"
                  className="tab-nums"
                >
                  {deltaLoss !== null && deltaLoss < 0 ? "−" : ""}
                  {fmt(Math.abs(deltaLoss ?? 0))} lost
                </text>
              </g>
            )}

            {/* thin connector between stages */}
            {i < stages.length - 1 && (
              <line
                x1={plotLeft + plotW / 2}
                x2={plotLeft + plotW / 2}
                y1={y0 + barH}
                y2={y0 + barH + rowGap}
                stroke={RULE}
                strokeWidth={1}
              />
            )}
          </g>
        );
      })}

      {str(L.footnote, "") !== "" && (
        <text x={LEFT} y={H - 26} fill={MUTED} fontSize={12 * fs}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
