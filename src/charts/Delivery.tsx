// Three-panel delivery architecture diagram.

import type { Theme } from "../theme";
import { resolveTheme } from "../theme";
import { unwrap, type StyleOverrides } from "../layout";

// Default (paper) color tokens. These are shadowed inside the component
// body with the active theme; kept at module scope so the Panel helper
// (which currently reads closed-over globals) still compiles.
let INK = "#2B2A27";
let RULE = "#E6DCCE";
let NEUTRAL = "#D6B99B";
let ACCENT = "#C75F3C";
let BG = "#F6F1EA";

const W = 1600;
const H = 820;

type Asset = { label: string; detail: string; kb: number; kind: "main" | "pack" };

function Panel({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  accent,
  assets,
  note,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  accent: boolean;
  assets: Asset[];
  note: string;
}) {
  const totalCritical = assets
    .filter((a) => !(accent && a.kind === "pack"))
    .reduce((s, a) => s + a.kb, 0);
  const deferred = accent
    ? assets.filter((a) => a.kind === "pack").reduce((s, a) => s + a.kb, 0)
    : 0;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={w} height={h} fill={BG} stroke={RULE} strokeWidth={1} />
      <text x={24} y={38} fill={INK} fontSize={20} fontWeight={600}>
        {title}
      </text>
      <text x={24} y={62} fill={INK} fontSize={13} opacity={0.62}>
        {subtitle}
      </text>
      <line x1={0} x2={w} y1={82} y2={82} stroke={RULE} strokeWidth={1} />

      <text x={24} y={114} fill={INK} fontSize={14} fontWeight={500} opacity={0.72}>
        what the browser fetches on /docs
      </text>

      {assets.map((a, i) => {
        const ry = 138 + i * 98;
        const isDeferredPack = a.kind === "pack" && accent;
        const isAccentMain = accent && a.kind === "main";
        const color = isDeferredPack ? "transparent" : isAccentMain ? ACCENT : NEUTRAL;
        const fg = isDeferredPack ? ACCENT : isAccentMain ? BG : INK;
        return (
          <g key={i}>
            <rect
              x={24}
              y={ry}
              width={w - 48}
              height={74}
              fill={color}
              stroke={isDeferredPack ? ACCENT : "none"}
              strokeDasharray={isDeferredPack ? "6 4" : undefined}
              strokeWidth={isDeferredPack ? 1.5 : 0}
            />
            <text x={40} y={ry + 30} fill={fg} fontSize={16} fontWeight={600}>
              {a.label}
            </text>
            <text
              x={40}
              y={ry + 52}
              fill={fg}
              fontSize={13}
              opacity={isDeferredPack || isAccentMain ? 0.9 : 0.72}
            >
              {a.detail}
            </text>
            <text
              x={w - 40}
              y={ry + 44}
              fill={fg}
              fontSize={18}
              fontWeight={600}
              textAnchor="end"
              className="tab-nums"
            >
              {a.kb} KB br
            </text>
          </g>
        );
      })}

      <g transform={`translate(24, ${h - 120})`}>
        <text x={0} y={0} fill={INK} fontSize={13} opacity={0.6}>
          first-load critical path
        </text>
        <text
          x={0}
          y={32}
          fill={accent ? ACCENT : INK}
          fontSize={30}
          fontWeight={600}
          className="tab-nums"
        >
          {totalCritical} KB br
        </text>

        <text x={w / 2 - 12} y={0} fill={INK} fontSize={13} opacity={0.6}>
          deferred
        </text>
        <text
          x={w / 2 - 12}
          y={32}
          fill={INK}
          fontSize={30}
          fontWeight={600}
          className="tab-nums"
          opacity={0.85}
        >
          {deferred === 0 ? "0 KB" : deferred + " KB br"}
        </text>
      </g>

      <text x={24} y={h - 20} fill={INK} fontSize={12} opacity={0.55}>
        {note}
      </text>
    </g>
  );
}

type PanelSpec = {
  title: string;
  subtitle: string;
  accent?: boolean;
  assets: Asset[];
  note: string;
};

type DeliveryData = {
  header?: string;
  subheader?: string;
  panels: PanelSpec[];
};

const DEFAULT_DELIVERY: DeliveryData = {
  header: "how search reaches the browser — three deliveries over time",
  subheader:
    "Same corpus, three different delivery shapes. Only the third one keeps the search index off the first-load critical path.",
  panels: [
    {
      title: "Fuse fuzzy matcher",
      subtitle: "JSON index + pages inlined inside the JS chunk",
      accent: false,
      assets: [
        { label: "docs JS chunk", detail: "pages JSON + Fuse index + UI", kb: 87, kind: "main" },
        { label: "Fuse runtime + UI glue", detail: "shipped in the same chunk", kb: 20, kind: "main" },
      ],
      note: "Index, scorer and UI all travel together in the first-paint payload.",
    },
    {
      title: "Custom inverted index, embedded",
      subtitle: "binary pack base64-encoded inside the same JS chunk",
      accent: false,
      assets: [
        { label: "docs JS chunk (with base64 pack)", detail: "232 KB base64 literal of the pack", kb: 232, kind: "main" },
        { label: "runtime decoder + UI glue", detail: "tokenizer, scorer, cmdk shell", kb: 20, kind: "main" },
      ],
      note: "Queries get fast, but the wire cost jumps because base64 defeats brotli.",
    },
    {
      title: "Externalized binary pack",
      subtitle: "pack served as a separate precompressed static asset",
      accent: true,
      assets: [
        { label: "docs JS chunk", detail: "runtime + UI glue only, no pack inside", kb: 20, kind: "main" },
        { label: "/search-pack.bin (deferred)", detail: "fetched on first Ctrl+K, then cached", kb: 78, kind: "pack" },
      ],
      note: "JS chunk stays under 25 KB brotli; the pack costs bytes only when the user searches.",
    },
  ],
};

export default function Delivery({
  data,
  theme,
}: {
  data?: unknown;
  theme?: Theme;
} = {}) {
  const { data: input, style } = unwrap<DeliveryData>(data);
  const s = style as StyleOverrides;
  const th = resolveTheme(theme);
  INK = s.ink ?? th.ink;
  RULE = s.rule ?? th.rule;
  NEUTRAL = s.secondary ?? th.secondary;
  ACCENT = s.accent ?? th.accent;
  BG = s.bg ?? th.bg;

  const spec = input ?? DEFAULT_DELIVERY;
  const panels = spec.panels.slice(0, 3);
  while (panels.length < 3) panels.push(DEFAULT_DELIVERY.panels[panels.length]);
  const OUTER = 40;
  const GAP = 28;
  const panelW = (W - OUTER * 2 - GAP * 2) / 3;
  const panelY = 96;
  const panelH = H - panelY - 40;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", background: BG }}>
      <text x={OUTER} y={40} fill={INK} fontSize={22} fontWeight={600}>
        {spec.header ?? DEFAULT_DELIVERY.header}
      </text>
      <text x={OUTER} y={64} fill={INK} fontSize={14} opacity={0.62}>
        {spec.subheader ?? DEFAULT_DELIVERY.subheader}
      </text>
      {panels.map((p, i) => (
        <Panel
          key={i}
          x={OUTER + (panelW + GAP) * i}
          y={panelY}
          w={panelW}
          h={panelH}
          title={p.title}
          subtitle={p.subtitle}
          accent={Boolean(p.accent)}
          assets={p.assets}
          note={p.note}
        />
      ))}
    </svg>
  );
}
