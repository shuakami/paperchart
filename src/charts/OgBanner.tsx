// OG / Twitter banner. Renders an exact 1200×630 SVG composition: brand mark
// on the left, an abstract collage of paperchart primitives on the right.
// Snap with Playwright at DPR 2 and write the PNG to public/og.png.
//
// Routes:
//   /?type=og            → 1200×630, paper theme
//   /?type=og&theme=dusk → dark variant
//
// The composition is deliberately built from real chart parts (bars, ribbons,
// flow nodes, calendar grid) so the banner reads as the actual product, not
// a generic illustration.

import { resolveTheme, type Theme } from "../theme";

export default function OgBanner({
  theme,
}: {
  data?: unknown;
  theme?: Theme | string;
}) {
  const t = resolveTheme(theme);
  const W = 1200;
  const H = 630;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: t.bg }}
    >
      <defs>
        <linearGradient id="og-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={t.bg} stopOpacity="1" />
          <stop offset="0.42" stopColor={t.bg} stopOpacity="1" />
          <stop offset="0.5" stopColor={t.bg} stopOpacity="0" />
        </linearGradient>
        <pattern
          id="og-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke={t.rule}
            strokeWidth="0.6"
            opacity="0.55"
          />
        </pattern>
      </defs>

      {/* page background */}
      <rect x="0" y="0" width={W} height={H} fill={t.bg} />
      <rect x="0" y="0" width={W} height={H} fill="url(#og-grid)" />

      {/* right collage — drawn first, fade overlay handles the left side */}
      <RightCollage t={t} />

      {/* fade so chart composition recedes behind the wordmark column */}
      <rect x="0" y="0" width={W} height={H} fill="url(#og-fade)" />

      {/* left column — brand */}
      <g transform="translate(80, 90)">
        {/* logo mark — small accent square + wordmark */}
        <g transform="translate(0, 0)">
          <rect
            x="0"
            y="6"
            width="22"
            height="22"
            rx="3"
            fill={t.accent}
            opacity="0.9"
          />
          <rect
            x="28"
            y="6"
            width="22"
            height="22"
            rx="3"
            fill="none"
            stroke={t.ink}
            strokeWidth="2"
            opacity="0.85"
          />
          <text
            x="62"
            y="26"
            fontFamily="Inter, system-ui, sans-serif"
            fontSize="22"
            fontWeight={500}
            letterSpacing="-0.01em"
            fill={t.ink}
          >
            paperchart
          </text>
        </g>

        {/* hero headline */}
        <text
          x="0"
          y="150"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="72"
          fontWeight={500}
          letterSpacing="-0.028em"
          fill={t.ink}
        >
          Clean charts
        </text>
        <text
          x="0"
          y="226"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="72"
          fontWeight={500}
          letterSpacing="-0.028em"
          fill={t.ink}
        >
          for technical
        </text>
        <text
          x="0"
          y="302"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="72"
          fontWeight={500}
          letterSpacing="-0.028em"
          fill={t.ink}
        >
          writing.
        </text>

        {/* sub copy */}
        <text
          x="0"
          y="370"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="22"
          fontWeight={400}
          letterSpacing="-0.005em"
          fill={t.muted}
        >
          32 primitives. 6 themes. One CLI.
        </text>
        <text
          x="0"
          y="400"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="22"
          fontWeight={400}
          letterSpacing="-0.005em"
          fill={t.muted}
        >
          Feed JSON. Get a PNG you can ship.
        </text>

        {/* command pill */}
        <g transform="translate(0, 442)">
          <rect
            x="0"
            y="0"
            width="540"
            height="44"
            rx="8"
            fill={t.panel ?? t.bg}
            stroke={t.rule}
            strokeWidth="1"
          />
          <text
            x="20"
            y="29"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
            fontSize="16"
            fill={t.ink}
          >
            <tspan fill={t.muted}>$</tspan>
            <tspan dx="8">npx github:shuakami/paperchart </tspan>
            <tspan fill={t.accent}>flowchart</tspan>
            <tspan> -i d.json -o</tspan>
          </text>
        </g>
      </g>

    </svg>
  );
}

function RightCollage({ t }: { t: Theme }) {
  // Right-side chart composition. Designed for 1200×630 — content roughly
  // covers x:560..1170 with the fade gradient on top blending the left third
  // back into the brand column.
  const accent = t.accent;
  const muted = t.muted;
  const ink = t.ink;
  const rule = t.rule;
  const secondary = t.secondary;
  const panel = t.panel ?? t.bg;

  return (
    <g>
      {/* card 1 — bar / latency-like chart, top right */}
      <g transform="translate(740, 70)">
        <rect
          x="0"
          y="0"
          width="380"
          height="180"
          rx="10"
          fill={panel}
          stroke={rule}
        />
        {/* row header */}
        <text
          x="20"
          y="34"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="13"
          fontWeight={500}
          fill={ink}
        >
          latency · ms
        </text>
        <text
          x="20"
          y="52"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fill={muted}
        >
          baseline vs. shipped
        </text>
        {/* bars */}
        {[
          { y: 82, w: 240, label: "p50", c: muted },
          { y: 110, w: 286, label: "p95", c: muted },
          { y: 138, w: 322, label: "p99", c: muted },
        ].map((b, i) => (
          <g key={`b1-${i}`}>
            <rect x={20} y={b.y} width={b.w} height={14} fill={secondary} />
            <text
              x={20 + b.w + 8}
              y={b.y + 11}
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="11"
              fill={muted}
            >
              {b.label}
            </text>
          </g>
        ))}
        {/* shipped overlay */}
        {[
          { y: 82, w: 96 },
          { y: 110, w: 124 },
          { y: 138, w: 168 },
        ].map((b, i) => (
          <rect
            key={`b2-${i}`}
            x={20}
            y={b.y}
            width={b.w}
            height={14}
            fill={accent}
          />
        ))}
      </g>

      {/* card 2 — sankey ribbons, middle right */}
      <g transform="translate(630, 280)">
        <rect
          x="0"
          y="0"
          width="380"
          height="180"
          rx="10"
          fill={panel}
          stroke={rule}
        />
        <text
          x="20"
          y="34"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="13"
          fontWeight={500}
          fill={ink}
        >
          flow
        </text>
        <text
          x="20"
          y="52"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fill={muted}
        >
          sources → targets
        </text>
        {/* source nodes */}
        <rect x={28} y={70} width={10} height={42} fill={secondary} />
        <rect x={28} y={120} width={10} height={26} fill={muted} />
        {/* target nodes */}
        <rect x={342} y={68} width={10} height={32} fill={accent} />
        <rect x={342} y={108} width={10} height={20} fill={muted} />
        <rect x={342} y={134} width={10} height={18} fill={secondary} />
        {/* ribbons */}
        <path
          d="M38,72 C170,72 200,70 342,70 L342,98 C200,98 170,110 38,110 Z"
          fill={accent}
          opacity="0.4"
        />
        <path
          d="M38,114 C170,114 200,108 342,108 L342,126 C200,126 170,140 38,140 Z"
          fill={muted}
          opacity="0.35"
        />
        <path
          d="M38,140 C170,140 200,134 342,134 L342,150 C200,150 170,144 38,144 Z"
          fill={secondary}
          opacity="0.6"
        />
      </g>

      {/* card 3 — flowchart silhouette, bottom right */}
      <g transform="translate(820, 470)">
        <rect
          x="0"
          y="0"
          width="300"
          height="120"
          rx="10"
          fill={panel}
          stroke={rule}
        />
        {/* nodes */}
        {/* stadium */}
        <rect
          x={20}
          y={26}
          width={68}
          height={28}
          rx={14}
          fill="none"
          stroke={ink}
          strokeWidth="1.4"
        />
        <text
          x={54}
          y={45}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="10"
          fill={ink}
        >
          start
        </text>
        {/* diamond */}
        <path
          d={`M ${136} ${24} L ${172} ${40} L ${136} ${56} L ${100} ${40} Z`}
          fill="none"
          stroke={ink}
          strokeWidth="1.4"
        />
        <text
          x={136}
          y={44}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="10"
          fill={ink}
        >
          ok?
        </text>
        {/* rect accent */}
        <rect
          x={188}
          y={26}
          width={68}
          height={28}
          rx={3}
          fill={panel}
          stroke={accent}
          strokeWidth="1.6"
        />
        <text
          x={222}
          y={45}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="10"
          fill={ink}
        >
          process
        </text>
        {/* edges with arrows */}
        <line
          x1={88}
          y1={40}
          x2={100}
          y2={40}
          stroke={ink}
          strokeWidth="1.4"
        />
        <line
          x1={172}
          y1={40}
          x2={188}
          y2={40}
          stroke={ink}
          strokeWidth="1.4"
        />
        <polygon points="100,40 96,37 96,43" fill={ink} />
        <polygon points="188,40 184,37 184,43" fill={ink} />
        {/* lower branch */}
        <rect
          x={100}
          y={78}
          width={72}
          height={24}
          rx={3}
          fill="none"
          stroke={muted}
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text
          x={136}
          y={94}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="10"
          fill={muted}
        >
          retry
        </text>
        <path
          d="M 136 56 L 136 78"
          stroke={muted}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          fill="none"
        />
      </g>

      {/* small calendar heatmap dots strip, top edge — sits cleanly above
          the latency card with no overlap */}
      <g transform="translate(820, 12)">
        {Array.from({ length: 14 }).map((_, col) =>
          Array.from({ length: 4 }).map((__, row) => {
            const idx = col * 4 + row;
            const seed = (idx * 73 + 11) % 13;
            const op =
              seed < 4 ? 0.06 : seed < 7 ? 0.25 : seed < 10 ? 0.55 : 0.92;
            const fill = seed < 4 ? rule : seed < 10 ? secondary : accent;
            return (
              <rect
                key={`cal-${col}-${row}`}
                x={col * 11}
                y={row * 11}
                width={9}
                height={9}
                rx={1.5}
                fill={fill}
                opacity={op}
              />
            );
          })
        )}
      </g>

    </g>
  );
}
