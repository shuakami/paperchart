// Sequence diagram (lifelines + messages + activations) — the Mermaid
// `sequenceDiagram` primitive. Actors are drawn across the top as labeled
// boxes; a dashed vertical lifeline descends from each. Messages are drawn
// as directed arrows between lifelines in time order. Activation bars show
// when an actor is actively processing. Notes over a single actor or
// spanning actors are also supported.
//
// data shape:
//   {
//     actors: [{ id, label, caption? }, ...],
//     steps: [
//       { kind: "msg", from, to, label?, reply?, async?, accent? },
//       { kind: "note", over: id | [id, id], text },
//       ...
//     ]
//   }

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Actor = { id: string; label: string; caption?: string };

type Msg = {
  kind: "msg";
  from: string;
  to: string;
  label?: string;
  reply?: boolean;
  async?: boolean;
  accent?: boolean;
};
type Note = {
  kind: "note";
  over: string | [string, string];
  text: string;
};
type Step = Msg | Note;

type SequenceInput = { actors: Actor[]; steps: Step[] };

type SequenceLayout = BaseLayout & {
  actorWidth?: number;
  actorHeight?: number;
  rowHeight?: number;
};

const DEFAULT_DATA: SequenceInput = {
  actors: [
    { id: "user",    label: "browser",     caption: "client" },
    { id: "edge",    label: "edge",        caption: "CDN + JS runtime" },
    { id: "origin",  label: "origin",      caption: "API server" },
    { id: "store",   label: "index store", caption: "brotli pack" },
  ],
  steps: [
    { kind: "msg",  from: "user",   to: "edge",    label: "GET /docs?q=auth" },
    { kind: "note", over: "edge",   text: "parse + normalize query" },
    { kind: "msg",  from: "edge",   to: "store",   label: "fetch pack.bin.br",          accent: true },
    { kind: "msg",  from: "store",  to: "edge",    label: "1.24 MB (brotli)",           reply: true },
    { kind: "note", over: ["edge", "origin"],     text: "index hot in memory for 10 min" },
    { kind: "msg",  from: "edge",   to: "edge",    label: "score + rank" },
    { kind: "msg",  from: "edge",   to: "user",    label: "200 OK • 18 hits",           reply: true, accent: true },
    { kind: "msg",  from: "user",   to: "edge",    label: "open result #3",             async: true },
    { kind: "msg",  from: "edge",   to: "origin",  label: "GET /page/auth-oauth" },
    { kind: "msg",  from: "origin", to: "user",    label: "page payload",               reply: true },
  ],
};

function SequenceCore({
  theme,
  input,
  layout,
  style,
}: {
  theme: Theme;
  input: SequenceInput;
  layout: SequenceLayout;
  style: StyleOverrides;
}) {
  const ink = style.ink ?? theme.ink;
  const muted = style.muted ?? theme.muted;
  const rule = style.rule ?? theme.rule;
  const accent = style.accent ?? theme.accent;
  const bg = style.bg ?? theme.bg;
  const panel = theme.panel ?? theme.bg;

  const W = num(layout.width, 1600);
  const H = num(layout.height, 900);
  const fontScale = num(layout.fontScale, 1);
  const padTop = num(layout.padding?.top, 36);
  const padRight = num(layout.padding?.right, 40);
  const padBottom = num(layout.padding?.bottom, 40);
  const padLeft = num(layout.padding?.left, 40);

  const actorWidth = num(layout.actorWidth, 200);
  const actorHeight = num(layout.actorHeight, 64);
  const rowHeight = num(layout.rowHeight, 58);

  const actorSpacing = (W - padLeft - padRight - actorWidth) / Math.max(1, input.actors.length - 1);
  const actorCenterX = new Map<string, number>();
  input.actors.forEach((a, i) => {
    actorCenterX.set(a.id, padLeft + actorWidth / 2 + i * actorSpacing);
  });

  const headerTop = padTop;
  const headerBottom = headerTop + actorHeight;
  const lifelineTop = headerBottom + 12;
  const stepsTop = lifelineTop + 16;

  // pre-compute total height so we can center if there's extra space
  const usedHeight = stepsTop + input.steps.length * rowHeight + 16;
  const lifelineBottom = Math.min(H - padBottom, usedHeight);

  const arrowId = "pc-seq-arrow";
  const arrowAccentId = "pc-seq-arrow-accent";
  const openArrowId = "pc-seq-open";
  const openArrowAccentId = "pc-seq-open-accent";

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", background: bg }}
    >
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={ink} />
        </marker>
        <marker id={arrowAccentId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={accent} />
        </marker>
        <marker id={openArrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={ink} strokeWidth="1.4" />
        </marker>
        <marker id={openArrowAccentId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={accent} strokeWidth="1.4" />
        </marker>
      </defs>

      {/* actor boxes + lifelines */}
      {input.actors.map((a) => {
        const cx = actorCenterX.get(a.id)!;
        return (
          <g key={a.id}>
            <rect
              x={cx - actorWidth / 2}
              y={headerTop}
              width={actorWidth}
              height={actorHeight}
              fill={panel}
              stroke={ink}
              strokeWidth={1}
            />
            <text
              x={cx}
              y={headerTop + (a.caption ? 26 : actorHeight / 2)}
              fontSize={14 * fontScale}
              fontWeight={500}
              fill={ink}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontFamily: "inherit" }}
            >
              {a.label}
            </text>
            {a.caption && (
              <text
                x={cx}
                y={headerTop + 44}
                fontSize={11 * fontScale}
                fill={muted}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontFamily: "inherit" }}
              >
                {a.caption}
              </text>
            )}
            <line
              x1={cx}
              x2={cx}
              y1={lifelineTop}
              y2={lifelineBottom}
              stroke={rule}
              strokeDasharray="4 4"
            />
          </g>
        );
      })}

      {/* steps */}
      {input.steps.map((s, i) => {
        const y = stepsTop + i * rowHeight + rowHeight / 2;

        if (s.kind === "note") {
          const ids = Array.isArray(s.over) ? s.over : [s.over, s.over];
          const cx1 = actorCenterX.get(ids[0]);
          const cx2 = actorCenterX.get(ids[1]);
          if (cx1 === undefined || cx2 === undefined) return null;
          const lo = Math.min(cx1, cx2);
          const hi = Math.max(cx1, cx2);
          const x = lo - (Array.isArray(s.over) ? 0 : 70);
          const w = Array.isArray(s.over) ? hi - lo : 140;
          const h = 36;
          return (
            <g key={`step-${i}`}>
              <rect
                x={x}
                y={y - h / 2}
                width={w}
                height={h}
                fill={panel}
                stroke={muted}
                strokeDasharray="4 3"
              />
              <text
                x={x + w / 2}
                y={y}
                fontSize={12 * fontScale}
                fill={muted}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontFamily: "inherit" }}
              >
                {s.text}
              </text>
            </g>
          );
        }

        // message
        const fromX = actorCenterX.get(s.from);
        const toX = actorCenterX.get(s.to);
        if (fromX === undefined || toX === undefined) return null;

        const color = s.accent ? accent : ink;
        const strokeWidth = s.accent ? 1.6 : 1.2;
        const selfLoop = s.from === s.to;

        let markerEnd: string;
        if (s.async || s.reply) {
          markerEnd = s.accent ? openArrowAccentId : openArrowId;
        } else {
          markerEnd = s.accent ? arrowAccentId : arrowId;
        }
        const dash = s.reply ? "5 4" : undefined;

        if (selfLoop) {
          const loopR = 26;
          const sx = fromX;
          const d =
            `M ${sx} ${y - 6}` +
            ` L ${sx + loopR} ${y - 6}` +
            ` L ${sx + loopR} ${y + 10}` +
            ` L ${sx} ${y + 10}`;
          return (
            <g key={`step-${i}`}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                markerEnd={`url(#${markerEnd})`}
              />
              {s.label && (
                <text
                  x={sx + loopR + 8}
                  y={y + 2}
                  fontSize={12 * fontScale}
                  fill={muted}
                  dominantBaseline="middle"
                  style={{ fontFamily: "inherit" }}
                >
                  {s.label}
                </text>
              )}
            </g>
          );
        }

        return (
          <g key={`step-${i}`}>
            <line
              x1={fromX}
              y1={y}
              x2={toX}
              y2={y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={dash}
              markerEnd={`url(#${markerEnd})`}
            />
            {s.label && (
              <text
                x={(fromX + toX) / 2}
                y={y - 8}
                fontSize={12 * fontScale}
                fill={muted}
                textAnchor="middle"
                dominantBaseline="text-after-edge"
                style={{ fontFamily: "inherit" }}
              >
                {s.label}
              </text>
            )}
          </g>
        );
      })}

      <rect
        x={0.5}
        y={0.5}
        width={W - 1}
        height={H - 1}
        fill="none"
        stroke={rule}
      />
    </svg>
  );
}

export default function SequenceChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
} = {}) {
  const resolved = resolveTheme(theme);
  const { data: parsed, layout, style } = unwrap<SequenceInput>(data);
  const d = parsed ?? DEFAULT_DATA;
  const safe: SequenceInput = {
    actors: Array.isArray(d.actors) ? d.actors : [],
    steps: Array.isArray(d.steps) ? d.steps : [],
  };
  return (
    <SequenceCore
      theme={resolved}
      input={safe}
      layout={layout as SequenceLayout}
      style={style}
    />
  );
}
