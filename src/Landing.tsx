import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveTheme, type Theme } from "./theme";
import LatencyChart from "./charts/LatencyChart";
import BytesChart from "./charts/BytesChart";
import LineChart from "./charts/LineChart";
import HeatmapChart from "./charts/HeatmapChart";
import DumbbellChart from "./charts/DumbbellChart";
import RecallChart from "./charts/RecallChart";
import CriticalPathChart from "./charts/CriticalPathChart";
import PackLayout from "./charts/PackLayout";
import Delivery from "./charts/Delivery";
import AreaChart from "./charts/AreaChart";
import ScatterChart from "./charts/ScatterChart";
import HistogramChart from "./charts/HistogramChart";
import CdfChart from "./charts/CdfChart";
import RankingChart from "./charts/RankingChart";
import WaterfallChart from "./charts/WaterfallChart";
import TableChart from "./charts/TableChart";
import StackedBarChart from "./charts/StackedBarChart";
import GroupedBarChart from "./charts/GroupedBarChart";
import SlopeChart from "./charts/SlopeChart";
import SmallMultiplesChart from "./charts/SmallMultiplesChart";
import TimelineChart from "./charts/TimelineChart";
import FunnelChart from "./charts/FunnelChart";
import SankeyChart from "./charts/SankeyChart";
import TreemapChart from "./charts/TreemapChart";
import RadarChart from "./charts/RadarChart";
import BoxPlotChart from "./charts/BoxPlotChart";
import CalendarHeatmapChart from "./charts/CalendarHeatmapChart";

const THEME_ORDER = ["paper", "ink", "slate", "forest", "mono", "dusk"] as const;
type ThemeName = (typeof THEME_ORDER)[number];

type PrimitiveDef = {
  slug: string;
  name: string;
  tag: string;
  render: (theme: Theme) => React.ReactElement;
};

const PRIMITIVES: PrimitiveDef[] = [
  { slug: "table", name: "table", tag: "Comparison across models or configurations", render: (t) => <TableChart theme={t} /> },
  { slug: "latency", name: "latency", tag: "Grouped horizontal bars on a log scale", render: (t) => <LatencyChart theme={t} /> },
  { slug: "bytes", name: "bytes", tag: "Stacked bars for critical and deferred", render: (t) => <BytesChart theme={t} /> },
  { slug: "stacked-bar", name: "stacked bar", tag: "Composition by category", render: (t) => <StackedBarChart theme={t} /> },
  { slug: "grouped-bar", name: "grouped bar", tag: "Side-by-side categorical comparison", render: (t) => <GroupedBarChart theme={t} /> },
  { slug: "funnel", name: "funnel", tag: "Conversion across stages with drop-off", render: (t) => <FunnelChart theme={t} /> },
  { slug: "ranking", name: "ranking", tag: "Sorted leaderboard, one row accented", render: (t) => <RankingChart theme={t} /> },
  { slug: "dumbbell", name: "dumbbell", tag: "Paired before and after per row", render: (t) => <DumbbellChart theme={t} /> },
  { slug: "slope", name: "slope", tag: "Two-point trend with percentage change", render: (t) => <SlopeChart theme={t} /> },
  { slug: "line", name: "line", tag: "Multi-series line over time", render: (t) => <LineChart theme={t} /> },
  { slug: "area", name: "area", tag: "Stacked area composition over time", render: (t) => <AreaChart theme={t} /> },
  { slug: "small-multiples", name: "small multiples", tag: "One shape, repeated across subjects", render: (t) => <SmallMultiplesChart theme={t} /> },
  { slug: "timeline", name: "timeline", tag: "Phases across a time axis with milestones", render: (t) => <TimelineChart theme={t} /> },
  { slug: "scatter", name: "scatter", tag: "Correlation with optional regression", render: (t) => <ScatterChart theme={t} /> },
  { slug: "heatmap", name: "heatmap", tag: "Matrix on a two-color scale", render: (t) => <HeatmapChart theme={t} /> },
  { slug: "calendar-heatmap", name: "calendar heatmap", tag: "Daily activity across a year", render: (t) => <CalendarHeatmapChart theme={t} /> },
  { slug: "histogram", name: "histogram", tag: "Binned frequency distribution", render: (t) => <HistogramChart theme={t} /> },
  { slug: "box-plot", name: "box plot", tag: "Distribution summary with whiskers and outliers", render: (t) => <BoxPlotChart theme={t} /> },
  { slug: "cdf", name: "cdf", tag: "Empirical cumulative distribution", render: (t) => <CdfChart theme={t} /> },
  { slug: "radar", name: "radar", tag: "Multi-axis capability comparison", render: (t) => <RadarChart theme={t} /> },
  { slug: "treemap", name: "treemap", tag: "Hierarchical proportions by area", render: (t) => <TreemapChart theme={t} /> },
  { slug: "sankey", name: "sankey", tag: "Flow between source and target buckets", render: (t) => <SankeyChart theme={t} /> },
  { slug: "waterfall", name: "waterfall", tag: "Additive and subtractive steps", render: (t) => <WaterfallChart theme={t} /> },
  { slug: "critical-path", name: "critical path", tag: "Network timeline with milestones", render: (t) => <CriticalPathChart theme={t} /> },
  { slug: "recall", name: "recall", tag: "Per-row dot plot for set equality", render: (t) => <RecallChart theme={t} /> },
  { slug: "pack-layout", name: "pack layout", tag: "Byte-level binary anatomy", render: (t) => <PackLayout theme={t} /> },
  { slug: "delivery", name: "delivery", tag: "Three-panel architecture comparison", render: (t) => <Delivery theme={t} /> },
];

const INSTALL_CMD = "npx github:shuakami/paperchart <type> -i data.json -o out.png";
const SKILL_CMD = "npx skills add shuakami/paperchart";

export default function Landing() {
  const [themeName, setThemeName] = useState<ThemeName>("paper");
  const theme = useMemo(() => resolveTheme(themeName), [themeName]);
  const { ink, bg, rule } = theme;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.background = bg;
    document.body.style.color = ink;
    document.body.style.transition = "background 220ms ease, color 220ms ease";
  }, [bg, ink]);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: bg,
        color: ink,
        transition: "background 220ms ease, color 220ms ease",
      }}
    >
      <TopBar themeName={themeName} setThemeName={setThemeName} theme={theme} />

      <main className="mx-auto w-full max-w-[980px] px-5 pb-24 sm:px-8">
        <Hero theme={theme} />
        <Divider rule={rule} />
        <Install theme={theme} />
        <Divider rule={rule} />
        <Gallery theme={theme} />
        <Divider rule={rule} />
        <JsonShape theme={theme} />
        <Divider rule={rule} />
        <Footer theme={theme} />
      </main>
    </div>
  );
}

function TopBar({
  themeName,
  setThemeName,
  theme,
}: {
  themeName: ThemeName;
  setThemeName: (n: ThemeName) => void;
  theme: Theme;
}) {
  const { ink, bg, rule } = theme;
  return (
    <div
      className="sticky top-0 z-20 w-full"
      style={{
        background: bg,
        borderBottom: `1px solid ${rule}`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a
          href="#/"
          className="text-[15px] font-medium no-underline"
          style={{ color: ink, letterSpacing: "-0.01em" }}
        >
          paperchart
        </a>
        <label className="flex items-center gap-2 text-[13px]" style={{ color: theme.muted }}>
          <span>theme</span>
          <select
            value={themeName}
            onChange={(e) => setThemeName(e.target.value as ThemeName)}
            aria-label="theme"
            style={{
              backgroundColor: bg,
              color: ink,
              border: `1px solid ${rule}`,
              padding: "4px 26px 4px 10px",
              fontSize: 13,
              fontFamily: "inherit",
              lineHeight: 1.4,
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' fill='none' stroke='${encodeURIComponent(ink)}' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "10px 10px",
            }}
          >
            {THEME_ORDER.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function Hero({ theme }: { theme: Theme }) {
  const { ink, muted } = theme;
  return (
    <header className="pt-14 sm:pt-20">
      <h1
        className="m-0 text-[42px] font-normal leading-[1.08] tracking-[-0.02em] sm:text-[64px] sm:leading-[1.06]"
        style={{ color: ink }}
      >
        Charts that read like<br />
        the writing around them.
      </h1>
      <p
        className="mt-6 max-w-[600px] text-[16px] leading-[1.6] sm:text-[18px] sm:leading-[1.55]"
        style={{ color: muted }}
      >
        Twenty-seven primitives, six themes, one command. Feed structured JSON,
        get back a PNG at two-times device pixel ratio. Good defaults, every
        knob overridable, nothing flashy.
      </p>
      <div className="mt-10">
        <HeroSlideshow theme={theme} />
      </div>
    </header>
  );
}

type HeroSlide = {
  slug: string;
  caption: string;
  aspect: number;
  render: (theme: Theme) => React.ReactElement;
};

const HERO_SLIDES: HeroSlide[] = [
  {
    slug: "table",
    caption: "A comparison table. Column groups on top, one focal column tinted.",
    aspect: 1600 / 720,
    render: (t) => <TableChart theme={t} />,
  },
  {
    slug: "latency",
    caption: "Latency distribution. Grouped horizontal bars on a log-scaled axis.",
    aspect: 1600 / 900,
    render: (t) => <LatencyChart theme={t} />,
  },
  {
    slug: "sankey",
    caption: "Flow between sources and targets. Ribbon thickness equals value.",
    aspect: 1600 / 900,
    render: (t) => <SankeyChart theme={t} />,
  },
  {
    slug: "treemap",
    caption: "Hierarchical proportions. Squarified tiles preserve aspect ratio.",
    aspect: 1600 / 900,
    render: (t) => <TreemapChart theme={t} />,
  },
  {
    slug: "calendar-heatmap",
    caption: "A year of daily counts on a seven-by-fifty-three grid.",
    aspect: 1600 / 380,
    render: (t) => <CalendarHeatmapChart theme={t} />,
  },
  {
    slug: "radar",
    caption: "Capability profile across axes that share a zero-to-max scale.",
    aspect: 1600 / 900,
    render: (t) => <RadarChart theme={t} />,
  },
  {
    slug: "critical-path",
    caption: "Network waterfall with blocking, deferred, and milestone markers.",
    aspect: 1600 / 780,
    render: (t) => <CriticalPathChart theme={t} />,
  },
  {
    slug: "delivery",
    caption: "Three-panel architecture comparison, only one variant emphasized.",
    aspect: 1600 / 900,
    render: (t) => <Delivery theme={t} />,
  },
];

const HERO_DURATION_MS = 5200;
const HERO_TRANSITION_MS = 620;

function HeroSlideshow({ theme }: { theme: Theme }) {
  const { ink, muted, rule, bg } = theme;

  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const exitTimer = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setActive((current) => {
        const n = ((next % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length;
        if (n === current) return current;
        setPrev(current);
        setCycle((c) => c + 1);
        if (exitTimer.current) window.clearTimeout(exitTimer.current);
        exitTimer.current = window.setTimeout(() => {
          setPrev(null);
          exitTimer.current = null;
        }, HERO_TRANSITION_MS);
        return n;
      });
    },
    []
  );

  // Auto-advance. Reset on pause / manual nav via `cycle`.
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => go(active + 1), HERO_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, cycle, go]);

  // Keyboard nav. Only when no input / textarea is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, go]);

  useEffect(
    () => () => {
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    },
    []
  );

  const activeSlide = HERO_SLIDES[active];

  return (
    <div>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        style={{
          position: "relative",
          background: bg,
          border: `1px solid ${rule}`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: String(activeSlide.aspect),
            overflow: "hidden",
            transition:
              "aspect-ratio 620ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {prev !== null && (
            <div
              key={`out-${prev}-${cycle}`}
              className="paperchart-slide paperchart-slide--exit"
            >
              <HeroSlideInner slide={HERO_SLIDES[prev]} theme={theme} />
            </div>
          )}
          <div
            key={`in-${active}-${cycle}`}
            className="paperchart-slide paperchart-slide--enter"
          >
            <HeroSlideInner slide={activeSlide} theme={theme} />
          </div>
        </div>

        {/* progress bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "transparent",
          }}
        >
          <div
            key={`progress-${active}-${cycle}`}
            className="paperchart-progress-fill"
            data-paused={paused ? "true" : "false"}
            style={{
              height: "100%",
              width: "100%",
              background: ink,
              opacity: 0.35,
              animationDuration: `${HERO_DURATION_MS}ms`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p
          key={`caption-${active}`}
          className="paperchart-slide paperchart-slide--enter m-0 text-[13.5px] leading-[1.55]"
          style={{
            color: muted,
            position: "relative",
            animationDuration: "420ms",
            flex: "1 1 auto",
          }}
        >
          {activeSlide.caption}
        </p>
        <div className="flex items-center gap-2" aria-label="slide indicators">
          {HERO_SLIDES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => go(i)}
                aria-label={`go to slide ${i + 1}: ${s.slug}`}
                aria-current={on ? "true" : "false"}
                style={{
                  width: on ? 18 : 6,
                  height: 6,
                  padding: 0,
                  border: 0,
                  borderRadius: 999,
                  background: on ? ink : rule,
                  opacity: on ? 0.85 : 1,
                  cursor: "pointer",
                  transition:
                    "width 420ms cubic-bezier(0.22,1,0.36,1), background 220ms ease",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HeroSlideInner({
  slide,
  theme,
}: {
  slide: HeroSlide;
  theme: Theme;
}) {
  // Center the chart vertically inside the slideshow frame so shorter slides
  // (e.g. calendar-heatmap) don't sit glued to the top.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%" }}>
        <FitSvg aspect={slide.aspect}>{slide.render(theme)}</FitSvg>
      </div>
    </div>
  );
}

function FitSvg({
  aspect,
  children,
}: {
  aspect: number;
  children: React.ReactNode;
}) {
  // Scales an absolute-sized chart SVG to the container width while preserving
  // the intrinsic aspect. Works because every chart renders as a <svg width=...
  // height=... viewBox=...>.
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: String(aspect),
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "stretch",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
          }}
        >
          <style>{`
            .fitsvg svg { width: 100% !important; height: 100% !important; display: block; }
          `}</style>
          <div className="fitsvg" style={{ width: "100%" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function Divider({ rule }: { rule: string }) {
  return (
    <hr
      className="my-16 sm:my-20"
      style={{ border: 0, borderTop: `1px solid ${rule}` }}
    />
  );
}

function Install({ theme }: { theme: Theme }) {
  const { ink, muted } = theme;
  return (
    <section>
      <h2
        className="m-0 text-[22px] font-medium leading-[1.3] tracking-[-0.01em] sm:text-[26px]"
        style={{ color: ink }}
      >
        Use it from the command line.
      </h2>
      <p
        className="mt-3 max-w-[620px] text-[15px] leading-[1.62]"
        style={{ color: muted }}
      >
        Node 18 or newer. The first run prepares a vendored build and installs
        a headless browser. Every subsequent invocation is a single screenshot
        round-trip.
      </p>

      <CodeBlock theme={theme} label="CLI" code={INSTALL_CMD} />
      <CodeBlock theme={theme} label="Agent skill" code={SKILL_CMD} />

      <p
        className="mt-4 text-[13.5px] leading-[1.6]"
        style={{ color: muted }}
      >
        Replace <code style={{ color: ink }}>&lt;type&gt;</code> with any slug
        from the gallery below. Add <code style={{ color: ink }}>--theme</code>{" "}
        to pick a palette, <code style={{ color: ink }}>--width</code> to
        override the canvas.
      </p>
    </section>
  );
}

function CodeBlock({
  theme,
  label,
  code,
}: {
  theme: Theme;
  label: string;
  code: string;
}) {
  const { ink, muted, rule, bg } = theme;
  void bg;
  const panel = theme.panel ?? bg;
  return (
    <div
      className="mt-5"
      style={{
        border: `1px solid ${rule}`,
        background: panel,
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          borderBottom: `1px solid ${rule}`,
          color: muted,
          fontSize: 12,
        }}
      >
        <span>{label}</span>
        <CopyButton text={code} theme={theme} />
      </div>
      <pre
        className="m-0 overflow-x-auto px-4 py-3 text-[13.5px] leading-[1.6]"
        style={{
          color: ink,
          fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyButton({ text, theme }: { text: string; theme: Theme }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          // ignore
        }
      }}
      style={{
        background: "transparent",
        border: "none",
        color: theme.muted,
        cursor: "pointer",
        fontSize: 12,
        padding: 0,
      }}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

function Gallery({ theme }: { theme: Theme }) {
  const { ink, muted, rule } = theme;
  return (
    <section id="primitives">
      <h2
        className="m-0 text-[22px] font-medium leading-[1.3] tracking-[-0.01em] sm:text-[26px]"
        style={{ color: ink }}
      >
        Twenty-seven primitives.
      </h2>
      <p
        className="mt-3 max-w-[620px] text-[15px] leading-[1.62]"
        style={{ color: muted }}
      >
        Every tile below is a live render, not a static image. Flip the theme
        switcher in the header and watch each one follow. Every chart accepts
        the same <code style={{ color: ink }}>{"{ data, theme, layout, style }"}</code>{" "}
        envelope.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10">
        {PRIMITIVES.map((p, i) => (
          <figure key={p.slug} className="m-0">
            <div
              style={{
                border: `1px solid ${rule}`,
                background: theme.bg,
              }}
            >
              <FitSvg aspect={computeAspect(p.slug)}>
                {p.render(theme)}
              </FitSvg>
            </div>
            <figcaption
              className="mt-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              style={{ color: muted, fontSize: 13.5, lineHeight: 1.5 }}
            >
              <span style={{ color: ink }}>
                <span style={{ color: muted, fontVariantNumeric: "tabular-nums" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mx-2" style={{ color: muted }}>·</span>
                {p.name}
              </span>
              <span>{p.tag}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function computeAspect(slug: string): number {
  // match the default width/height each chart uses, so FitSvg reserves the
  // right amount of room. Defaults come from each chart's BaseLayout defaults.
  switch (slug) {
    case "table":
      return 1600 / 720;
    case "small-multiples":
      return 1600 / 900;
    case "pack-layout":
      return 1600 / 780;
    case "delivery":
      return 1600 / 900;
    case "critical-path":
      return 1600 / 780;
    case "heatmap":
      return 1600 / 900;
    case "timeline":
      return 1600 / 540;
    case "funnel":
      return 1600 / 620;
    case "box-plot":
      return 1600 / 520;
    case "calendar-heatmap":
      return 1600 / 380;
    default:
      return 1600 / 900;
  }
}

function JsonShape({ theme }: { theme: Theme }) {
  const { ink, muted } = theme;
  return (
    <section>
      <h2
        className="m-0 text-[22px] font-medium leading-[1.3] tracking-[-0.01em] sm:text-[26px]"
        style={{ color: ink }}
      >
        One envelope for every chart.
      </h2>
      <p
        className="mt-3 max-w-[620px] text-[15px] leading-[1.62]"
        style={{ color: muted }}
      >
        Put the chart&rsquo;s own data under <code style={{ color: ink }}>data</code>.
        Optional <code style={{ color: ink }}>theme</code>,{" "}
        <code style={{ color: ink }}>layout</code>, and{" "}
        <code style={{ color: ink }}>style</code> blocks let you tune
        everything from canvas size to per-slot colors without touching any
        chart code.
      </p>
      <CodeBlock
        theme={theme}
        label="JSON"
        code={`{
  "theme": "ink",
  "layout": {
    "width": 1800,
    "fontScale": 1.05,
    "xAxisCaption": "per-query latency (ms, log scale)",
    "hideCorner": true
  },
  "style": {
    "accent": "#1f6feb"
  },
  "data": [
    { "group": "baseline", "bars": [
      { "level": "p50", "ms": 8.12 },
      { "level": "p95", "ms": 17.30 },
      { "level": "p99", "ms": 25.41 }
    ]},
    { "group": "rebuilt", "color": "accent", "bars": [
      { "level": "p50", "ms": 0.064 },
      { "level": "p95", "ms": 0.302 },
      { "level": "p99", "ms": 0.470 }
    ]}
  ]
}`}
      />
    </section>
  );
}

function Footer({ theme }: { theme: Theme }) {
  const { ink, muted } = theme;
  return (
    <footer
      className="flex flex-col gap-1 pb-4 text-[13px] sm:flex-row sm:items-center sm:justify-between"
      style={{ color: muted }}
    >
      <span style={{ color: ink }}>paperchart</span>
      <span>
        <a
          href="https://github.com/shuakami/paperchart"
          style={{ color: muted, textDecoration: "none" }}
        >
          shuakami/paperchart
        </a>
        <span className="mx-2">·</span>
        MIT
      </span>
    </footer>
  );
}
