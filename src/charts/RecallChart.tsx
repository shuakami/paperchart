// 20 queries × 3 engines. For every query, all three engines return the identical
// top-15 set (Jaccard = 1.00).

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, type StyleOverrides } from "../layout";

type Q = { query: string; hits: number; sets: "equal" };

const DEFAULT_QUERIES: Q[] = [
  { query: "weather", hits: 5, sets: "equal" },
  { query: "天气", hits: 5, sets: "equal" },
  { query: "hotboard", hits: 2, sets: "equal" },
  { query: "ssl check", hits: 4, sets: "equal" },
  { query: "qrcode", hits: 3, sets: "equal" },
  { query: "ocr", hits: 6, sets: "equal" },
  { query: "translation", hits: 8, sets: "equal" },
  { query: "翻译", hits: 8, sets: "equal" },
  { query: "微博", hits: 4, sets: "equal" },
  { query: "bilibili", hits: 7, sets: "equal" },
  { query: "图片", hits: 12, sets: "equal" },
  { query: "random", hits: 9, sets: "equal" },
  { query: "ip", hits: 3, sets: "equal" },
  { query: "sms", hits: 2, sets: "equal" },
  { query: "email", hits: 3, sets: "equal" },
  { query: "webp", hits: 4, sets: "equal" },
  { query: "api key", hits: 5, sets: "equal" },
  { query: "login", hits: 4, sets: "equal" },
  { query: "二维码", hits: 3, sets: "equal" },
  { query: "dns", hits: 3, sets: "equal" },
];

const W = 1600;
const LEFT = 260;
const RIGHT = 580;
const TOP = 80;
const ROW_H = 34;
const BOTTOM = 140;
const H = TOP + ROW_H * DEFAULT_QUERIES.length + BOTTOM;
const PLOT_W = W - LEFT - RIGHT;
const X_MAX = 15; // max hits on chart

const xScale = (n: number) => LEFT + (n / X_MAX) * PLOT_W;

const TICKS = [0, 3, 6, 9, 12, 15];

export default function RecallChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, style } = unwrap<Q[]>(data);
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const QUERIES = input ?? DEFAULT_QUERIES;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {/* corner annotation */}
      <text
        x={W - 40}
        y={40}
        fill={INK}
        fontSize={15}
        textAnchor="end"
        opacity={0.72}
      >
        20 benchmark queries · 96 unique docs covered across top-15 sets
      </text>
      <text
        x={W - 40}
        y={60}
        fill={INK}
        fontSize={15}
        textAnchor="end"
        opacity={0.72}
      >
        Set-equality verified before any ranking comparison
      </text>

      {/* vertical gridlines */}
      {TICKS.map((t) => (
        <line
          key={t}
          x1={xScale(t)}
          x2={xScale(t)}
          y1={TOP - 4}
          y2={TOP + ROW_H * QUERIES.length}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}

      {/* per-row dots */}
      {QUERIES.map((q, i) => {
        const y = TOP + i * ROW_H + ROW_H / 2;
        const xc = xScale(q.hits);
        return (
          <g key={q.query}>
            <text
              x={LEFT - 18}
              y={y + 5}
              fill={INK}
              fontSize={16}
              fontWeight={500}
              textAnchor="end"
              className="tab-nums"
            >
              {q.query}
            </text>
            {/* thin track line behind the dot cluster */}
            <line
              x1={LEFT}
              x2={xc}
              y1={y}
              y2={y}
              stroke={RULE}
              strokeWidth={1}
            />
            {/* three overlapping dots: two tan, one coral-rust, stacked with 4px vertical offset */}
            <circle cx={xc} cy={y - 6} r={7} fill={NEUTRAL} />
            <circle cx={xc} cy={y} r={7} fill={NEUTRAL} />
            <circle cx={xc} cy={y + 6} r={7} fill={ACCENT} />
            {/* right-side label */}
            <text
              x={xc + 20}
              y={y + 5}
              fill={INK}
              fontSize={15}
              className="tab-nums"
            >
              {q.hits} hits · Jaccard 1.00 across all three engines
            </text>
          </g>
        );
      })}

      {/* x-axis tick labels */}
      {TICKS.map((t) => (
        <text
          key={t}
          x={xScale(t)}
          y={TOP + ROW_H * QUERIES.length + 22}
          fill={INK}
          fontSize={14}
          textAnchor="middle"
          opacity={0.72}
          className="tab-nums"
        >
          {t}
        </text>
      ))}
      <text
        x={LEFT + PLOT_W / 2}
        y={TOP + ROW_H * QUERIES.length + 48}
        fill={INK}
        fontSize={15}
        textAnchor="middle"
        opacity={0.62}
      >
        number of results in top-15 per query
      </text>

      {/* color legend key, inline */}
      <g transform={`translate(${LEFT}, ${TOP + ROW_H * QUERIES.length + 78})`}>
        <circle cx={0} cy={0} r={7} fill={NEUTRAL} />
        <text x={14} y={4} fill={INK} fontSize={14} opacity={0.8}>
          Fuse fuzzy matcher
        </text>
        <circle cx={240} cy={0} r={7} fill={NEUTRAL} />
        <text x={254} y={4} fill={INK} fontSize={14} opacity={0.8}>
          Custom inverted index, embedded
        </text>
        <circle cx={574} cy={0} r={7} fill={ACCENT} />
        <text x={588} y={4} fill={INK} fontSize={14} opacity={0.8}>
          Externalized binary pack
        </text>
      </g>

      {/* footnote */}
      <text
        x={40}
        y={H - 18}
        fill={INK}
        fontSize={13}
        opacity={0.55}
      >
        Jaccard similarity of top-15 sets: |A ∩ B| / |A ∪ B|. A value of 1.00 means both engines returned exactly the same documents; ordering may still differ.
      </text>
    </svg>
  );
}
