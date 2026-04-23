import { useEffect, useMemo, useState } from "react";
import { THEMES, resolveTheme } from "./theme";
import LatencyChart from "./charts/LatencyChart";
import BytesChart from "./charts/BytesChart";
import LineChart from "./charts/LineChart";
import HeatmapChart from "./charts/HeatmapChart";
import DumbbellChart from "./charts/DumbbellChart";

// Editorial single-page landing — one theme at a time, live switchable,
// large typography, no color-swatch wall, no fake sections. Inspired by
// Linear, Vercel, Stripe Press, Anthropic News, Framer.

const THEME_ORDER = ["paper", "ink", "slate", "forest", "mono", "dusk"] as const;
type ThemeName = (typeof THEME_ORDER)[number];

const PRIMITIVES_ALL: {
  slug: string;
  name: string;
  tag: string;
  category: "distribution" | "comparison" | "structure" | "flow";
}[] = [
  { slug: "latency", name: "latency", tag: "grouped horizontal bars, log scale", category: "comparison" },
  { slug: "bytes", name: "bytes", tag: "stacked bars for critical vs deferred", category: "comparison" },
  { slug: "pack-layout", name: "pack-layout", tag: "byte-level binary anatomy", category: "structure" },
  { slug: "delivery", name: "delivery", tag: "three-panel architecture side-by-side", category: "structure" },
  { slug: "recall", name: "recall", tag: "per-row dot plot for set equality", category: "distribution" },
  { slug: "critical-path", name: "critical-path", tag: "network timeline with milestones", category: "flow" },
  { slug: "line", name: "line", tag: "multi-series line over time", category: "flow" },
  { slug: "area", name: "area", tag: "stacked area composition over time", category: "flow" },
  { slug: "scatter", name: "scatter", tag: "correlation with regression line", category: "distribution" },
  { slug: "heatmap", name: "heatmap", tag: "matrix of values, two-color scale", category: "distribution" },
  { slug: "histogram", name: "histogram", tag: "binned frequency distribution", category: "distribution" },
  { slug: "cdf", name: "cdf", tag: "empirical cumulative distribution", category: "distribution" },
  { slug: "dumbbell", name: "dumbbell", tag: "paired before / after per row", category: "comparison" },
  { slug: "ranking", name: "ranking", tag: "sorted horizontal bars, one accented", category: "comparison" },
  { slug: "waterfall", name: "waterfall", tag: "additive / subtractive steps", category: "flow" },
];

const INSTALL_CMD = "npx github:shuakami/paperchart latency -i data.json -o latency.png";
const SKILL_CMD = "npx skills add shuakami/paperchart";
const THEME_FLAG_EXAMPLE =
  'npx github:shuakami/paperchart dumbbell -i data.json -o out.png --theme ink';

// Simplified JSON — one canonical example
const JSON_EXAMPLE = `{
  "theme": "paper",
  "layout": {
    "width": 1600,
    "fontScale": 1,
    "xAxisCaption": "per-query latency (ms, log scale)",
    "hideCorner": false
  },
  "data": [
    {
      "group": "Fuse fuzzy matcher",
      "caption": "JS-side scorer over inlined JSON",
      "bars": [
        { "level": "p50", "ms": 8.12 },
        { "level": "p95", "ms": 17.30 },
        { "level": "p99", "ms": 25.41 }
      ]
    },
    {
      "group": "new engine",
      "color": "accent",
      "bars": [
        { "level": "p50", "ms": 0.064 },
        { "level": "p95", "ms": 0.302 },
        { "level": "p99", "ms": 0.470 }
      ]
    }
  ]
}`;

export default function Landing() {
  const [themeName, setThemeName] = useState<ThemeName>("paper");
  const theme = useMemo(() => resolveTheme(themeName), [themeName]);
  const INK = theme.ink;
  const BG = theme.bg;
  const MUTED = theme.muted;
  const ACCENT = theme.accent;
  const RULE = theme.rule;
  const PANEL = theme.panel ?? theme.bg;

  // Update body bg so the viewport paints consistently on mobile / when rubber-banding
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.background = BG;
    document.body.style.color = INK;
    document.body.style.transition = "background 220ms ease, color 220ms ease";
  }, [BG, INK]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: BG, color: INK, transition: "background 220ms ease, color 220ms ease" }}
    >
      {/* Sticky top bar with theme switcher */}
      <TopBar
        themeName={themeName}
        setThemeName={setThemeName}
        INK={INK}
        BG={BG}
        MUTED={MUTED}
        ACCENT={ACCENT}
        RULE={RULE}
      />

      {/* Editorial column — generous whitespace, large type */}
      <main className="mx-auto w-full max-w-[1080px] px-5 pb-24 sm:px-8">
        <Hero INK={INK} MUTED={MUTED} ACCENT={ACCENT} RULE={RULE} BG={BG} themeName={themeName} />

        <HeroChart theme={theme} />

        <Divider RULE={RULE} />

        <Install INK={INK} MUTED={MUTED} ACCENT={ACCENT} RULE={RULE} PANEL={PANEL} BG={BG} />

        <Divider RULE={RULE} />

        <PrimitivesSection
          INK={INK}
          MUTED={MUTED}
          RULE={RULE}
          BG={BG}
          PANEL={PANEL}
          theme={theme}
          themeName={themeName}
        />

        <Divider RULE={RULE} />

        <Customize INK={INK} MUTED={MUTED} RULE={RULE} PANEL={PANEL} BG={BG} />

        <Divider RULE={RULE} />

        <ThemeShowcase theme={theme} INK={INK} MUTED={MUTED} RULE={RULE} BG={BG} PANEL={PANEL} />

        <Divider RULE={RULE} />

        <Footer INK={INK} MUTED={MUTED} RULE={RULE} />
      </main>
    </div>
  );
}

function TopBar({
  themeName,
  setThemeName,
  INK,
  BG,
  MUTED,
  ACCENT,
  RULE,
}: {
  themeName: ThemeName;
  setThemeName: (n: ThemeName) => void;
  INK: string;
  BG: string;
  MUTED: string;
  ACCENT: string;
  RULE: string;
}) {
  return (
    <div
      className="sticky top-0 z-20 w-full"
      style={{
        background: BG + "ee",
        backdropFilter: "saturate(180%) blur(10px)",
        WebkitBackdropFilter: "saturate(180%) blur(10px)",
        borderBottom: `1px solid ${RULE}`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-5 py-3 sm:px-8">
        <a
          href="#/"
          className="flex items-center gap-2 text-[15px] font-semibold no-underline"
          style={{ color: INK, letterSpacing: "-0.01em" }}
        >
          <Mark color={ACCENT} />
          paperchart
        </a>
        <div className="flex items-center gap-1 overflow-x-auto">
          {THEME_ORDER.map((n) => {
            const t = resolveTheme(n);
            const active = themeName === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setThemeName(n)}
                className="flex items-center gap-2 whitespace-nowrap px-2.5 py-1.5 text-[12.5px]"
                style={{
                  background: active ? INK : "transparent",
                  color: active ? BG : MUTED,
                  border: `1px solid ${active ? INK : RULE}`,
                  cursor: "pointer",
                  fontFamily: "Inter, -apple-system, sans-serif",
                  letterSpacing: "-0.005em",
                  transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
                }}
                aria-pressed={active}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    background: t.accent,
                    border: `1px solid ${active ? BG : t.rule}`,
                  }}
                />
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Mark({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <rect x={3} y={3} width={18} height={18} fill="none" stroke={color} strokeWidth={2} />
      <line x1={7} y1={15} x2={7} y2={12} stroke={color} strokeWidth={2} />
      <line x1={12} y1={15} x2={12} y2={8} stroke={color} strokeWidth={2} />
      <line x1={17} y1={15} x2={17} y2={11} stroke={color} strokeWidth={2} />
    </svg>
  );
}

function Hero({
  INK,
  MUTED,
  ACCENT,
  RULE,
  BG,
  themeName,
}: {
  INK: string;
  MUTED: string;
  ACCENT: string;
  RULE: string;
  BG: string;
  themeName: string;
}) {
  return (
    <header className="pt-16 sm:pt-24">
      <div
        className="mb-6 inline-flex items-center gap-2 px-3 py-1 text-[12px] tracking-[-0.005em]"
        style={{
          border: `1px solid ${RULE}`,
          color: MUTED,
          background: BG,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: ACCENT,
          }}
        />
        live theme · {themeName}
      </div>
      <h1
        className="m-0 text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[72px] sm:leading-[1.04]"
        style={{ color: INK }}
      >
        Quiet charts
        <br />
        <span style={{ color: MUTED }}>for the writing</span>
        <br />
        <span style={{ color: INK }}>you actually publish.</span>
      </h1>
      <p
        className="mt-7 max-w-[580px] text-[16px] leading-[1.6] sm:text-[18px] sm:leading-[1.55]"
        style={{ color: MUTED }}
      >
        Fifteen chart primitives with a single aesthetic language, six named
        themes, and a CLI that takes a JSON file and writes a 2&times;-DPR PNG.
        Built to be driven by AI agents: hand it structured data, get back a
        figure you can ship next to real writing.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="#primitives"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium no-underline"
          style={{
            background: INK,
            color: BG,
            border: `1px solid ${INK}`,
          }}
        >
          browse primitives
          <span aria-hidden>→</span>
        </a>
        <a
          href="https://github.com/shuakami/paperchart"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium no-underline"
          style={{
            color: INK,
            border: `1px solid ${RULE}`,
          }}
        >
          github
          <span aria-hidden>↗</span>
        </a>
      </div>
    </header>
  );
}

// Hero chart — live render the currently selected theme so the switcher
// visibly changes the whole page. We use Dumbbell because it visually
// rewards the theme change the most.
function HeroChart({ theme }: { theme: import("./theme").Theme }) {
  return (
    <div
      className="mt-16 overflow-hidden"
      style={{
        border: `1px solid ${theme.rule}`,
        background: theme.bg,
      }}
    >
      <div
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "16 / 9",
        }}
      >
        <div
          style={{
            transform: "scale(1)",
            transformOrigin: "top left",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                width="100%"
                height="100%"
                style={{ display: "block" }}
              >
                <foreignObject x={0} y={0} width={1600} height={900}>
                  <div
                    // eslint-disable-next-line react/no-unknown-property
                    {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)}
                    style={{ width: 1600, height: 900 }}
                  >
                    <DumbbellChart theme={theme} />
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Install({
  INK,
  MUTED,
  ACCENT,
  RULE,
  PANEL,
  BG,
}: {
  INK: string;
  MUTED: string;
  ACCENT: string;
  RULE: string;
  PANEL: string;
  BG: string;
}) {
  return (
    <section className="pt-20 sm:pt-28">
      <Kicker>install</Kicker>
      <h2
        className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[38px]"
        style={{ color: INK }}
      >
        One command in, one image out.
      </h2>
      <p
        className="mt-4 max-w-[620px] text-[15px] leading-[1.65] sm:text-[16.5px]"
        style={{ color: MUTED }}
      >
        No build step, no install. The first invocation compiles the renderer
        and caches it. Subsequent renders are instant.
      </p>
      <div className="mt-8 space-y-3">
        <CopyBox cmd={INSTALL_CMD} INK={INK} MUTED={MUTED} ACCENT={ACCENT} RULE={RULE} PANEL={PANEL} BG={BG} />
        <CopyBox cmd={SKILL_CMD} INK={INK} MUTED={MUTED} ACCENT={ACCENT} RULE={RULE} PANEL={PANEL} BG={BG} muted />
        <CopyBox
          cmd={THEME_FLAG_EXAMPLE}
          INK={INK}
          MUTED={MUTED}
          ACCENT={ACCENT}
          RULE={RULE}
          PANEL={PANEL}
          BG={BG}
          muted
        />
      </div>
    </section>
  );
}

function CopyBox({
  cmd,
  muted,
  INK,
  MUTED,
  ACCENT,
  RULE,
  PANEL,
  BG,
}: {
  cmd: string;
  muted?: boolean;
  INK: string;
  MUTED: string;
  ACCENT: string;
  RULE: string;
  PANEL: string;
  BG: string;
}) {
  const [copied, setCopied] = useState(false);
  const accentColor = muted ? MUTED : ACCENT;
  return (
    <div
      className="flex items-center gap-3 overflow-x-auto px-4 py-3 sm:px-5 sm:py-3.5"
      style={{
        background: PANEL,
        border: `1px solid ${RULE}`,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      }}
    >
      <span className="flex-shrink-0 text-[13px]" style={{ color: MUTED }} aria-hidden>
        $
      </span>
      <code className="flex-1 whitespace-nowrap text-[13.5px] sm:text-[14.5px]" style={{ color: INK }}>
        {cmd}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(cmd);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="flex-shrink-0 text-[12px] sm:text-[12.5px]"
        style={{
          border: `1px solid ${RULE}`,
          background: BG,
          color: copied ? accentColor : MUTED,
          padding: "4px 10px",
          cursor: "pointer",
          fontFamily: "Inter, -apple-system, sans-serif",
        }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}

function PrimitivesSection({
  INK,
  MUTED,
  RULE,
  BG,
  PANEL,
  theme,
  themeName,
}: {
  INK: string;
  MUTED: string;
  RULE: string;
  BG: string;
  PANEL: string;
  theme: import("./theme").Theme;
  themeName: string;
}) {
  const [category, setCategory] = useState<"all" | "comparison" | "distribution" | "structure" | "flow">("all");
  const filtered = category === "all" ? PRIMITIVES_ALL : PRIMITIVES_ALL.filter((p) => p.category === category);
  const liveSlugs = new Set(["latency", "bytes", "line", "heatmap", "dumbbell"]);
  const categories: ("all" | "comparison" | "distribution" | "structure" | "flow")[] = [
    "all",
    "comparison",
    "distribution",
    "structure",
    "flow",
  ];
  return (
    <section id="primitives" className="pt-20 sm:pt-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker>primitives</Kicker>
          <h2
            className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[38px]"
            style={{ color: INK }}
          >
            Fifteen chart shapes.{" "}
            <span style={{ color: MUTED }}>One language.</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="px-3 py-1.5 text-[12.5px]"
              style={{
                background: category === c ? INK : "transparent",
                color: category === c ? BG : MUTED,
                border: `1px solid ${category === c ? INK : RULE}`,
                cursor: "pointer",
                fontFamily: "Inter, -apple-system, sans-serif",
              }}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const isLive = liveSlugs.has(p.slug);
          return (
            <a
              key={p.slug}
              href={`#/${p.slug}${themeName !== "paper" ? "" : ""}`}
              className="group block no-underline"
              style={{ color: INK, textDecoration: "none" }}
            >
              <div
                className="overflow-hidden transition-opacity group-hover:opacity-85"
                style={{
                  border: `1px solid ${RULE}`,
                  background: BG,
                }}
              >
                <div style={{ aspectRatio: "16 / 9", overflow: "hidden", position: "relative" }}>
                  {isLive ? (
                    <div style={{ position: "absolute", inset: 0 }}>
                      <LivePreview slug={p.slug} theme={theme} />
                    </div>
                  ) : (
                    <img
                      src={`${import.meta.env.BASE_URL}previews/${p.slug}.png`}
                      alt={`${p.name} preview`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        padding: 8,
                        background: BG,
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div
                  className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{ borderTop: `1px solid ${RULE}`, background: PANEL }}
                >
                  <div>
                    <div className="text-[14.5px] font-semibold" style={{ color: INK, letterSpacing: "-0.01em" }}>
                      {p.name}
                    </div>
                    <div className="mt-0.5 text-[12.5px]" style={{ color: MUTED }}>
                      {p.tag}
                    </div>
                  </div>
                  <span className="text-[12px]" style={{ color: MUTED }}>
                    {p.category}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function LivePreview({ slug, theme }: { slug: string; theme: import("./theme").Theme }) {
  // Scaled-down live render of a real chart — SVGs scale perfectly
  const chart = (() => {
    switch (slug) {
      case "latency":
        return <LatencyChart theme={theme} />;
      case "bytes":
        return <BytesChart theme={theme} />;
      case "line":
        return <LineChart theme={theme} />;
      case "heatmap":
        return <HeatmapChart theme={theme} />;
      case "dumbbell":
        return <DumbbellChart theme={theme} />;
      default:
        return null;
    }
  })();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="paperchart-scale"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            width="100%"
            height="100%"
            style={{ display: "block" }}
          >
            <foreignObject x={0} y={0} width={1600} height={900}>
              <div
                // eslint-disable-next-line react/no-unknown-property
                {...({ xmlns: "http://www.w3.org/1999/xhtml" } as Record<string, string>)}
                style={{ width: 1600, height: 900, background: theme.bg }}
              >
                {chart}
              </div>
            </foreignObject>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Customize({
  INK,
  MUTED,
  RULE,
  PANEL,
  BG,
}: {
  INK: string;
  MUTED: string;
  RULE: string;
  PANEL: string;
  BG: string;
}) {
  return (
    <section className="pt-20 sm:pt-28">
      <Kicker>customize</Kicker>
      <h2
        className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[38px]"
        style={{ color: INK }}
      >
        Defaults you ship. Knobs you reach for.
      </h2>
      <p
        className="mt-4 max-w-[620px] text-[15px] leading-[1.65] sm:text-[16.5px]"
        style={{ color: MUTED }}
      >
        Every chart accepts <code style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>{"{ data, theme, layout, style }"}</code>.
        Give it just <code style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>data</code> and you get the
        canonical layout. Reach further when an agent decides the defaults
        don&rsquo;t fit — canvas size, padding, font scale, axis captions,
        per-slot color overrides.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
        <pre
          className="m-0 overflow-x-auto px-5 py-5 text-[12.5px] leading-[1.55]"
          style={{
            background: PANEL,
            color: INK,
            border: `1px solid ${RULE}`,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          }}
        >
          <code>{JSON_EXAMPLE}</code>
        </pre>
        <div className="flex flex-col gap-3">
          <Knob label="theme" body="Named palette, or a partial override." INK={INK} MUTED={MUTED} RULE={RULE} BG={BG} />
          <Knob
            label="layout.width · height · padding"
            body="Tune canvas shape and margins per chart instance."
            INK={INK}
            MUTED={MUTED}
            RULE={RULE}
            BG={BG}
          />
          <Knob
            label="layout.fontScale"
            body="One multiplier for every text size — scales predictably."
            INK={INK}
            MUTED={MUTED}
            RULE={RULE}
            BG={BG}
          />
          <Knob
            label="layout.xAxisCaption · footnote · hideCorner"
            body="Inline annotations, no hand-drawn text layers needed."
            INK={INK}
            MUTED={MUTED}
            RULE={RULE}
            BG={BG}
          />
          <Knob
            label="style.ink · style.accent · …"
            body="Per-slot color nudges when the theme is 90% right."
            INK={INK}
            MUTED={MUTED}
            RULE={RULE}
            BG={BG}
          />
        </div>
      </div>
    </section>
  );
}

function Knob({
  label,
  body,
  INK,
  MUTED,
  RULE,
  BG,
}: {
  label: string;
  body: string;
  INK: string;
  MUTED: string;
  RULE: string;
  BG: string;
}) {
  return (
    <div
      className="px-4 py-3"
      style={{
        border: `1px solid ${RULE}`,
        background: BG,
      }}
    >
      <div
        className="text-[13.5px]"
        style={{
          color: INK,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        }}
      >
        {label}
      </div>
      <div className="mt-1 text-[13px] leading-[1.55]" style={{ color: MUTED }}>
        {body}
      </div>
    </div>
  );
}

function ThemeShowcase({
  INK,
  MUTED,
  RULE,
  BG,
  PANEL,
}: {
  theme: import("./theme").Theme;
  INK: string;
  MUTED: string;
  RULE: string;
  BG: string;
  PANEL: string;
}) {
  return (
    <section className="pt-20 sm:pt-28">
      <Kicker>themes</Kicker>
      <h2
        className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.015em] sm:text-[38px]"
        style={{ color: INK }}
      >
        Six palettes.{" "}
        <span style={{ color: MUTED }}>Pick one at the top. Watch everything change.</span>
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEME_ORDER.map((n) => {
          const t = THEMES[n];
          return (
            <div
              key={n}
              className="px-4 py-4"
              style={{
                background: t.bg,
                color: t.ink,
                border: `1px solid ${RULE}`,
              }}
            >
              <div
                className="text-[13.5px]"
                style={{
                  color: t.ink,
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                }}
              >
                {n}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {[t.bg, t.ink, t.muted, t.secondary, t.accent].map((c, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: 18,
                      background: c,
                      border: `1px solid ${t.rule}`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p
        className="mt-6 max-w-[620px] text-[13.5px] leading-[1.65]"
        style={{ color: MUTED }}
      >
        Themes are pure data — just five color tokens plus a background and a
        rule color. You can pass a theme name (<code style={{ color: INK }}>--theme ink</code>) or a partial object
        in <code style={{ color: INK }}>{'{ "theme": { ... } }'}</code> to override any token for a single chart.
        <span style={{ color: PANEL === BG ? MUTED : INK }}></span>
      </p>
    </section>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11.5px] uppercase tracking-[0.14em]"
      style={{ color: "currentColor", opacity: 0.5 }}
    >
      {children}
    </div>
  );
}

function Divider({ RULE }: { RULE: string }) {
  return <hr className="mt-20 border-0 sm:mt-28" style={{ height: 1, background: RULE }} />;
}

function Footer({ INK, MUTED, RULE }: { INK: string; MUTED: string; RULE: string }) {
  return (
    <footer className="pt-20 sm:pt-24">
      <div
        className="flex flex-col items-start justify-between gap-6 pt-6 sm:flex-row sm:items-center"
        style={{ borderTop: `1px solid ${RULE}` }}
      >
        <div className="text-[13px]" style={{ color: MUTED }}>
          built by{" "}
          <a
            href="https://github.com/shuakami"
            target="_blank"
            rel="noreferrer"
            style={{ color: INK, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            shuakami
          </a>{" "}
          · MIT
        </div>
        <div className="flex items-center gap-4 text-[13px]">
          <a
            href="https://github.com/shuakami/paperchart"
            target="_blank"
            rel="noreferrer"
            style={{ color: INK, textDecoration: "none" }}
          >
            github
          </a>
          <a
            href="https://github.com/shuakami/paperchart#json-schemas"
            target="_blank"
            rel="noreferrer"
            style={{ color: INK, textDecoration: "none" }}
          >
            schemas
          </a>
          <a
            href="https://github.com/shuakami/paperchart/tree/main/skills"
            target="_blank"
            rel="noreferrer"
            style={{ color: INK, textDecoration: "none" }}
          >
            skills
          </a>
        </div>
      </div>
    </footer>
  );
}
