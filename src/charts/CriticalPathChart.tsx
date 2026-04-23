// Waterfall-style critical path chart for /docs page first load.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, type StyleOverrides } from "../layout";

type Row = {
  label: string;
  detail: string;
  startMs: number;
  endMs: number;
  kb: number;
  critical: boolean;
};

const DEFAULT_ROWS: Row[] = [
  { label: "index.html", detail: "server-rendered document shell", startMs: 0, endMs: 40, kb: 4, critical: true },
  { label: "framework runtime", detail: "Next.js + React runtime chunk", startMs: 30, endMs: 140, kb: 48, critical: true },
  { label: "/docs route chunk", detail: "page bundle, no pack, no base64 literal", startMs: 80, endMs: 220, kb: 20, critical: true },
  { label: "search UI shell", detail: "cmdk + input, no index loaded yet", startMs: 110, endMs: 240, kb: 12, critical: true },
  { label: "icons + web fonts", detail: "deferred, idle-loaded", startMs: 260, endMs: 460, kb: 20, critical: false },
  { label: "/search-pack.bin", detail: "fetched only when user opens the search box", startMs: 620, endMs: 760, kb: 78, critical: false },
];

const DOM_CONTENT_LOADED = 260;
const USER_OPENS_SEARCH = 600;

const W = 1600;
const LEFT = 340;
const RIGHT = 300;
const TOP = 170;
const ROW_H = 70;
const BOTTOM = 130;
const H = TOP + ROW_H * DEFAULT_ROWS.length + BOTTOM;
const PLOT_W = W - LEFT - RIGHT;
const X_MAX = 800;
const xScale = (ms: number) => LEFT + (ms / X_MAX) * PLOT_W;
const TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800];

export default function CriticalPathChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, style } = unwrap<Row[]>(data);
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;
  const ROWS = input ?? DEFAULT_ROWS;
  const criticalKB = ROWS.filter((r) => r.critical).reduce((acc, r) => acc + r.kb, 0);
  const deferredKB = ROWS.filter((r) => !r.critical).reduce((acc, r) => acc + r.kb, 0);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      <text x={40} y={48} fill={INK} fontSize={22} fontWeight={600}>
        /docs first-load · network critical path
      </text>
      <text x={40} y={72} fill={INK} fontSize={14} opacity={0.62}>
        Coral-rust bars sit on the critical path before first paint. Tan bars are deferred and only fetched lazily.
      </text>

      {/* Marker labels live in a dedicated band so they never overlap the subtitle */}
      <text
        x={xScale(DOM_CONTENT_LOADED)}
        y={124}
        fill={INK}
        fontSize={13}
        textAnchor="middle"
        opacity={0.78}
      >
        DOMContentLoaded
      </text>
      <text
        x={xScale(USER_OPENS_SEARCH)}
        y={124}
        fill={INK}
        fontSize={13}
        textAnchor="middle"
        opacity={0.78}
      >
        user opens search (Ctrl+K)
      </text>

      {/* vertical grid */}
      {TICKS.map((t) => (
        <line
          key={t}
          x1={xScale(t)}
          x2={xScale(t)}
          y1={TOP - 30}
          y2={TOP + ROW_H * ROWS.length + 20}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}

      {/* marker lines */}
      <line
        x1={xScale(DOM_CONTENT_LOADED)}
        x2={xScale(DOM_CONTENT_LOADED)}
        y1={TOP - 40}
        y2={TOP + ROW_H * ROWS.length + 30}
        stroke={INK}
        strokeDasharray="4 4"
        strokeWidth={1}
        opacity={0.55}
      />
      <line
        x1={xScale(USER_OPENS_SEARCH)}
        x2={xScale(USER_OPENS_SEARCH)}
        y1={TOP - 40}
        y2={TOP + ROW_H * ROWS.length + 30}
        stroke={INK}
        strokeDasharray="4 4"
        strokeWidth={1}
        opacity={0.55}
      />

      {/* rows */}
      {ROWS.map((r, i) => {
        const y = TOP + i * ROW_H;
        const x1 = xScale(r.startMs);
        const x2 = xScale(r.endMs);
        const color = r.critical ? ACCENT : NEUTRAL;
        return (
          <g key={r.label}>
            <line x1={40} x2={W - 40} y1={y} y2={y} stroke={RULE} strokeWidth={1} />
            <text x={40} y={y + 32} fill={INK} fontSize={17} fontWeight={500}>
              {r.label}
            </text>
            <text x={40} y={y + 52} fill={INK} fontSize={13} opacity={0.62}>
              {r.detail}
            </text>
            <rect x={x1} y={y + 18} width={x2 - x1} height={30} fill={color} />
            <text
              x={x2 + 10}
              y={y + 38}
              fill={INK}
              fontSize={14}
              fontWeight={500}
              className="tab-nums"
            >
              {r.kb} KB br · {r.endMs - r.startMs} ms
            </text>
          </g>
        );
      })}
      <line
        x1={40}
        x2={W - 40}
        y1={TOP + ROW_H * ROWS.length}
        y2={TOP + ROW_H * ROWS.length}
        stroke={RULE}
        strokeWidth={1}
      />

      {/* x-axis */}
      {TICKS.map((t) => (
        <text
          key={t}
          x={xScale(t)}
          y={TOP + ROW_H * ROWS.length + 26}
          fill={INK}
          fontSize={13}
          textAnchor="middle"
          opacity={0.72}
          className="tab-nums"
        >
          {t}
        </text>
      ))}
      <text
        x={LEFT + PLOT_W / 2}
        y={TOP + ROW_H * ROWS.length + 52}
        fill={INK}
        fontSize={14}
        textAnchor="middle"
        opacity={0.62}
      >
        time since navigation start, milliseconds (illustrative)
      </text>

      {/* summary on the right */}
      <g transform={`translate(${W - 40}, ${TOP - 10})`}>
        <text x={0} y={0} fill={INK} fontSize={14} textAnchor="end" fontWeight={600}>
          on critical path
        </text>
        <text
          x={0}
          y={30}
          fill={ACCENT}
          fontSize={22}
          textAnchor="end"
          fontWeight={600}
          className="tab-nums"
        >
          {criticalKB} KB br · 4 resources
        </text>

        <text x={0} y={94} fill={INK} fontSize={14} textAnchor="end" fontWeight={600}>
          deferred
        </text>
        <text
          x={0}
          y={124}
          fill={INK}
          fontSize={22}
          textAnchor="end"
          fontWeight={600}
          className="tab-nums"
          opacity={0.85}
        >
          {deferredKB} KB br · 2 resources
        </text>
      </g>

      <text x={40} y={H - 24} fill={INK} fontSize={13} opacity={0.55}>
        Bar widths illustrate the relative timing of each resource; absolute numbers come from the repo&rsquo;s production next build, brotli quality 11, measured inside Chromium via the Performance API.
      </text>
    </svg>
  );
}
