// Two-panel diagram describing the binary pack.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, type StyleOverrides } from "../layout";

// example byte sizes — replace with your own when authoring a new chart
type Segment = { label: string; detail: string; bytes: number; accent: boolean };

const DEFAULT_SEGMENTS: Segment[] = [
  { label: "Docs", detail: "id, title, url, summary", bytes: 51842, accent: false },
  { label: "Tokens", detail: "type flag + bytes + posting deltas", bytes: 212908, accent: true },
  { label: "Corrections", detail: "spell-correction candidates", bytes: 37270, accent: false },
];

const W = 1600;
const LEFT = 80;
const RIGHT = 80;
const BAR_Y = 180;
const BAR_H = 80;
const PLOT_W = W - LEFT - RIGHT;
const H = 1000;

function kb(n: number) {
  return (n / 1024).toFixed(1) + " KB";
}

export default function PackLayout({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, style } = unwrap<Segment[]>(data);
  const stOv = style as StyleOverrides;
  const th = resolveTheme(theme);
  const INK = stOv.ink ?? th.ink;
  const NEUTRAL = stOv.secondary ?? th.secondary;
  const ACCENT = stOv.accent ?? th.accent;
  const BG = stOv.bg ?? th.bg;
  const SEGMENTS = input ?? DEFAULT_SEGMENTS;
  const TOTAL = SEGMENTS.reduce((acc, x) => acc + x.bytes, 0);
  let cursor = LEFT;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      <text x={LEFT} y={60} fill={INK} fontSize={22} fontWeight={600}>
        binary pack anatomy
      </text>
      <text x={LEFT} y={86} fill={INK} fontSize={14} opacity={0.62}>
        302 KB raw total · single-pass little-endian parser, no JSON, no reflection · 24-byte header (magic, version, section offsets) omitted below because it is too small to show.
      </text>

      {/* proportional bar of the three main sections */}
      {SEGMENTS.map((seg, i) => {
        const w = (seg.bytes / TOTAL) * PLOT_W;
        const x = cursor;
        cursor += w;
        const fill = seg.accent ? ACCENT : NEUTRAL;
        const fg = seg.accent ? BG : INK;
        const pct = ((seg.bytes / TOTAL) * 100).toFixed(1);
        return (
          <g key={seg.label}>
            <rect x={x} y={BAR_Y} width={w} height={BAR_H} fill={fill} />
            {i > 0 && (
              <line x1={x} x2={x} y1={BAR_Y - 8} y2={BAR_Y + BAR_H + 8} stroke={INK} strokeWidth={1} opacity={0.35} />
            )}
            {/* label above bar */}
            <text x={x + 10} y={BAR_Y - 14} fill={INK} fontSize={16} fontWeight={600}>
              {seg.label}
            </text>
            {/* size inside bar */}
            <text
              x={x + w / 2}
              y={BAR_Y + BAR_H / 2 - 4}
              fill={fg}
              fontSize={20}
              fontWeight={600}
              textAnchor="middle"
              className="tab-nums"
            >
              {kb(seg.bytes)}
            </text>
            <text
              x={x + w / 2}
              y={BAR_Y + BAR_H / 2 + 20}
              fill={fg}
              fontSize={13}
              textAnchor="middle"
              opacity={0.85}
              className="tab-nums"
            >
              {pct}% of pack
            </text>
            {/* detail below bar; last segment anchors right so it never clips */}
            <text
              x={i === SEGMENTS.length - 1 ? x + w - 10 : x + 10}
              y={BAR_Y + BAR_H + 26}
              fill={INK}
              fontSize={13}
              opacity={0.62}
              textAnchor={i === SEGMENTS.length - 1 ? "end" : "start"}
            >
              {seg.detail}
            </text>
          </g>
        );
      })}

      {/* lower panel: bit-level layout */}
      <text x={LEFT} y={400} fill={INK} fontSize={22} fontWeight={600}>
        every token entry begins with a single header byte
      </text>
      <text x={LEFT} y={426} fill={INK} fontSize={14} opacity={0.62}>
        3 bits of type flag + 5 bits of token length replace the legacy{" "}
        <tspan fontFamily="JetBrains Mono, monospace">e:</tspan>,{" "}
        <tspan fontFamily="JetBrains Mono, monospace">p:</tspan>,{" "}
        <tspan fontFamily="JetBrains Mono, monospace">j:</tspan> prefix strings; that alone saves ≈14 KB of repeated prefix text across ≈7.2k tokens.
      </text>

      {(() => {
        const boxSize = 110;
        const gap = 12;
        const startX = LEFT + 60;
        const boxY = 490;
        const bits = [
          { bit: 7, kind: "type", val: "t" },
          { bit: 6, kind: "type", val: "t" },
          { bit: 5, kind: "type", val: "t" },
          { bit: 4, kind: "len", val: "L" },
          { bit: 3, kind: "len", val: "L" },
          { bit: 2, kind: "len", val: "L" },
          { bit: 1, kind: "len", val: "L" },
          { bit: 0, kind: "len", val: "L" },
        ];
        const typeEndX = startX + 3 * (boxSize + gap) - gap;
        const lenStartX = startX + 3 * (boxSize + gap);
        const lenEndX = startX + 8 * (boxSize + gap) - gap;
        return (
          <>
            {bits.map((b, i) => {
              const x = startX + i * (boxSize + gap);
              const fill = b.kind === "type" ? ACCENT : NEUTRAL;
              return (
                <g key={i}>
                  <rect x={x} y={boxY} width={boxSize} height={boxSize} fill={fill} />
                  <text
                    x={x + boxSize / 2}
                    y={boxY + boxSize / 2 + 16}
                    fill={b.kind === "type" ? "#F6F1EA" : INK}
                    fontSize={44}
                    fontWeight={600}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, ui-monospace, monospace"
                  >
                    {b.val}
                  </text>
                  <text
                    x={x + boxSize / 2}
                    y={boxY - 14}
                    fill={INK}
                    fontSize={14}
                    textAnchor="middle"
                    className="tab-nums"
                    opacity={0.72}
                  >
                    bit {b.bit}
                  </text>
                </g>
              );
            })}
            <line x1={startX} x2={typeEndX} y1={boxY + boxSize + 24} y2={boxY + boxSize + 24} stroke={INK} strokeWidth={1.5} />
            <text
              x={(startX + typeEndX) / 2}
              y={boxY + boxSize + 50}
              fill={ACCENT}
              fontSize={18}
              fontWeight={600}
              textAnchor="middle"
            >
              3 bits — token type
            </text>
            <text
              x={(startX + typeEndX) / 2}
              y={boxY + boxSize + 72}
              fill={INK}
              fontSize={13}
              opacity={0.62}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
            >
              0 = exact · 1 = prefix · 2 = CJK bigram · 3–7 reserved
            </text>

            <line x1={lenStartX} x2={lenEndX} y1={boxY + boxSize + 24} y2={boxY + boxSize + 24} stroke={INK} strokeWidth={1.5} />
            <text
              x={(lenStartX + lenEndX) / 2}
              y={boxY + boxSize + 50}
              fill={INK}
              fontSize={18}
              fontWeight={600}
              textAnchor="middle"
            >
              5 bits — token length
            </text>
            <text
              x={(lenStartX + lenEndX) / 2}
              y={boxY + boxSize + 72}
              fill={INK}
              fontSize={13}
              opacity={0.62}
              textAnchor="middle"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
            >
              value ∈ [1, 31]; oversized tokens fall back to a varint extension
            </text>
          </>
        );
      })()}

      {/* streamed layout of a full token entry */}
      <text x={LEFT} y={800} fill={INK} fontSize={19} fontWeight={600}>
        full token entry, streamed left-to-right
      </text>
      <g transform={`translate(${LEFT}, 824)`}>
        {[
          { w: 140, label: "header byte", sub: "type + length", fill: ACCENT, fg: "#F6F1EA" },
          { w: 260, label: "token bytes", sub: "UTF-8, length from header", fill: NEUTRAL, fg: INK },
          { w: 180, label: "posting count", sub: "varint", fill: NEUTRAL, fg: INK },
          { w: 360, label: "posting deltas", sub: "docId Δ varint × N", fill: NEUTRAL, fg: INK },
          { w: 360, label: "posting scores", sub: "score varint × N", fill: NEUTRAL, fg: INK },
        ].map((s, i, arr) => {
          const x = arr.slice(0, i).reduce((a, b) => a + b.w, 0);
          return (
            <g key={i}>
              <rect x={x} y={0} width={s.w} height={64} fill={s.fill} />
              {i > 0 && <line x1={x} x2={x} y1={-6} y2={70} stroke={INK} strokeWidth={1} opacity={0.35} />}
              <text x={x + s.w / 2} y={40} fill={s.fg} fontSize={16} fontWeight={600} textAnchor="middle">
                {s.label}
              </text>
              <text x={x + s.w / 2} y={88} fill={INK} fontSize={13} textAnchor="middle" opacity={0.62}>
                {s.sub}
              </text>
            </g>
          );
        })}
      </g>

      <text x={LEFT} y={H - 24} fill={INK} fontSize={13} opacity={0.55}>
        Every field is byte-aligned; decoding happens in a single forward pass with a handful of varint reads — no JSON parser, no schema validation.
      </text>
    </svg>
  );
}
