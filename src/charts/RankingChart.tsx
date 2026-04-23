// Sorted horizontal bar ranking (leaderboard). One accented bar marks the
// author's own entry; the rest are neutral.

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
  value: number;
  caption?: string;
  accent?: boolean;
};

type RankLayout = BaseLayout & {
  xMax?: number;
  barHeight?: number;
  rowGap?: number;
  unit?: string;
  sort?: "desc" | "asc" | "none";
};

const DEFAULT_ROWS: Row[] = [
  { label: "monorepo A · docs", value: 842, caption: "Next.js + Fuse" },
  { label: "monorepo B · docs", value: 514, caption: "Docusaurus + Algolia" },
  { label: "this project (legacy)", value: 252, caption: "custom inverted index, embedded" },
  { label: "Anthropic docs", value: 210, caption: "static prebuilt index" },
  { label: "this project (current)", value: 76, caption: "externalized binary pack", accent: true },
  { label: "Stripe API ref", value: 62, caption: "server-rendered search" },
];

export default function RankingChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Row[]>(data);
  const L = layout as RankLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  let ROWS = [...(input ?? DEFAULT_ROWS)];
  const sortMode = str(L.sort, "desc");
  if (sortMode === "desc") ROWS.sort((a, b) => b.value - a.value);
  if (sortMode === "asc") ROWS.sort((a, b) => a.value - b.value);

  const fs = num(L.fontScale, 1);
  const barH = num(L.barHeight, 46);
  const gap = num(L.rowGap, 28);
  const LEFT = num(L.padding?.left, 400);
  const RIGHT = num(L.padding?.right, 180);
  const TOP = num(L.padding?.top, 60);
  const BOTTOM = num(L.padding?.bottom, 90);
  const W = num(L.width, 1600);
  const rowH = barH + gap;
  const H = num(L.height, TOP + ROWS.length * rowH + BOTTOM);
  const PW = W - LEFT - RIGHT;
  const xMax = num(L.xMax, Math.max(...ROWS.map((r) => r.value)) * 1.05);
  const sx = (v: number) => LEFT + (v / xMax) * PW;
  const unit = str(L.unit, "");

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {L.title && (
        <text x={40} y={42} fill={INK} fontSize={22 * fs} fontWeight={600}>
          {L.title}
        </text>
      )}
      {L.subtitle && (
        <text x={40} y={L.title ? 66 : 48} fill={MUTED} fontSize={14 * fs}>
          {L.subtitle}
        </text>
      )}

      {ROWS.map((r, i) => {
        const y = TOP + i * rowH + gap / 2;
        const w = Math.max(2, sx(r.value) - LEFT);
        const color = r.accent ? ACCENT : NEUTRAL;
        return (
          <g key={i}>
            <text
              x={LEFT - 18}
              y={y + barH / 2 - 4}
              fill={INK}
              fontSize={16 * fs}
              fontWeight={600}
              textAnchor="end"
            >
              {r.label}
            </text>
            {r.caption && (
              <text
                x={LEFT - 18}
                y={y + barH / 2 + 16}
                fill={MUTED}
                fontSize={13 * fs}
                textAnchor="end"
              >
                {r.caption}
              </text>
            )}
            <rect x={LEFT} y={y} width={w} height={barH} fill={color} />
            <text
              x={LEFT + w + 12}
              y={y + barH / 2 + 5}
              fill={INK}
              fontSize={16 * fs}
              fontWeight={600}
              className="tab-nums"
            >
              {r.value}
              {unit ? ` ${unit}` : ""}
            </text>
          </g>
        );
      })}

      <line
        x1={LEFT}
        x2={W - 40}
        y1={TOP + ROWS.length * rowH + 4}
        y2={TOP + ROWS.length * rowH + 4}
        stroke={RULE}
        strokeWidth={1}
      />

      {L.xAxisCaption && (
        <text
          x={LEFT + PW / 2}
          y={TOP + ROWS.length * rowH + 36}
          fill={INK}
          fontSize={14 * fs}
          textAnchor="middle"
          opacity={0.62}
        >
          {L.xAxisCaption}
        </text>
      )}

      {L.footnote && (
        <text x={40} y={H - 24} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
