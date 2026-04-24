// GitHub-style calendar heatmap — a grid of weeks × weekdays with per-day
// intensity. Accepts a date-indexed count array. Supports 1 year default,
// custom start date, and variable bucket count.
//
// data shape:
//   { start: "YYYY-MM-DD", days: [{ date: "YYYY-MM-DD", value: number }] }
// OR:
//   [{ date, value }] — start inferred from first entry's week

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Day = { date: string; value: number };
type Input = { start?: string; days: Day[] } | Day[];

type CalLayout = BaseLayout & {
  cellSize?: number;
  cellGap?: number;
  buckets?: number;
  unit?: string;
};

function genDefaultYear(): Day[] {
  const start = new Date(Date.UTC(2025, 5, 1)); // start on a Sunday-ish
  while (start.getUTCDay() !== 0) start.setUTCDate(start.getUTCDate() + 1);
  const out: Day[] = [];
  // deterministic pseudo-random
  let seed = 9137;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(start.getTime() + i * 86400 * 1000);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const weekend = dow === 0 || dow === 6;
    // seasonal + weekly rhythm + bursty
    const seasonal = 6 + Math.sin((i / 365) * Math.PI * 2 - 1.2) * 4;
    const weekday = weekend ? 0.3 : 1.0;
    const noise = rand();
    const burst = noise > 0.93 ? 18 : 0;
    const v = Math.max(0, Math.round(seasonal * weekday + noise * 6 + burst - 2));
    out.push({ date: iso, value: v });
  }
  return out;
}

const DEFAULT_DAYS = genDefaultYear();

export default function CalendarHeatmapChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<Input>(data);
  const L = layout as CalLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const PANEL = th.panel ?? BG;

  const days: Day[] = Array.isArray(input)
    ? input
    : (input && typeof input === "object" && Array.isArray((input as { days: Day[] }).days))
    ? (input as { days: Day[] }).days
    : DEFAULT_DAYS;

  const fs = num(L.fontScale, 1);
  const W = num(L.width, 1600);
  const LEFT = num(L.padding?.left, 80);
  const RIGHT = num(L.padding?.right, 80);
  const TOP = num(L.padding?.top, 100);
  const BOTTOM = num(L.padding?.bottom, 100);
  const buckets = Math.max(2, num(L.buckets, 5));
  const availW = W - LEFT - RIGHT;

  // compute weeks grid
  type Cell = Day & { week: number; dow: number };
  const cells: Cell[] = [];
  if (days.length > 0) {
    const first = new Date(days[0].date);
    const dayMap: Record<string, number> = {};
    days.forEach((d) => { dayMap[d.date] = d.value; });
    // find sunday of the first week
    const cursor = new Date(first);
    while (cursor.getUTCDay() !== 0) cursor.setUTCDate(cursor.getUTCDate() - 1);
    const last = new Date(days[days.length - 1].date);
    let weekIdx = 0;
    while (cursor <= last) {
      for (let dow = 0; dow < 7; dow += 1) {
        const iso = cursor.toISOString().slice(0, 10);
        const v = dayMap[iso];
        if (v !== undefined) {
          cells.push({ date: iso, value: v, week: weekIdx, dow });
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      weekIdx += 1;
    }
  }

  const weeks = Math.max(1, cells.reduce((a, c) => Math.max(a, c.week), 0) + 1);
  const gapDefault = 3;
  const cellG = num(L.cellGap, gapDefault);
  const cellS = num(L.cellSize, Math.min(22, Math.floor((availW - (weeks - 1) * cellG) / weeks)));
  const gridW = weeks * cellS + (weeks - 1) * cellG;
  const originX = LEFT + Math.max(0, (availW - gridW) / 2);
  const originY = TOP;

  const maxV = Math.max(1, ...days.map((d) => d.value));

  // bucket thresholds: 0, then (1/buckets..max) evenly
  const thresholds: number[] = [0];
  for (let i = 1; i < buckets; i += 1) thresholds.push((i / buckets) * maxV);

  const bucketOf = (v: number): number => {
    let b = 0;
    for (let i = 0; i < thresholds.length; i += 1) {
      if (v > thresholds[i]) b = i;
    }
    return b;
  };

  const fillFor = (v: number): { fill: string; opacity: number } => {
    if (v <= 0) return { fill: PANEL, opacity: 1 };
    const b = bucketOf(v);
    const t = (b + 1) / buckets; // 1/N..1
    return { fill: ACCENT, opacity: Math.max(0.18, t) };
  };

  // month labels at week boundaries where month changes
  type MonthMark = { week: number; name: string };
  const monthMarks: MonthMark[] = [];
  {
    let prevMonth = -1;
    for (let wi = 0; wi < weeks; wi += 1) {
      const c = cells.find((cc) => cc.week === wi && cc.dow === 0);
      if (!c) continue;
      const mo = new Date(c.date).getUTCMonth();
      if (mo !== prevMonth) {
        monthMarks.push({
          week: wi,
          name: new Date(c.date).toLocaleString("en-US", { month: "short" }),
        });
        prevMonth = mo;
      }
    }
  }

  const dowLabels = ["Mon", "Wed", "Fri"]; // sparse
  const dowPositions = [1, 3, 5];

  const H = num(L.height, originY + 7 * (cellS + cellG) - cellG + BOTTOM + 40);

  // legend squares at bottom right
  const legendSquares = Array.from({ length: buckets }, (_, i) => {
    if (i === 0) return { fill: PANEL, opacity: 1 };
    const t = (i + 1) / buckets;
    return { fill: ACCENT, opacity: Math.max(0.18, t) };
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* month labels */}
      {monthMarks.map((m, i) => {
        const x = originX + m.week * (cellS + cellG);
        return (
          <text
            key={`m-${i}`}
            x={x}
            y={originY - 16}
            fill={MUTED}
            fontSize={12 * fs}
          >
            {m.name}
          </text>
        );
      })}

      {/* weekday labels */}
      {dowLabels.map((lbl, i) => (
        <text
          key={`d-${i}`}
          x={originX - 12}
          y={originY + dowPositions[i] * (cellS + cellG) + cellS * 0.75}
          fill={MUTED}
          fontSize={12 * fs}
          textAnchor="end"
        >
          {lbl}
        </text>
      ))}

      {/* cells */}
      {cells.map((c, i) => {
        const x = originX + c.week * (cellS + cellG);
        const y = originY + c.dow * (cellS + cellG);
        const { fill, opacity } = fillFor(c.value);
        return (
          <rect
            key={`c-${i}`}
            x={x}
            y={y}
            width={cellS}
            height={cellS}
            fill={fill}
            fillOpacity={opacity}
            stroke={RULE}
            strokeOpacity={0.4}
          />
        );
      })}

      {/* legend */}
      <g transform={`translate(${W - RIGHT - (buckets * (cellS + cellG) + 110)}, ${originY + 7 * (cellS + cellG) + 18})`}>
        <text x={0} y={cellS * 0.75} fill={MUTED} fontSize={12 * fs}>less</text>
        {legendSquares.map((lg, i) => (
          <rect
            key={`lg-${i}`}
            x={42 + i * (cellS + cellG)}
            y={0}
            width={cellS}
            height={cellS}
            fill={lg.fill}
            fillOpacity={lg.opacity}
            stroke={RULE}
            strokeOpacity={0.4}
          />
        ))}
        <text x={42 + buckets * (cellS + cellG) + 6} y={cellS * 0.75} fill={MUTED} fontSize={12 * fs}>more</text>
      </g>

      {/* total annotation at top right */}
      <text x={W - RIGHT} y={originY - 42} fill={INK} fontSize={15 * fs} fontWeight={600} textAnchor="end">
        {days.reduce((a, b) => a + b.value, 0).toLocaleString("en-US")}
        {L.unit ? " " + L.unit : " contributions"}
      </text>
      <text x={W - RIGHT} y={originY - 22} fill={MUTED} fontSize={12 * fs} textAnchor="end">
        {days.length} days
      </text>
    </svg>
  );
}
