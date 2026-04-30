// Entity-relationship diagram (Mermaid `erDiagram`). Each entity is a table
// with a header row (name), an optional caption, and a body listing typed
// fields with PK / FK markers. Relationships draw a line between two entities
// with crow's-foot cardinality markers at each end.
//
// Cardinality codes (Mermaid-style):
//   "1"    — exactly one (single tick)
//   "0..1" — zero or one (circle + tick)
//   "M" / "N" / "*" — many (crow's foot)
//   "1..M" — one or many (tick + crow's foot)
//
// data shape:
//   {
//     entities: [
//       { id, label, caption?, accent?, fields: [
//         { name, type?, pk?, fk?, note? }, ...
//       ] },
//       ...
//     ],
//     relationships: [
//       { from, to, fromCard, toCard, label?, accent? },
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

type Field = { name: string; type?: string; pk?: boolean; fk?: boolean; note?: string };
type Entity = {
  id: string;
  label: string;
  caption?: string;
  accent?: boolean;
  fields: Field[];
};
type Cardinality = "1" | "0..1" | "M" | "1..M" | "0..M";
type Relationship = {
  from: string;
  to: string;
  fromCard: Cardinality;
  toCard: Cardinality;
  label?: string;
  accent?: boolean;
};
type ErInput = { entities: Entity[]; relationships: Relationship[] };

type ErLayout = BaseLayout & {
  entityWidth?: number;
  rowHeight?: number;
  headerHeight?: number;
  columns?: number;
};

const DEFAULT_DATA: ErInput = {
  entities: [
    {
      id: "user",
      label: "user",
      caption: "account",
      fields: [
        { name: "id",         type: "uuid",      pk: true },
        { name: "email",      type: "text",                note: "unique" },
        { name: "created_at", type: "timestamp" },
      ],
    },
    {
      id: "org",
      label: "organization",
      caption: "billing unit",
      fields: [
        { name: "id",    type: "uuid", pk: true },
        { name: "name",  type: "text" },
        { name: "tier",  type: "enum" },
      ],
    },
    {
      id: "membership",
      label: "membership",
      caption: "user ↔ org join",
      accent: true,
      fields: [
        { name: "user_id", type: "uuid", pk: true, fk: true },
        { name: "org_id",  type: "uuid", pk: true, fk: true },
        { name: "role",    type: "enum" },
      ],
    },
    {
      id: "project",
      label: "project",
      caption: "owned by org",
      fields: [
        { name: "id",     type: "uuid", pk: true },
        { name: "org_id", type: "uuid", fk: true },
        { name: "name",   type: "text" },
      ],
    },
    {
      id: "doc",
      label: "document",
      caption: "indexed by search",
      fields: [
        { name: "id",         type: "uuid",      pk: true },
        { name: "project_id", type: "uuid",      fk: true },
        { name: "body_md",    type: "text" },
        { name: "updated_at", type: "timestamp" },
      ],
    },
  ],
  relationships: [
    { from: "user", to: "membership", fromCard: "1",    toCard: "0..M", label: "joins" },
    { from: "org",  to: "membership", fromCard: "1",    toCard: "0..M", label: "contains" },
    { from: "org",  to: "project",    fromCard: "1",    toCard: "0..M", label: "owns",  accent: true },
    { from: "project", to: "doc",     fromCard: "1",    toCard: "0..M", label: "has" },
  ],
};

function ErCore({
  theme,
  input,
  layout,
  style,
}: {
  theme: Theme;
  input: ErInput;
  layout: ErLayout;
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
  const entityW = num(layout.entityWidth, 280);
  const rowH = num(layout.rowHeight, 28);
  const headerH = num(layout.headerHeight, 56);
  const columns = Math.max(1, num(layout.columns, 3));

  const padTop = num(layout.padding?.top, 40);
  const padRight = num(layout.padding?.right, 40);
  const padBottom = num(layout.padding?.bottom, 40);
  const padLeft = num(layout.padding?.left, 40);

  type Placed = Entity & { x: number; y: number; w: number; h: number };
  const placed = new Map<string, Placed>();

  const rows = Math.ceil(input.entities.length / columns);
  const colGap = (W - padLeft - padRight - columns * entityW) / Math.max(1, columns - 1);

  // Determine row heights (each entity height depends on # fields)
  const rowHeights: number[] = [];
  for (let r = 0; r < rows; r++) {
    let maxH = 0;
    for (let c = 0; c < columns; c++) {
      const i = r * columns + c;
      if (i >= input.entities.length) continue;
      const e = input.entities[i]!;
      const h = headerH + 8 + e.fields.length * rowH + 12;
      maxH = Math.max(maxH, h);
    }
    rowHeights.push(maxH);
  }
  const totalHeight = rowHeights.reduce((a, b) => a + b, 0) + Math.max(0, rows - 1) * 40;
  const startY = padTop + Math.max(0, (H - padTop - padBottom - totalHeight) / 2);

  let cursorY = startY;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const i = r * columns + c;
      if (i >= input.entities.length) continue;
      const e = input.entities[i]!;
      const x = padLeft + c * (entityW + colGap);
      const h = headerH + 8 + e.fields.length * rowH + 12;
      placed.set(e.id, { ...e, x, y: cursorY, w: entityW, h });
    }
    cursorY += (rowHeights[r] ?? 0) + 40;
  }

  const arrowId = "pc-er-arrow";

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
      </defs>

      {/* relationships first */}
      {input.relationships.map((rel, i) => {
        const a = placed.get(rel.from);
        const b = placed.get(rel.to);
        if (!a || !b) return null;
        const ax = a.x + a.w / 2;
        const ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2;
        const by = b.y + b.h / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const preferH = Math.abs(dx) > Math.abs(dy) * 1.2;
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
        const color = rel.accent ? accent : muted;
        const strokeW = rel.accent ? 1.6 : 1.2;
        const midX = preferH ? (sx + ex) / 2 : sx;
        const d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;
        return (
          <g key={`r-${i}`}>
            <path d={d} fill="none" stroke={color} strokeWidth={strokeW} />
            <Cardinality card={rel.fromCard} x={sx} y={sy} angleFrom="start" color={color} preferH={preferH} goingRight={dx > 0} goingDown={dy > 0} />
            <Cardinality card={rel.toCard}   x={ex} y={ey} angleFrom="end"   color={color} preferH={preferH} goingRight={dx > 0} goingDown={dy > 0} />
            {rel.label && (
              <g>
                <rect
                  x={(sx + ex) / 2 - rel.label.length * 3.4 * fontScale - 6}
                  y={(sy + ey) / 2 - 10 * fontScale}
                  width={rel.label.length * 6.8 * fontScale + 12}
                  height={18 * fontScale}
                  fill={bg}
                />
                <text
                  x={(sx + ex) / 2}
                  y={(sy + ey) / 2 + 2}
                  fontSize={11 * fontScale}
                  fill={muted}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "inherit" }}
                >
                  {rel.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* entities */}
      {Array.from(placed.values()).map((e) => {
        const stroke = e.accent ? accent : ink;
        const sw = e.accent ? 1.6 : 1;
        return (
          <g key={e.id}>
            {/* frame */}
            <rect
              x={e.x}
              y={e.y}
              width={e.w}
              height={e.h}
              fill={bg}
              stroke={stroke}
              strokeWidth={sw}
            />
            {/* header */}
            <rect
              x={e.x}
              y={e.y}
              width={e.w}
              height={headerH}
              fill={e.accent ? panel : panel}
              stroke="none"
            />
            <line
              x1={e.x}
              x2={e.x + e.w}
              y1={e.y + headerH}
              y2={e.y + headerH}
              stroke={rule}
            />
            <text
              x={e.x + 16}
              y={e.y + 24}
              fontSize={15 * fontScale}
              fontWeight={500}
              fill={ink}
              style={{ fontFamily: "inherit" }}
            >
              {e.label}
            </text>
            {e.caption && (
              <text
                x={e.x + 16}
                y={e.y + 42}
                fontSize={11 * fontScale}
                fill={muted}
                style={{ fontFamily: "inherit" }}
              >
                {e.caption}
              </text>
            )}
            {/* fields */}
            {e.fields.map((f, i) => {
              const fy = e.y + headerH + 8 + i * rowH;
              return (
                <g key={`f-${e.id}-${i}`}>
                  {i > 0 && (
                    <line
                      x1={e.x + 12}
                      x2={e.x + e.w - 12}
                      y1={fy - 2}
                      y2={fy - 2}
                      stroke={rule}
                      opacity={0.6}
                    />
                  )}
                  {/* pk / fk markers */}
                  <text
                    x={e.x + 16}
                    y={fy + rowH / 2}
                    fontSize={10 * fontScale}
                    fontWeight={500}
                    fill={f.pk ? ink : muted}
                    dominantBaseline="middle"
                    style={{ fontFamily: "inherit", letterSpacing: "0.08em" }}
                  >
                    {f.pk ? "PK" : f.fk ? "FK" : ""}
                  </text>
                  <text
                    x={e.x + 50}
                    y={fy + rowH / 2}
                    fontSize={13 * fontScale}
                    fontWeight={f.pk ? 500 : 400}
                    fill={ink}
                    dominantBaseline="middle"
                    style={{ fontFamily: "inherit" }}
                  >
                    {f.name}
                  </text>
                  <text
                    x={e.x + e.w - 16}
                    y={fy + rowH / 2}
                    fontSize={12 * fontScale}
                    fill={muted}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={{ fontFamily: "inherit" }}
                  >
                    {f.type ?? ""}
                  </text>
                </g>
              );
            })}
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

// Crow's-foot cardinality marker. Draws small ticks/circles/forks at an end
// of a relationship line, oriented based on which side of the entity the
// line exits.
function Cardinality({
  card,
  x,
  y,
  angleFrom,
  color,
  preferH,
  goingRight,
  goingDown,
}: {
  card: Cardinality;
  x: number;
  y: number;
  angleFrom: "start" | "end";
  color: string;
  preferH: boolean;
  goingRight: boolean;
  goingDown: boolean;
}) {
  // Determine outward direction for this end.
  // For horizontal routing: start points away from entity (direction of line)
  // For vertical routing: same idea
  let dirX = 0;
  let dirY = 0;
  if (preferH) {
    dirX = angleFrom === "start" ? (goingRight ? 1 : -1) : goingRight ? -1 : 1;
  } else {
    dirY = angleFrom === "start" ? (goingDown ? 1 : -1) : goingDown ? -1 : 1;
  }

  // We draw markers 8–18 px along the outward direction.
  const px = (u: number) => x + dirX * u + (preferH ? 0 : dirY * 0);
  const py = (u: number) => y + dirY * u;
  // Perpendicular offsets for crow's-foot.
  const perpX = preferH ? 0 : 1;
  const perpY = preferH ? 1 : 0;

  const elts: React.ReactElement[] = [];
  const hasMany = card === "M" || card === "1..M" || card === "0..M";
  const hasZero = card === "0..1" || card === "0..M";
  const hasOne  = card === "1" || card === "1..M" || card === "0..1";

  if (hasMany) {
    // Fork: three lines converging at (8) from a perpendicular span at (22)
    const ux = px(22);
    const uy = py(22);
    const sp = 7;
    elts.push(
      <line key="f1" x1={px(8)} y1={py(8)} x2={ux + perpX * sp} y2={uy + perpY * sp} stroke={color} strokeWidth={1.2} />
    );
    elts.push(
      <line key="f2" x1={px(8)} y1={py(8)} x2={ux} y2={uy} stroke={color} strokeWidth={1.2} />
    );
    elts.push(
      <line key="f3" x1={px(8)} y1={py(8)} x2={ux - perpX * sp} y2={uy - perpY * sp} stroke={color} strokeWidth={1.2} />
    );
  }

  if (hasOne && !hasMany) {
    // single tick perpendicular at 12
    const tx = px(12);
    const ty = py(12);
    elts.push(
      <line key="t1" x1={tx - perpX * 6} y1={ty - perpY * 6} x2={tx + perpX * 6} y2={ty + perpY * 6} stroke={color} strokeWidth={1.2} />
    );
  }
  if (hasOne && hasMany) {
    // tick at 8, fork starts at 16
    const tx = px(4);
    const ty = py(4);
    elts.push(
      <line key="tt" x1={tx - perpX * 6} y1={ty - perpY * 6} x2={tx + perpX * 6} y2={ty + perpY * 6} stroke={color} strokeWidth={1.2} />
    );
  }

  if (hasZero) {
    // open circle at 14
    const cx = px(14);
    const cy = py(14);
    elts.push(<circle key="o" cx={cx} cy={cy} r={4} fill="none" stroke={color} strokeWidth={1.2} />);
  }

  return <g>{elts}</g>;
}

export default function ErDiagramChart({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
} = {}) {
  const resolved = resolveTheme(theme);
  const { data: parsed, layout, style } = unwrap<ErInput>(data);
  const d = parsed ?? DEFAULT_DATA;
  const safe: ErInput = {
    entities: Array.isArray(d.entities) ? d.entities : [],
    relationships: Array.isArray(d.relationships) ? d.relationships : [],
  };
  return (
    <ErCore
      theme={resolved}
      input={safe}
      layout={layout as ErLayout}
      style={style}
    />
  );
}
