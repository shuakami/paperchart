// State diagram (Mermaid `stateDiagram-v2`). Rounded-rect states laid out in
// layers by longest-path from the start state. The start and end pseudostates
// are rendered as filled circles (● and ⊙ respectively). Transitions are
// curved paths with arrowheads and an optional event label. Self-loops curve
// out to the right of the state.
//
// data shape:
//   {
//     direction?: "TD" | "LR",
//     states: [{ id, label, caption?, start?, end?, accent? }, ...],
//     transitions: [{ from, to, label?, accent?, dashed? }, ...]
//   }

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type State = {
  id: string;
  label: string;
  caption?: string;
  start?: boolean;
  end?: boolean;
  accent?: boolean;
};
type Transition = {
  from: string;
  to: string;
  label?: string;
  accent?: boolean;
  dashed?: boolean;
};
type StateInput = {
  direction?: "TD" | "LR";
  states: State[];
  transitions: Transition[];
};

type StateLayout = BaseLayout & {
  stateWidth?: number;
  stateHeight?: number;
  layerGap?: number;
  stateGap?: number;
};

const DEFAULT_DATA: StateInput = {
  direction: "LR",
  states: [
    { id: "init",    label: "•",                     start: true },
    { id: "idle",    label: "idle",                  caption: "awaiting input" },
    { id: "parsing", label: "parsing",               caption: "tokenize + normalize" },
    { id: "query",   label: "querying",              caption: "fetch + score",       accent: true },
    { id: "render",  label: "rendering",             caption: "paint + animate" },
    { id: "error",   label: "error",                 caption: "surface to user" },
    { id: "done",    label: "⊙",                     end: true },
  ],
  transitions: [
    { from: "init",    to: "idle" },
    { from: "idle",    to: "parsing", label: "submit" },
    { from: "parsing", to: "query",   label: "ok",      accent: true },
    { from: "parsing", to: "error",   label: "invalid", dashed: true },
    { from: "query",   to: "render",  label: "200" },
    { from: "query",   to: "error",   label: "timeout", dashed: true },
    { from: "render",  to: "idle",    label: "close" },
    { from: "render",  to: "done",    label: "exit" },
    { from: "error",   to: "idle",    label: "retry" },
  ],
};

function assignLayers(
  states: State[],
  transitions: Transition[]
): Map<string, number> {
  // Back-edge detection via iterative DFS so retry / feedback transitions
  // don't stretch the graph forward.
  const outgoing = new Map<string, string[]>();
  for (const s of states) outgoing.set(s.id, []);
  for (const t of transitions) {
    if (t.from === t.to) continue;
    if (outgoing.has(t.from)) outgoing.get(t.from)!.push(t.to);
  }

  const st = new Map<string, 0 | 1 | 2>();
  for (const s of states) st.set(s.id, 0);
  const backEdges = new Set<string>();
  const stack: Array<{ id: string; i: number }> = [];
  const push = (id: string) => {
    st.set(id, 1);
    stack.push({ id, i: 0 });
  };
  for (const root of states) {
    if (st.get(root.id) !== 0) continue;
    push(root.id);
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const succs = outgoing.get(top.id) ?? [];
      if (top.i < succs.length) {
        const v = succs[top.i]!;
        top.i += 1;
        const s = st.get(v);
        if (s === 1) backEdges.add(`${top.id}->${v}`);
        else if (s === 0) push(v);
      } else {
        st.set(top.id, 2);
        stack.pop();
      }
    }
  }

  const incomingFwd = new Map<string, string[]>();
  for (const s of states) incomingFwd.set(s.id, []);
  for (const t of transitions) {
    if (t.from === t.to) continue;
    if (backEdges.has(`${t.from}->${t.to}`)) continue;
    if (incomingFwd.has(t.to)) incomingFwd.get(t.to)!.push(t.from);
  }

  const layer = new Map<string, number>();
  const compute = (id: string): number => {
    const c = layer.get(id);
    if (c !== undefined) return c;
    const parents = incomingFwd.get(id) ?? [];
    let l = 0;
    for (const p of parents) l = Math.max(l, compute(p) + 1);
    layer.set(id, l);
    return l;
  };
  for (const s of states) compute(s.id);
  return layer;
}

function StateCore({
  theme,
  input,
  layout,
  style,
}: {
  theme: Theme;
  input: StateInput;
  layout: StateLayout;
  style: StyleOverrides;
}) {
  const ink = style.ink ?? theme.ink;
  const muted = style.muted ?? theme.muted;
  const rule = style.rule ?? theme.rule;
  const accent = style.accent ?? theme.accent;
  const bg = style.bg ?? theme.bg;
  const panel = theme.panel ?? theme.bg;

  const direction = input.direction === "TD" ? "TD" : "LR";
  const isLR = direction === "LR";

  const W = num(layout.width, 1600);
  const H = num(layout.height, 720);
  const fontScale = num(layout.fontScale, 1);
  const stateW = num(layout.stateWidth, 200);
  const stateH = num(layout.stateHeight, 76);
  const layerGap = num(layout.layerGap, isLR ? 84 : 70);
  const stateGap = num(layout.stateGap, 32);
  const padTop = num(layout.padding?.top, 60);
  const padRight = num(layout.padding?.right, 50);
  const padBottom = num(layout.padding?.bottom, 60);
  const padLeft = num(layout.padding?.left, 50);

  const layerOf = assignLayers(input.states, input.transitions);
  const maxLayer = Math.max(0, ...Array.from(layerOf.values()));
  const layers: State[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const s of input.states) layers[layerOf.get(s.id)!]!.push(s);

  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  type Placed = State & { x: number; y: number; w: number; h: number; pseudo: boolean };
  const placed = new Map<string, Placed>();
  const pseudoR = 14;

  const sizeOf = (s: State) => {
    const pseudo = !!(s.start || s.end);
    return {
      w: pseudo ? pseudoR * 2 : stateW,
      h: pseudo ? pseudoR * 2 : stateH,
      pseudo,
    };
  };

  if (isLR) {
    const totalX = (maxLayer + 1) * stateW + maxLayer * layerGap;
    const startX = padLeft + (plotW - totalX) / 2 + stateW / 2;
    for (let l = 0; l <= maxLayer; l++) {
      const col = layers[l]!;
      const totalH = col.reduce((acc, s, idx) => acc + sizeOf(s).h + (idx > 0 ? stateGap : 0), 0);
      let y = padTop + (plotH - totalH) / 2;
      col.forEach((s) => {
        const sz = sizeOf(s);
        const cx = startX + l * (stateW + layerGap);
        placed.set(s.id, { ...s, ...sz, x: cx - sz.w / 2, y });
        y += sz.h + stateGap;
      });
    }
  } else {
    const totalY = (maxLayer + 1) * stateH + maxLayer * layerGap;
    const startY = padTop + (plotH - totalY) / 2 + stateH / 2;
    for (let l = 0; l <= maxLayer; l++) {
      const row = layers[l]!;
      const totalW = row.reduce((acc, s, idx) => acc + sizeOf(s).w + (idx > 0 ? stateGap : 0), 0);
      let x = padLeft + (plotW - totalW) / 2;
      row.forEach((s) => {
        const sz = sizeOf(s);
        const cy = startY + l * (stateH + layerGap);
        placed.set(s.id, { ...s, ...sz, x, y: cy - sz.h / 2 });
        x += sz.w + stateGap;
      });
    }
  }

  const arrowId = "pc-state-arrow";
  const arrowAccentId = "pc-state-arrow-accent";

  const pathFor = (a: Placed, b: Placed) => {
    if (a.id === b.id) {
      // self loop — arc out to the right
      const cx = a.x + a.w;
      const cy = a.y + a.h / 2;
      const r = 22;
      return {
        d: `M ${cx - 2} ${cy - 10} C ${cx + r} ${cy - r}, ${cx + r} ${cy + r}, ${cx - 2} ${cy + 10}`,
        lx: cx + r + 6,
        ly: cy,
      };
    }
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const dx = bx - ax;
    const dy = by - ay;
    const preferH = Math.abs(dx) > Math.abs(dy);
    let sx: number, sy: number, ex: number, ey: number;
    if (preferH) {
      sx = dx > 0 ? a.x + a.w : a.x;
      sy = ay;
      ex = dx > 0 ? b.x : b.x + b.w;
      ey = by;
    } else {
      sx = ax;
      sy = dy > 0 ? a.y + a.h : a.y;
      ex = bx;
      ey = dy > 0 ? b.y : b.y + b.h;
    }
    const midX = preferH ? (sx + ex) / 2 : sx;
    return {
      d: `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`,
      lx: (sx + ex) / 2,
      ly: (sy + ey) / 2 - (preferH ? 8 : 0),
    };
  };

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
      </defs>

      {/* transitions first */}
      {input.transitions.map((t, i) => {
        const a = placed.get(t.from);
        const b = placed.get(t.to);
        if (!a || !b) return null;
        const p = pathFor(a, b);
        const color = t.accent ? accent : muted;
        const marker = t.accent ? arrowAccentId : arrowId;
        return (
          <g key={`t-${i}`}>
            <path
              d={p.d}
              fill="none"
              stroke={color}
              strokeWidth={t.accent ? 1.6 : 1.2}
              strokeDasharray={t.dashed ? "5 4" : undefined}
              markerEnd={`url(#${marker})`}
            />
            {t.label && (
              <g>
                <rect
                  x={p.lx - t.label.length * 3.3 * fontScale - 5}
                  y={p.ly - 9 * fontScale}
                  width={t.label.length * 6.6 * fontScale + 10}
                  height={18 * fontScale}
                  fill={bg}
                />
                <text
                  x={p.lx}
                  y={p.ly + 3}
                  fontSize={11 * fontScale}
                  fill={muted}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "inherit" }}
                >
                  {t.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* states */}
      {Array.from(placed.values()).map((s) => {
        if (s.pseudo) {
          const cx = s.x + s.w / 2;
          const cy = s.y + s.h / 2;
          return (
            <g key={s.id}>
              {s.end ? (
                <>
                  <circle cx={cx} cy={cy} r={pseudoR} fill={bg} stroke={ink} strokeWidth={1.2} />
                  <circle cx={cx} cy={cy} r={pseudoR - 5} fill={ink} />
                </>
              ) : (
                <circle cx={cx} cy={cy} r={pseudoR - 4} fill={ink} />
              )}
            </g>
          );
        }
        const stroke = s.accent ? accent : ink;
        const sw = s.accent ? 1.6 : 1;
        const fill = s.accent ? panel : bg;
        return (
          <g key={s.id}>
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={12}
              ry={12}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            <text
              x={s.x + s.w / 2}
              y={s.y + s.h / 2 - (s.caption ? 9 : 0)}
              fontSize={14 * fontScale}
              fontWeight={500}
              fill={ink}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontFamily: "inherit" }}
            >
              {s.label}
            </text>
            {s.caption && (
              <text
                x={s.x + s.w / 2}
                y={s.y + s.h / 2 + 12}
                fontSize={11 * fontScale}
                fill={muted}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontFamily: "inherit" }}
              >
                {s.caption}
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

export default function StateDiagramChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
} = {}) {
  const resolved = resolveTheme(theme);
  const { data: parsed, layout, style } = unwrap<StateInput>(data);
  const d = parsed ?? DEFAULT_DATA;
  const safe: StateInput = {
    direction: d.direction === "TD" ? "TD" : "LR",
    states: Array.isArray(d.states) ? d.states : [],
    transitions: Array.isArray(d.transitions) ? d.transitions : [],
  };
  return (
    <StateCore
      theme={resolved}
      input={safe}
      layout={layout as StateLayout}
      style={style}
    />
  );
}
