// Comparison table in the spirit of Anthropic (Opus) and OpenAI model-release
// posts. Columns are the subjects being compared (models / products / tiers);
// rows are the metrics. Exactly one column can be highlighted — it gets a
// tinted panel background and a thin accent rail on the left. Additional
// columns can be marked `muted` to render as grayed-out competitors.
//
// data shape:
//   {
//     columns: [{ key, label, sublabel?, highlight?, muted?, group? }],
//     rows:    [{ label, caption?, values: { [key]: Cell | Cell[] } }]
//   }
//   Cell = { main: string | number, sub?: string }
//
// The renderer automatically:
//   - bolds the best value in each row (highest number parsed from `main`)
//   - renders "—" for missing values
//   - draws a top band with `group` names when at least one column has one

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Cell = { main: string | number; sub?: string };

type Col = {
  key: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
  muted?: boolean;
  group?: string;
};

type Row = {
  label: string;
  caption?: string;
  values: Record<string, Cell | Cell[] | string | number | null | undefined>;
};

type TableInput = {
  columns: Col[];
  rows: Row[];
};

type TableLayout = BaseLayout & {
  labelWidth?: number;
  rowPadding?: number;
  columnHeaderHeight?: number;
  groupBandHeight?: number;
  winnerBold?: boolean;
};

const DEFAULT_DATA: TableInput = {
  columns: [
    { key: "opus47",  label: "Opus 4.7", highlight: true },
    { key: "opus46",  label: "Opus 4.6" },
    { key: "gpt54",   label: "GPT-5.4", muted: true },
    { key: "gemini",  label: "Gemini 3.1 Pro", muted: true },
    { key: "mythos",  label: "Mythos Preview" },
  ],
  rows: [
    {
      label: "Agentic coding",
      caption: "SWE-bench Pro",
      values: {
        opus47:  { main: "64.3%" },
        opus46:  { main: "53.4%" },
        gpt54:   { main: "57.7%" },
        gemini:  { main: "54.2%" },
        mythos:  { main: "77.8%" },
      },
    },
    {
      label: "Agentic terminal coding",
      caption: "Terminal-Bench 2.0",
      values: {
        opus47:  { main: "69.4%" },
        opus46:  { main: "65.4%" },
        gpt54:   { main: "75.1%", sub: "self-reported harness" },
        gemini:  { main: "68.5%" },
        mythos:  { main: "82.0%" },
      },
    },
    {
      label: "Multidisciplinary reasoning",
      caption: "Humanity's Last Exam",
      values: {
        opus47: [
          { main: "46.9%", sub: "no tools" },
          { main: "54.7%", sub: "with tools" },
        ],
        opus46: [
          { main: "40.0%", sub: "no tools" },
          { main: "53.3%", sub: "with tools" },
        ],
        gpt54: [
          { main: "42.7%", sub: "no tools (Pro)" },
          { main: "58.7%", sub: "with tools (Pro)" },
        ],
        gemini: [
          { main: "44.4%", sub: "no tools" },
          { main: "51.4%", sub: "with tools" },
        ],
        mythos: [
          { main: "56.8%", sub: "no tools" },
          { main: "64.7%", sub: "with tools" },
        ],
      },
    },
    {
      label: "Agentic search",
      caption: "BrowseComp",
      values: {
        opus47:  { main: "79.3%" },
        opus46:  { main: "83.7%" },
        gpt54:   { main: "89.3%", sub: "Pro" },
        gemini:  { main: "85.9%" },
        mythos:  { main: "86.9%" },
      },
    },
    {
      label: "Scaled tool use",
      caption: "MCP-Atlas",
      values: {
        opus47:  { main: "77.3%" },
        opus46:  { main: "75.8%" },
        gpt54:   { main: "68.1%" },
        gemini:  { main: "73.9%" },
        mythos:  { main: "—" },
      },
    },
    {
      label: "Agentic computer use",
      caption: "OSWorld-Verified",
      values: {
        opus47:  { main: "78.0%" },
        opus46:  { main: "72.7%" },
        gpt54:   { main: "75.0%" },
        gemini:  { main: "—" },
        mythos:  { main: "79.6%" },
      },
    },
    {
      label: "Graduate-level reasoning",
      caption: "GPQA Diamond",
      values: {
        opus47:  { main: "94.2%" },
        opus46:  { main: "91.3%" },
        gpt54:   { main: "94.4%", sub: "Pro" },
        gemini:  { main: "94.3%" },
        mythos:  { main: "94.6%" },
      },
    },
  ],
};

function toCells(v: Row["values"][string]): Cell[] {
  if (v === undefined || v === null) return [{ main: "—" }];
  if (Array.isArray(v)) return v.filter(Boolean) as Cell[];
  if (typeof v === "object") return [v as Cell];
  return [{ main: v as string | number }];
}

function numericPrefix(s: string | number | undefined): number | null {
  if (s === undefined || s === null) return null;
  if (typeof s === "number") return Number.isFinite(s) ? s : null;
  const m = String(s).trim().match(/^(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function formatMain(v: string | number | undefined): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return String(v);
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }
  return String(v);
}

export default function TableChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, layout, style } = unwrap<TableInput>(data);
  const L = layout as TableLayout;
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = s.ink ?? th.ink;
  const MUTED = s.muted ?? th.muted;
  const RULE = s.rule ?? th.rule;
  const BG = s.bg ?? th.bg;
  const PANEL = th.panel ?? BG;

  const table = input ?? DEFAULT_DATA;
  const cols = table.columns ?? [];
  const rows = table.rows ?? [];
  const winnerBold = L.winnerBold !== false;

  const fs = num(L.fontScale, 1);
  const LEFT = num(L.padding?.left, 48);
  const RIGHT = num(L.padding?.right, 48);
  const TOP = num(L.padding?.top, 56);
  const BOTTOM = num(L.padding?.bottom, 64);
  const W = num(L.width, 1600);
  const labelW = num(L.labelWidth, 320);
  const rowPad = num(L.rowPadding, 22);

  // measure row heights based on number of cells per row (multi-cell rows get
  // taller). Each single cell is ~64px tall (main + optional sub).
  const rowHeights = rows.map((r) => {
    const maxLines = cols.reduce((acc, c) => {
      const cells = toCells(r.values?.[c.key]);
      return Math.max(acc, cells.length);
    }, 1);
    const base = 60 + (maxLines - 1) * 44;
    return base + rowPad;
  });

  const hasGroups = cols.some((c) => c.group);
  const GROUP_H = hasGroups ? 36 : 0;
  const HEADER_H = num(L.columnHeaderHeight, 72);

  const tableTop = TOP + GROUP_H + HEADER_H;
  const totalRowH = rowHeights.reduce((a, b) => a + b, 0);
  const H = num(L.height, tableTop + totalRowH + BOTTOM);

  const plotLeft = LEFT;
  const plotRight = W - RIGHT;
  const valueArea = plotRight - (plotLeft + labelW);
  const colW = cols.length > 0 ? valueArea / cols.length : 0;
  const colCenter = (i: number) => plotLeft + labelW + i * colW + colW / 2;

  // compute per-row winner(s): highest numeric value. Ties are all bolded.
  const winners: Record<number, Set<string>> = {};
  rows.forEach((r, ri) => {
    const w = new Set<string>();
    let best: number | null = null;
    cols.forEach((c) => {
      toCells(r.values?.[c.key]).forEach((cell) => {
        const n = numericPrefix(cell.main);
        if (n === null) return;
        if (best === null || n > best) best = n;
      });
    });
    if (best !== null) {
      cols.forEach((c) => {
        toCells(r.values?.[c.key]).forEach((cell) => {
          const n = numericPrefix(cell.main);
          if (n !== null && Math.abs(n - (best as number)) < 1e-9) {
            w.add(c.key);
          }
        });
      });
    }
    winners[ri] = w;
  });

  // group runs for top band
  const groups: { name: string; start: number; end: number }[] = [];
  if (hasGroups) {
    type Cur = { name: string; start: number };
    let cursor: Cur | null = null;
    cols.forEach((c, i) => {
      const g = c.group ?? "";
      if (!cursor || cursor.name !== g) {
        if (cursor) groups.push({ name: cursor.name, start: cursor.start, end: i - 1 });
        cursor = { name: g, start: i };
      }
    });
    if (cursor) {
      const cur = cursor as Cur;
      groups.push({ name: cur.name, start: cur.start, end: cols.length - 1 });
    }
  }

  // accent-column bounds — inclusive left/right indices, assumed contiguous
  const highlightIdxs = cols
    .map((c, i) => (c.highlight ? i : -1))
    .filter((i) => i >= 0);
  const hlStart = highlightIdxs.length ? Math.min(...highlightIdxs) : -1;
  const hlEnd = highlightIdxs.length ? Math.max(...highlightIdxs) : -1;

  // y offset accumulator
  const rowOffsets: number[] = [];
  {
    let y = tableTop;
    rows.forEach((_, i) => {
      rowOffsets.push(y);
      y += rowHeights[i];
    });
  }
  const tableBottom = tableTop + totalRowH;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", background: BG }}
    >
      {/* highlighted column panel — full height, no rail, just tinted fill */}
      {hlStart >= 0 && (
        <rect
          x={plotLeft + labelW + hlStart * colW}
          y={TOP + GROUP_H}
          width={(hlEnd - hlStart + 1) * colW}
          height={HEADER_H + totalRowH}
          fill={PANEL}
        />
      )}

      {/* group band */}
      {hasGroups &&
        groups.map((g, i) => {
          if (!g.name) return null;
          const x1 = plotLeft + labelW + g.start * colW;
          const x2 = plotLeft + labelW + (g.end + 1) * colW;
          const midX = (x1 + x2) / 2;
          return (
            <g key={`grp-${i}`}>
              <text
                x={midX}
                y={TOP + 20}
                fill={MUTED}
                fontSize={13 * fs}
                textAnchor="middle"
              >
                {g.name}
              </text>
              {/* vertical divider between groups, drawn at the left edge of
                  each group except the first */}
              {g.start > 0 && (
                <line
                  x1={x1}
                  x2={x1}
                  y1={TOP + GROUP_H + 8}
                  y2={tableBottom - 8}
                  stroke={RULE}
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}

      {/* column headers */}
      {cols.map((c, i) => {
        const isHighlight = !!c.highlight;
        const isMuted = !!c.muted;
        const mainColor = isMuted ? MUTED : INK;
        const mainWeight = isHighlight ? 700 : isMuted ? 500 : 600;
        const cx = colCenter(i);
        const hy = TOP + GROUP_H + HEADER_H - (c.sublabel ? 34 : 22);
        return (
          <g key={`hdr-${c.key}`}>
            <text
              x={cx}
              y={hy}
              fill={mainColor}
              fontSize={(isHighlight ? 20 : 17) * fs}
              fontWeight={mainWeight}
              textAnchor="middle"
              opacity={isMuted ? 0.6 : 1}
            >
              {c.label}
            </text>
            {c.sublabel && (
              <text
                x={cx}
                y={hy + 22}
                fill={MUTED}
                fontSize={12 * fs}
                textAnchor="middle"
                opacity={isMuted ? 0.6 : 1}
              >
                {c.sublabel}
              </text>
            )}
          </g>
        );
      })}

      {/* bottom line of header */}
      <line
        x1={plotLeft}
        x2={plotRight}
        y1={tableTop - 0.5}
        y2={tableTop - 0.5}
        stroke={RULE}
        strokeWidth={1}
      />

      {/* rows */}
      {rows.map((r, ri) => {
        const y0 = rowOffsets[ri];
        const rh = rowHeights[ri];
        const mid = y0 + rh / 2;
        const maxCells = cols.reduce((acc, c) => {
          const cells = toCells(r.values?.[c.key]);
          return Math.max(acc, cells.length);
        }, 1);

        return (
          <g key={`row-${ri}`}>
            {/* row label + caption, vertically centred */}
            <text
              x={plotLeft + 6}
              y={mid - (r.caption ? 4 : -5)}
              fill={INK}
              fontSize={15 * fs}
              fontWeight={500}
            >
              {r.label}
            </text>
            {r.caption && (
              <text
                x={plotLeft + 6}
                y={mid + 16}
                fill={MUTED}
                fontSize={12 * fs}
              >
                {r.caption}
              </text>
            )}

            {/* cells */}
            {cols.map((c, ci) => {
              const cells = toCells(r.values?.[c.key]);
              const cx = colCenter(ci);
              const isMuted = !!c.muted;
              const isHighlight = !!c.highlight;
              // vertical positioning: distribute cells evenly within row
              const slotH = rh / maxCells;
              return cells.map((cell, k) => {
                const cellCenter = y0 + slotH * k + slotH / 2;
                const isWinner =
                  winnerBold && winners[ri]?.has(c.key) && numericPrefix(cell.main) !== null && cells.length === 1;
                const mainWeight = isHighlight ? 700 : isWinner ? 700 : 600;
                const mainColor = isMuted ? MUTED : INK;
                const mainSize = 22 * fs;
                return (
                  <g key={`cell-${ri}-${c.key}-${k}`}>
                    <text
                      x={cx}
                      y={cellCenter + (cell.sub ? -2 : 7)}
                      fill={mainColor}
                      fontSize={mainSize}
                      fontWeight={mainWeight}
                      textAnchor="middle"
                      opacity={isMuted ? 0.58 : 1}
                      className="tab-nums"
                    >
                      {formatMain(cell.main)}
                    </text>
                    {cell.sub && (
                      <text
                        x={cx}
                        y={cellCenter + 18}
                        fill={MUTED}
                        fontSize={11 * fs}
                        textAnchor="middle"
                        opacity={isMuted ? 0.58 : 1}
                      >
                        {cell.sub}
                      </text>
                    )}
                  </g>
                );
              });
            })}

            {/* row separator, light rule */}
            {ri < rows.length - 1 && (
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={y0 + rh - 0.5}
                y2={y0 + rh - 0.5}
                stroke={RULE}
                strokeWidth={1}
              />
            )}
          </g>
        );
      })}

      {str(L.footnote, "") !== "" && (
        <text x={LEFT} y={H - 28} fill={INK} fontSize={12 * fs} opacity={0.55}>
          {L.footnote}
        </text>
      )}
    </svg>
  );
}
