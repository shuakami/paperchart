// Horizontal stacked-bar chart showing brotli bytes per delivery stage.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, type StyleOverrides } from "../layout";

const NEUTRAL_D = "#D6B99B";
const ACCENT_D = "#C75F3C";

type Segment = { kb: number; fill: string; dashed?: boolean; tag: string };
type Row = {
  group: string;
  caption: string;
  segments: Segment[];
  firstLoadKB: number;
  deferredKB: number;
  deferredGap?: boolean;
  accent?: boolean;
};

const DEFAULT_ROWS: Row[] = [
  {
    group: "Fuse fuzzy matcher",
    caption: "index + pages JSON inlined as a string literal inside the JS chunk",
    segments: [
      { kb: 87, fill: NEUTRAL_D, tag: "JSON index + pages" },
      { kb: 20, fill: NEUTRAL_D, tag: "Fuse runtime + UI glue" },
    ],
    firstLoadKB: 107,
    deferredKB: 0,
  },
  {
    group: "Custom inverted index, embedded",
    caption: "pack base64-encoded and inlined inside the JS chunk",
    segments: [
      { kb: 232, fill: NEUTRAL_D, tag: "pack bytes, base64 inside JS chunk" },
      { kb: 20, fill: NEUTRAL_D, tag: "runtime decoder + UI glue" },
    ],
    firstLoadKB: 252,
    deferredKB: 0,
  },
  {
    group: "Externalized binary pack",
    caption: "pack served as a separate precompressed static asset",
    accent: true,
    segments: [
      { kb: 20, fill: ACCENT_D, tag: "runtime decoder + UI glue (main JS chunk)" },
      {
        kb: 78,
        fill: ACCENT_D,
        dashed: true,
        tag: "/search-pack.bin · fetched when user opens search",
      },
    ],
    firstLoadKB: 20,
    deferredKB: 78,
    deferredGap: true,
  },
];

const W = 1600;
const LEFT = 380;
const RIGHT = 340;
const TOP = 60;
const ROW_H = 260;
const BOTTOM = 120;
const H = TOP + ROW_H * DEFAULT_ROWS.length + BOTTOM;
const PLOT_W = W - LEFT - RIGHT;
const X_MAX = 260;
const xScale = (kb: number) => LEFT + (kb / X_MAX) * PLOT_W;
const GAP_PX = 72;

const TICKS = [0, 50, 100, 150, 200, 250];

export default function BytesChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: rawInput, style } = unwrap<Row[]>(data);
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const RULE = s.rule ?? th.rule;
  const NEUTRAL = s.secondary ?? th.secondary;
  const ACCENT = s.accent ?? th.accent;
  const BG = s.bg ?? th.bg;

  // If default sample (paper-coded hex), remap to theme; else keep user-supplied fills.
  const mapSeg = (seg: Segment): Segment => {
    if (seg.fill === NEUTRAL_D) return { ...seg, fill: NEUTRAL };
    if (seg.fill === ACCENT_D) return { ...seg, fill: ACCENT };
    return seg;
  };
  const ROWS = (rawInput ?? DEFAULT_ROWS).map((r) => ({
    ...r,
    segments: r.segments.map(mapSeg),
  }));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      {TICKS.map((t) => (
        <line
          key={t}
          x1={xScale(t)}
          x2={xScale(t)}
          y1={TOP}
          y2={TOP + ROW_H * ROWS.length}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}
      {ROWS.map((_, i) => (
        <line
          key={`sep-${i}`}
          x1={40}
          x2={W - 40}
          y1={TOP + i * ROW_H}
          y2={TOP + i * ROW_H}
          stroke={RULE}
          strokeWidth={1}
        />
      ))}
      <line x1={40} x2={W - 40} y1={TOP + ROWS.length * ROW_H} y2={TOP + ROWS.length * ROW_H} stroke={RULE} strokeWidth={1} />

      {ROWS.map((row, ri) => {
        const yTop = TOP + ri * ROW_H;
        const barY = yTop + 120;
        const barH = 44;
        let xCursor = LEFT;
        let gapApplied = false;

        const segX = row.segments.map((seg) => {
          const w = xScale(seg.kb) - LEFT;
          let x = xCursor;
          if (seg.dashed && row.deferredGap && !gapApplied) {
            x += GAP_PX;
            gapApplied = true;
          }
          xCursor = x + w;
          return { x, w };
        });

        const dividerX =
          row.deferredGap && segX.length >= 2 ? segX[0].x + segX[0].w + GAP_PX / 2 : null;

        return (
          <g key={row.group}>
            {/* Group heading */}
            <text x={40} y={yTop + 44} fill={INK} fontSize={22} fontWeight={600}>
              {row.group}
            </text>
            <text x={40} y={yTop + 70} fill={INK} fontSize={14} opacity={0.62}>
              {row.caption}
            </text>

            {/* Segments */}
            {row.segments.map((seg, si) => {
              const { x, w } = segX[si];
              return (
                <g key={si}>
                  <rect x={x} y={barY} width={w} height={barH} fill={seg.fill} />
                  {/* size inside bar if wide enough, else above */}
                  {w >= 120 ? (
                    <text
                      x={x + w / 2}
                      y={barY + barH / 2 + 7}
                      fill={seg.fill === ACCENT ? BG : INK}
                      fontSize={18}
                      fontWeight={600}
                      textAnchor="middle"
                      className="tab-nums"
                    >
                      {seg.kb} KB br
                    </text>
                  ) : (
                    <text
                      x={x + w / 2}
                      y={barY - 12}
                      fill={INK}
                      fontSize={16}
                      fontWeight={600}
                      textAnchor="middle"
                      className="tab-nums"
                    >
                      {seg.kb} KB br
                    </text>
                  )}
                  {/* tick from bar bottom to label */}
                  <line
                    x1={x + w / 2}
                    x2={x + w / 2}
                    y1={barY + barH}
                    y2={barY + barH + 14 + si * 16}
                    stroke={INK}
                    strokeWidth={1}
                    opacity={0.35}
                  />
                  {/* detail text, staggered vertically so neighbors don't collide */}
                  <text
                    x={x + w / 2}
                    y={barY + barH + 30 + si * 18}
                    fill={INK}
                    fontSize={13}
                    textAnchor="middle"
                    opacity={0.72}
                  >
                    {seg.tag}
                  </text>
                </g>
              );
            })}

            {/* Deferred divider — purely a short dashed visual separator at the gap center */}
            {dividerX !== null && (
              <g>
                <line
                  x1={dividerX}
                  x2={dividerX}
                  y1={barY - 18}
                  y2={barY + barH + 18}
                  stroke={INK}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  opacity={0.55}
                />
                <text
                  x={dividerX - 10}
                  y={barY - 26}
                  fill={INK}
                  fontSize={12}
                  textAnchor="end"
                  opacity={0.7}
                >
                  first-load critical path
                </text>
                <text
                  x={dividerX + 10}
                  y={barY - 26}
                  fill={INK}
                  fontSize={12}
                  opacity={0.7}
                >
                  deferred
                </text>
              </g>
            )}

            {/* Right-side totals */}
            <text x={W - 40} y={barY - 12} fill={INK} fontSize={13} textAnchor="end" opacity={0.62}>
              first-load critical path
            </text>
            <text
              x={W - 40}
              y={barY + 20}
              fill={row.accent ? ACCENT : INK}
              data-themed="total"
              fontSize={28}
              fontWeight={600}
              textAnchor="end"
              className="tab-nums"
            >
              {row.firstLoadKB} KB br
            </text>
            <text
              x={W - 40}
              y={barY + 46}
              fill={INK}
              fontSize={13}
              textAnchor="end"
              opacity={0.62}
              className="tab-nums"
            >
              {row.deferredKB === 0 ? "0 KB deferred" : `${row.deferredKB} KB deferred`}
            </text>
          </g>
        );
      })}

      {TICKS.map((t) => (
        <text
          key={t}
          x={xScale(t)}
          y={TOP + ROW_H * ROWS.length + 26}
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
        y={TOP + ROW_H * ROWS.length + 54}
        fill={INK}
        fontSize={15}
        textAnchor="middle"
        opacity={0.62}
      >
        bytes on the wire after brotli-11 compression, kilobytes
      </text>

      <text x={40} y={H - 28} fill={INK} fontSize={13} opacity={0.55}>
        First-load = bytes the browser fetches before the first user interaction. Deferred = bytes paid only when the user opens the search box.
      </text>
    </svg>
  );
}
