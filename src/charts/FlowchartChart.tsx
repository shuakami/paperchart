// Layered flowchart (like Mermaid `flowchart TD` / `LR`). Nodes belong to one
// of a handful of shapes — rect, round, stadium (terminal), diamond (decision),
// cylinder (store) — and are laid out in discrete layers computed from the
// longest path from any source. Edges route with a single orthogonal bend and
// a closed triangular arrowhead. An optional `accent: true` on a node or edge
// raises it to the theme accent.
//
// data shape:
//   {
//     direction: "TD" | "LR",
//     nodes: [
//       { id, label, caption?, shape?, accent? },
//       ...
//     ],
//     edges: [
//       { from, to, label?, dashed?, accent? },
//       ...
//     ]
//   }

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  str,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

export type FlowchartShape =
  | "rect"
  | "round"
  | "stadium"
  | "diamond"
  | "cylinder";

export type FlowchartNode = {
  id: string;
  label: string;
  caption?: string;
  shape?: FlowchartShape;
  accent?: boolean;
};

export type FlowchartEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  accent?: boolean;
};

export type FlowchartInput = {
  direction?: "TD" | "LR";
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
};

type FlowchartLayout = BaseLayout & {
  nodeWidth?: number;
  nodeHeight?: number;
  layerGap?: number;
  nodeGap?: number;
};

const DEFAULT_DATA: FlowchartInput = {
  direction: "TD",
  nodes: [
    { id: "q",      label: "user query",           shape: "stadium" },
    { id: "norm",   label: "normalize",            caption: "lower + nfc",    shape: "rect" },
    { id: "cache",  label: "cache hit?",           shape: "diamond" },
    { id: "cached", label: "return cached",        shape: "round" },
    { id: "idx",    label: "fetch pack",           caption: "brotli decode",  shape: "cylinder" },
    { id: "score",  label: "score + rank",         caption: "jaccard + tf",   shape: "rect",     accent: true },
    { id: "typo",   label: "typo?",                shape: "diamond" },
    { id: "corr",   label: "correct + retry",      shape: "rect" },
    { id: "out",    label: "render results",       shape: "stadium" },
  ],
  edges: [
    { from: "q",      to: "norm" },
    { from: "norm",   to: "cache" },
    { from: "cache",  to: "cached", label: "yes" },
    { from: "cache",  to: "idx",    label: "no" },
    { from: "idx",    to: "score" },
    { from: "score",  to: "typo" },
    { from: "typo",   to: "corr",   label: "yes" },
    { from: "corr",   to: "score",  dashed: true },
    { from: "typo",   to: "out",    label: "no",   accent: true },
    { from: "cached", to: "out" },
  ],
};

function assignLayers(nodes: FlowchartNode[], edges: FlowchartEdge[]): Map<string, number> {
  // Step 1: DFS to find back-edges (cycles). Back-edges are ignored for
  // layer assignment so a retry / feedback edge doesn't pull a node forward
  // in the graph.
  const outgoing = new Map<string, string[]>();
  for (const n of nodes) outgoing.set(n.id, []);
  for (const e of edges) {
    if (e.from === e.to) continue;
    if (outgoing.has(e.from)) outgoing.get(e.from)!.push(e.to);
  }

  const state = new Map<string, 0 | 1 | 2>(); // 0=unseen, 1=visiting, 2=done
  for (const n of nodes) state.set(n.id, 0);
  const backEdges = new Set<string>();
  const stack: Array<{ id: string; i: number }> = [];
  const pushFrame = (id: string) => {
    state.set(id, 1);
    stack.push({ id, i: 0 });
  };
  for (const root of nodes) {
    if (state.get(root.id) !== 0) continue;
    pushFrame(root.id);
    while (stack.length) {
      const top = stack[stack.length - 1]!;
      const succs = outgoing.get(top.id) ?? [];
      if (top.i < succs.length) {
        const v = succs[top.i]!;
        top.i += 1;
        const s = state.get(v);
        if (s === 1) {
          backEdges.add(`${top.id}->${v}`);
        } else if (s === 0) {
          pushFrame(v);
        }
      } else {
        state.set(top.id, 2);
        stack.pop();
      }
    }
  }

  // Step 2: build forward-only incoming map (skipping back-edges & self-loops)
  const incomingFwd = new Map<string, string[]>();
  for (const n of nodes) incomingFwd.set(n.id, []);
  for (const e of edges) {
    if (e.from === e.to) continue;
    if (backEdges.has(`${e.from}->${e.to}`)) continue;
    if (incomingFwd.has(e.to)) incomingFwd.get(e.to)!.push(e.from);
  }

  // Step 3: longest-path layering on the DAG.
  const layer = new Map<string, number>();
  const compute = (id: string): number => {
    const cached = layer.get(id);
    if (cached !== undefined) return cached;
    const parents = incomingFwd.get(id) ?? [];
    let l = 0;
    for (const p of parents) l = Math.max(l, compute(p) + 1);
    layer.set(id, l);
    return l;
  };
  for (const n of nodes) compute(n.id);
  return layer;
}

type Placed = FlowchartNode & {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: FlowchartShape;
};

function ellipsizedLines(label: string, maxChars: number): string[] {
  if (label.length <= maxChars) return [label];
  // naive wrap on spaces
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
      continue;
    }
    if (cur.length + 1 + w.length <= maxChars) cur = cur + " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function FlowchartCore({ theme, input, layout, style }: {
  theme: Theme;
  input: FlowchartInput;
  layout: FlowchartLayout;
  style: StyleOverrides;
}) {
  const ink = style.ink ?? theme.ink;
  const muted = style.muted ?? theme.muted;
  const rule = style.rule ?? theme.rule;
  const accent = style.accent ?? theme.accent;
  const bg = style.bg ?? theme.bg;
  const panel = theme.panel ?? theme.bg;

  const direction = input.direction === "LR" ? "LR" : "TD";
  const isTD = direction === "TD";

  const fontScale = num(layout.fontScale, 1);
  const nodeW = num(layout.nodeWidth, isTD ? 220 : 210);
  const nodeH = num(layout.nodeHeight, 68);
  const layerGap = num(layout.layerGap, isTD ? 56 : 80);
  const nodeGap = num(layout.nodeGap, 26);

  // Compute required height from layer count so charts with many layers
  // don't get vertically clipped.
  const layerCountForSize = (() => {
    const tmp = assignLayers(input.nodes, input.edges);
    return Math.max(0, ...Array.from(tmp.values())) + 1;
  })();
  const maxCol = (() => {
    const tmp = assignLayers(input.nodes, input.edges);
    const counts = new Map<number, number>();
    for (const [, l] of tmp) counts.set(l, (counts.get(l) ?? 0) + 1);
    return Math.max(1, ...Array.from(counts.values()));
  })();

  const W = num(layout.width, 1600);
  const naturalH = isTD
    ? 80 + layerCountForSize * nodeH + Math.max(0, layerCountForSize - 1) * layerGap + 80
    : 80 + maxCol * nodeH + Math.max(0, maxCol - 1) * nodeGap + 80;
  const H = num(layout.height, Math.max(720, naturalH));

  const padTop = num(layout.padding?.top, 40);
  const padRight = num(layout.padding?.right, 40);
  const padBottom = num(layout.padding?.bottom, 48);
  const padLeft = num(layout.padding?.left, 40);

  // 1. Assign layers.
  const layerOf = assignLayers(input.nodes, input.edges);
  const maxLayer = Math.max(0, ...Array.from(layerOf.values()));
  const layers: FlowchartNode[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const n of input.nodes) {
    layers[layerOf.get(n.id)!]!.push(n);
  }

  // 2. Position nodes.
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const placed = new Map<string, Placed>();

  if (isTD) {
    // Layers stacked vertically. Each layer spreads horizontally.
    const totalNodeSpan = (maxLayer + 1) * nodeH + maxLayer * layerGap;
    const startY = padTop + Math.max(0, (plotH - totalNodeSpan) / 2);
    for (let l = 0; l <= maxLayer; l++) {
      const row = layers[l]!;
      const totalW = row.length * nodeW + Math.max(0, row.length - 1) * nodeGap;
      const startX = padLeft + (plotW - totalW) / 2;
      const y = startY + l * (nodeH + layerGap);
      row.forEach((n, i) => {
        placed.set(n.id, {
          ...n,
          shape: n.shape ?? "rect",
          x: startX + i * (nodeW + nodeGap),
          y,
          w: nodeW,
          h: nodeH,
        });
      });
    }
  } else {
    // LR: layers stacked horizontally.
    const totalNodeSpan = (maxLayer + 1) * nodeW + maxLayer * layerGap;
    const startX = padLeft + Math.max(0, (plotW - totalNodeSpan) / 2);
    for (let l = 0; l <= maxLayer; l++) {
      const col = layers[l]!;
      const totalH = col.length * nodeH + Math.max(0, col.length - 1) * nodeGap;
      const startY = padTop + (plotH - totalH) / 2;
      const x = startX + l * (nodeW + layerGap);
      col.forEach((n, i) => {
        placed.set(n.id, {
          ...n,
          shape: n.shape ?? "rect",
          x,
          y: startY + i * (nodeH + nodeGap),
          w: nodeW,
          h: nodeH,
        });
      });
    }
  }

  // 3. Edges. Entry/exit points depend on direction.
  // For forward edges (layer strictly increasing), draw an orthogonal path
  // with one bend. For reverse/sideways edges, draw a looped path that
  // detours around the layer to avoid overlapping nodes.
  const edgePaths: Array<{
    d: string;
    labelX?: number;
    labelY?: number;
    label?: string;
    dashed: boolean;
    accent: boolean;
    id: string;
  }> = [];

  input.edges.forEach((e, i) => {
    const a = placed.get(e.from);
    const b = placed.get(e.to);
    if (!a || !b) return;

    const fromLayer = layerOf.get(e.from)!;
    const toLayer = layerOf.get(e.to)!;
    const forward = toLayer > fromLayer;
    const same = toLayer === fromLayer;

    let d = "";
    let lx: number | undefined;
    let ly: number | undefined;

    if (isTD) {
      if (forward) {
        const x1 = a.x + a.w / 2;
        const y1 = a.y + a.h;
        const x2 = b.x + b.w / 2;
        const y2 = b.y;
        const midY = y1 + (y2 - y1) / 2;
        d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        lx = (x1 + x2) / 2;
        ly = midY - 6;
      } else if (same) {
        // sideways — hop over
        const y = a.y + a.h / 2;
        const x1 = a.x + a.w;
        const x2 = b.x;
        d = `M ${x1} ${y} L ${x2} ${y}`;
        lx = (x1 + x2) / 2;
        ly = y - 6;
      } else {
        // reverse — loop out the right, up, and back in
        const y1 = a.y + a.h / 2;
        const y2 = b.y + b.h / 2;
        const x1 = a.x + a.w;
        const x2 = b.x + b.w;
        const loopX = Math.max(x1, x2) + 40;
        d = `M ${x1} ${y1} L ${loopX} ${y1} L ${loopX} ${y2} L ${x2} ${y2}`;
        lx = loopX + 8;
        ly = (y1 + y2) / 2;
      }
    } else {
      if (forward) {
        const x1 = a.x + a.w;
        const y1 = a.y + a.h / 2;
        const x2 = b.x;
        const y2 = b.y + b.h / 2;
        const midX = x1 + (x2 - x1) / 2;
        d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        lx = midX + 6;
        ly = (y1 + y2) / 2 - 6;
      } else if (same) {
        const x = a.x + a.w / 2;
        const y1 = a.y + a.h;
        const y2 = b.y;
        d = `M ${x} ${y1} L ${x} ${y2}`;
        lx = x + 6;
        ly = (y1 + y2) / 2;
      } else {
        const x1 = a.x + a.w / 2;
        const y1 = a.y + a.h;
        const x2 = b.x + b.w / 2;
        const y2 = b.y + b.h;
        const loopY = Math.max(y1, y2) + 40;
        d = `M ${x1} ${y1} L ${x1} ${loopY} L ${x2} ${loopY} L ${x2} ${y2}`;
        lx = (x1 + x2) / 2;
        ly = loopY + 10;
      }
    }

    edgePaths.push({
      id: `e${i}`,
      d,
      label: e.label,
      labelX: lx,
      labelY: ly,
      dashed: !!e.dashed,
      accent: !!e.accent,
    });
  });

  // Node shape renderers.
  const renderNode = (n: Placed) => {
    const stroke = n.accent ? accent : ink;
    const strokeWidth = n.accent ? 1.6 : 1;
    const fill = n.accent ? panel : bg;
    const cornerR = n.shape === "round" ? 12 : n.shape === "stadium" ? n.h / 2 : 0;
    const key = n.id;

    if (n.shape === "diamond") {
      const cx = n.x + n.w / 2;
      const cy = n.y + n.h / 2;
      const inset = 4;
      const dw = n.w - inset;
      const dh = n.h;
      const d = `M ${cx} ${cy - dh / 2} L ${cx + dw / 2} ${cy} L ${cx} ${cy + dh / 2} L ${cx - dw / 2} ${cy} Z`;
      return (
        <g key={key}>
          <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <NodeLabel
            n={n}
            ink={ink}
            muted={muted}
            fontScale={fontScale}
          />
        </g>
      );
    }

    if (n.shape === "cylinder") {
      const ry = 10;
      const x = n.x;
      const y = n.y;
      const w = n.w;
      const h = n.h;
      const d =
        `M ${x} ${y + ry}` +
        ` a ${w / 2} ${ry} 0 0 1 ${w} 0` +
        ` L ${x + w} ${y + h - ry}` +
        ` a ${w / 2} ${ry} 0 0 1 ${-w} 0` +
        ` Z`;
      const capD = `M ${x} ${y + ry} a ${w / 2} ${ry} 0 0 0 ${w} 0`;
      return (
        <g key={key}>
          <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <path d={capD} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
          <NodeLabel n={n} ink={ink} muted={muted} fontScale={fontScale} />
        </g>
      );
    }

    // rect / round / stadium share the rounded-rect path
    return (
      <g key={key}>
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={cornerR}
          ry={cornerR}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <NodeLabel n={n} ink={ink} muted={muted} fontScale={fontScale} />
      </g>
    );
  };

  // Arrowhead marker
  const arrowId = "pc-flow-arrow";
  const arrowAccentId = "pc-flow-arrow-accent";

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", background: bg }}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={ink} />
        </marker>
        <marker
          id={arrowAccentId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill={accent} />
        </marker>
      </defs>

      {/* edges */}
      {edgePaths.map((p) => {
        const color = p.accent ? accent : muted;
        const marker = p.accent ? arrowAccentId : arrowId;
        return (
          <g key={p.id}>
            <path
              d={p.d}
              fill="none"
              stroke={color}
              strokeWidth={p.accent ? 1.6 : 1.2}
              strokeDasharray={p.dashed ? "5 4" : undefined}
              markerEnd={`url(#${marker})`}
            />
            {p.label && p.labelX !== undefined && p.labelY !== undefined && (
              <g>
                <rect
                  x={p.labelX - labelBoxWidth(p.label, fontScale) / 2}
                  y={p.labelY - 10 * fontScale - 4}
                  width={labelBoxWidth(p.label, fontScale)}
                  height={10 * fontScale + 8}
                  fill={bg}
                />
                <text
                  x={p.labelX}
                  y={p.labelY}
                  fontSize={11 * fontScale}
                  fill={muted}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "inherit" }}
                >
                  {p.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* nodes */}
      {Array.from(placed.values()).map(renderNode)}

      {/* border frame */}
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

function labelBoxWidth(label: string, fontScale: number) {
  // approximate 6.2 px per char at 11 * fontScale
  return Math.max(20, label.length * 6.2 * fontScale + 14);
}

function NodeLabel({
  n,
  ink,
  muted,
  fontScale,
}: {
  n: Placed;
  ink: string;
  muted: string;
  fontScale: number;
}) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const lines = ellipsizedLines(n.label, Math.max(10, Math.floor(n.w / 10)));
  const hasCaption = !!n.caption;
  const baseOffset = hasCaption ? -4 : 0;

  return (
    <g>
      {lines.map((ln, i) => (
        <text
          key={i}
          x={cx}
          y={cy + baseOffset + (i - (lines.length - 1) / 2) * 14 * fontScale}
          fontSize={14 * fontScale}
          fontWeight={500}
          fill={ink}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontFamily: "inherit" }}
        >
          {ln}
        </text>
      ))}
      {hasCaption && (
        <text
          x={cx}
          y={cy + baseOffset + lines.length * 14 * fontScale - 2}
          fontSize={11 * fontScale}
          fill={muted}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontFamily: "inherit" }}
        >
          {n.caption}
        </text>
      )}
    </g>
  );
}

export default function FlowchartChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
} = {}) {
  const resolved = resolveTheme(theme);
  const { data: parsed, layout, style } = unwrap<FlowchartInput>(data);
  const fc = parsed ?? DEFAULT_DATA;
  const safe: FlowchartInput = {
    direction: fc.direction === "LR" ? "LR" : "TD",
    nodes: Array.isArray(fc.nodes) ? fc.nodes : [],
    edges: Array.isArray(fc.edges) ? fc.edges : [],
  };
  void str;
  return (
    <FlowchartCore
      theme={resolved}
      input={safe}
      layout={layout as FlowchartLayout}
      style={style}
    />
  );
}
