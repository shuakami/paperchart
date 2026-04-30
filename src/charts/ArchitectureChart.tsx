// System architecture diagram — grouped service boxes with explicit
// inter-service connections. Groups are the top-level structural unit
// (client, edge, backend, data, observability, …); each group contains
// service nodes arranged in a single column. Connections cross group
// boundaries and carry an optional label describing the protocol.
//
// data shape:
//   {
//     groups: [
//       { id, label, caption?, services: [{ id, label, caption?, accent? }, ...] },
//       ...
//     ],
//     connections: [
//       { from, to, label?, dashed?, accent?, bidirectional? },
//       ...
//     ]
//   }
// `from` / `to` reference service ids.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import {
  unwrap,
  num,
  type BaseLayout,
  type StyleOverrides,
} from "../layout";

type Service = { id: string; label: string; caption?: string; accent?: boolean };
type Group = { id: string; label: string; caption?: string; services: Service[] };
type Conn = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  accent?: boolean;
  bidirectional?: boolean;
};
type ArchInput = { groups: Group[]; connections: Conn[] };

type ArchLayout = BaseLayout & {
  serviceHeight?: number;
  groupGap?: number;
  serviceGap?: number;
};

const DEFAULT_DATA: ArchInput = {
  groups: [
    {
      id: "client",
      label: "client",
      caption: "browser + native",
      services: [
        { id: "web",    label: "web app",        caption: "React SPA" },
        { id: "mobile", label: "mobile",         caption: "iOS + Android" },
      ],
    },
    {
      id: "edge",
      label: "edge",
      caption: "global, stateless",
      services: [
        { id: "cdn",     label: "CDN",             caption: "static assets" },
        { id: "gateway", label: "API gateway",     caption: "auth + rate limit", accent: true },
      ],
    },
    {
      id: "backend",
      label: "backend",
      caption: "regional, stateful",
      services: [
        { id: "search", label: "search service", caption: "brotli pack + runtime" },
        { id: "docs",   label: "docs service",   caption: "page renderer" },
        { id: "users",  label: "users service",  caption: "auth + profiles" },
      ],
    },
    {
      id: "data",
      label: "data",
      caption: "persistent",
      services: [
        { id: "pg",    label: "postgres",        caption: "primary + replicas" },
        { id: "s3",    label: "object storage",  caption: "pack.bin.br" },
        { id: "redis", label: "redis",           caption: "cache + sessions" },
      ],
    },
  ],
  connections: [
    { from: "web",     to: "cdn" },
    { from: "mobile",  to: "gateway" },
    { from: "web",     to: "gateway", accent: true },
    { from: "gateway", to: "search" },
    { from: "gateway", to: "docs" },
    { from: "gateway", to: "users" },
    { from: "search",  to: "s3",    label: "brotli", accent: true },
    { from: "search",  to: "redis", label: "LRU" },
    { from: "docs",    to: "pg",    bidirectional: true },
    { from: "users",   to: "pg" },
    { from: "users",   to: "redis", dashed: true },
  ],
};

function ArchCore({
  theme,
  input,
  layout,
  style,
}: {
  theme: Theme;
  input: ArchInput;
  layout: ArchLayout;
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
  const padTop = num(layout.padding?.top, 44);
  const padRight = num(layout.padding?.right, 40);
  const padBottom = num(layout.padding?.bottom, 48);
  const padLeft = num(layout.padding?.left, 40);

  const serviceHeight = num(layout.serviceHeight, 74);
  const serviceGap = num(layout.serviceGap, 14);
  const groupGap = num(layout.groupGap, 36);
  const groupHeaderH = 50;

  const groupCount = input.groups.length || 1;
  const plotW = W - padLeft - padRight;
  const totalGaps = Math.max(0, groupCount - 1) * groupGap;
  const groupW = Math.max(180, (plotW - totalGaps) / groupCount);

  const serviceX = new Map<string, { cx: number; cy: number; x: number; y: number; w: number; h: number }>();
  const groupX = new Map<string, number>();

  // Compute positions
  const serviceW = groupW - 32;
  const maxServices = input.groups.reduce((m, g) => Math.max(m, g.services.length), 0);
  const groupInnerH = maxServices * serviceHeight + Math.max(0, maxServices - 1) * serviceGap;
  const groupH = groupHeaderH + 16 + groupInnerH + 20;
  const groupTop = padTop + Math.max(0, (H - padTop - padBottom - groupH) / 2);

  input.groups.forEach((g, gi) => {
    const gx = padLeft + gi * (groupW + groupGap);
    groupX.set(g.id, gx);

    const firstServiceY = groupTop + groupHeaderH + 16;
    g.services.forEach((s, si) => {
      const sx = gx + (groupW - serviceW) / 2;
      const sy = firstServiceY + si * (serviceHeight + serviceGap);
      serviceX.set(s.id, {
        x: sx,
        y: sy,
        w: serviceW,
        h: serviceHeight,
        cx: sx + serviceW / 2,
        cy: sy + serviceHeight / 2,
      });
    });
  });

  const arrowId = "pc-arch-arrow";
  const arrowAccentId = "pc-arch-arrow-accent";

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

      {/* group frames + headers */}
      {input.groups.map((g) => {
        const gx = groupX.get(g.id)!;
        return (
          <g key={`g-${g.id}`}>
            <rect
              x={gx}
              y={groupTop}
              width={groupW}
              height={groupH}
              fill={panel}
              stroke={rule}
            />
            <text
              x={gx + 16}
              y={groupTop + 22}
              fontSize={14 * fontScale}
              fontWeight={500}
              fill={ink}
              style={{ fontFamily: "inherit" }}
            >
              {g.label}
            </text>
            {g.caption && (
              <text
                x={gx + 16}
                y={groupTop + 40}
                fontSize={11 * fontScale}
                fill={muted}
                style={{ fontFamily: "inherit" }}
              >
                {g.caption}
              </text>
            )}
            <line
              x1={gx}
              x2={gx + groupW}
              y1={groupTop + groupHeaderH}
              y2={groupTop + groupHeaderH}
              stroke={rule}
            />
          </g>
        );
      })}

      {/* connections — drawn BEFORE services so arrows terminate at box edges */}
      {input.connections.map((c, i) => {
        const a = serviceX.get(c.from);
        const b = serviceX.get(c.to);
        if (!a || !b) return null;
        const color = c.accent ? accent : muted;
        const marker = c.accent ? arrowAccentId : arrowId;
        const startMarker = c.bidirectional ? `url(#${marker})` : undefined;
        const goingRight = b.cx > a.cx;
        const x1 = goingRight ? a.x + a.w : a.x;
        const x2 = goingRight ? b.x : b.x + b.w;
        const y1 = a.cy;
        const y2 = b.cy;
        const midX = (x1 + x2) / 2;
        const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        // Stagger label position along the edge by index so parallel fan-out
        // edges (e.g. gateway → search/docs/users) don't stack vertically at
        // the same midpoint.
        const lt = 0.35 + (i % 5) * 0.08;
        const labelX = x1 + (x2 - x1) * lt;
        const labelY = y1 + (y2 - y1) * lt - 8;
        return (
          <g key={`c-${i}`}>
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={c.accent ? 1.6 : 1.2}
              strokeDasharray={c.dashed ? "5 4" : undefined}
              markerEnd={`url(#${marker})`}
              markerStart={startMarker}
            />
            {c.label && (
              <g>
                <rect
                  x={labelX - c.label.length * 3.2 * fontScale - 6}
                  y={labelY - 9 * fontScale}
                  width={c.label.length * 6.4 * fontScale + 12}
                  height={18 * fontScale}
                  fill={bg}
                />
                <text
                  x={labelX}
                  y={labelY + 3}
                  fontSize={11 * fontScale}
                  fill={muted}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "inherit" }}
                >
                  {c.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* services */}
      {input.groups.map((g) =>
        g.services.map((s) => {
          const p = serviceX.get(s.id);
          if (!p) return null;
          const stroke = s.accent ? accent : ink;
          const sw = s.accent ? 1.6 : 1;
          return (
            <g key={`s-${s.id}`}>
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={6}
                ry={6}
                fill={bg}
                stroke={stroke}
                strokeWidth={sw}
              />
              <text
                x={p.cx}
                y={p.cy - (s.caption ? 8 : 0)}
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
                  x={p.cx}
                  y={p.cy + 12}
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
        })
      )}

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

export default function ArchitectureChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
} = {}) {
  const resolved = resolveTheme(theme);
  const { data: parsed, layout, style } = unwrap<ArchInput>(data);
  const d = parsed ?? DEFAULT_DATA;
  const safe: ArchInput = {
    groups: Array.isArray(d.groups) ? d.groups : [],
    connections: Array.isArray(d.connections) ? d.connections : [],
  };
  return (
    <ArchCore
      theme={resolved}
      input={safe}
      layout={layout as ArchLayout}
      style={style}
    />
  );
}
