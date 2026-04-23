// Waterfall chart — sequential additive/subtractive contributions that sum
// to a final value. First and last bars are pinned to zero.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Step = {
  label: string;
  caption?: string;
  value: number; // positive = gain, negative = loss
  kind?: "total" | "gain" | "loss"; // overrides auto detection
};

type WfLayout = BaseLayout & {
  barWidth?: number;
  gap?: number;
  unit?: string;
  yMin?: number;
  yMax?: number;
};

const DEFAULT_STEPS: Step[] = [
  { label: "baseline", value: 252, kind: "total", caption: "original brotli bytes" },
  { label: "varint + delta ids", value: -46, caption: "replace 32-bit ints with varint" },
  { label: "3-bit type flag", value: -14, caption: "pack entry prefix into header byte" },
  { label: "dedup corrections", value: -22, caption: "shared suffix table" },
  { label: "run-length postings", value: -18, caption: "compress identical adjacent ids" },
  { label: "externalize", value: -76, caption: "ship as /search-pack.bin separately" },
  { label: "first-load bytes", value: 76, kind: "total", caption: "what the browser actually pays" },
];

export default function WaterfallChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Step[]>(data);
  const L = layout as WfLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  const STEPS = input ?? DEFAULT_STEPS;
  const fs = num(L.fontScale, 1);
  const barW = num(L.barWidth, 120);
  const gap = num(L.gap, 60);
  const LEFT = num(L.padding?.left, 100);
  const RIGHT = num(L.padding?.right, 80);
  const TOP = num(L.padding?.top, 140);
  const BOTTOM = num(L.padding?.bottom, 140);
  const W = num(L.width, LEFT + STEPS.length * (barW + gap) + RIGHT);
  const unit = str(L.unit, "KB");

  // compute cumulative values
  let running = 0;
  const bars = STEPS.map((st, i) => {
    const isTotal = st.kind === "total";
    const kind =
      st.kind ?? (st.value >= 0 ? "gain" : "loss");
    let from: number;
    let to: number;
    if (isTotal) {
      from = 0;
      to = st.value;
      running = st.value;
    } else {
      from = running;
      to = running + st.value;
      running = to;
    }
    return { step: st, from, to, kind, idx: i };
  });

  const allVals = bars.flatMap((b) => [b.from, b.to]);
  const yMin = num(L.yMin, Math.min(0, ...allVals));
  const yMax = num(L.yMax, Math.max(...allVals) * 1.12);
  const H = num(L.height, 900);
  const PH = H - TOP - BOTTOM;
  const sy = (v: number) => TOP + PH - ((v - yMin) / (yMax - yMin || 1)) * PH;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {L.title && (
        <text x={LEFT} y={48} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {L.title}
        </text>
      )}
      {L.subtitle && (
        <text x={LEFT} y={L.title ? 74 : 56} fill={MUTED} fontSize={14 * fs}>
          {L.subtitle}
        </text>
      )}

      {/* baseline */}
      <line
        x1={LEFT}
        x2={W - RIGHT}
        y1={sy(0)}
        y2={sy(0)}
        stroke={INK}
        strokeWidth={1}
        opacity={0.3}
      />

      {/* bars with connectors */}
      {bars.map((b, i) => {
        const x = LEFT + i * (barW + gap);
        const yTop = sy(Math.max(b.from, b.to));
        const yBot = sy(Math.min(b.from, b.to));
        const color =
          b.kind === "total" ? ACCENT : b.kind === "loss" ? NEUTRAL : ACCENT;
        const displayVal = b.kind === "total" ? b.to : b.step.value;
        const valText =
          (b.step.value > 0 && b.kind !== "total" ? "+" : "") +
          displayVal +
          " " +
          unit;
        const next = bars[i + 1];
        return (
          <g key={i}>
            <rect
              x={x}
              y={yTop}
              width={barW}
              height={Math.max(2, yBot - yTop)}
              fill={color}
              opacity={b.kind === "loss" ? 0.7 : 1}
            />
            {/* connector from top of this bar to start of next */}
            {next && (
              <line
                x1={x + barW}
                x2={x + barW + gap}
                y1={sy(b.to)}
                y2={sy(next.from)}
                stroke={INK}
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            {/* label under bar */}
            <text
              x={x + barW / 2}
              y={H - BOTTOM + 28}
              fill={INK}
              fontSize={14 * fs}
              fontWeight={600}
              textAnchor="middle"
            >
              {b.step.label}
            </text>
            {b.step.caption && (
              <text
                x={x + barW / 2}
                y={H - BOTTOM + 48}
                fill={MUTED}
                fontSize={12 * fs}
                textAnchor="middle"
              >
                {b.step.caption}
              </text>
            )}
            {/* value above bar */}
            <text
              x={x + barW / 2}
              y={yTop - 10}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={600}
              textAnchor="middle"
              className="tab-nums"
            >
              {valText}
            </text>
          </g>
        );
      })}

      {L.footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
