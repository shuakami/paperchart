import { useEffect, useState } from "react";
import LatencyChart from "./charts/LatencyChart";
import BytesChart from "./charts/BytesChart";
import RecallChart from "./charts/RecallChart";
import CriticalPathChart from "./charts/CriticalPathChart";
import PackLayout from "./charts/PackLayout";
import Delivery from "./charts/Delivery";
import LineChart from "./charts/LineChart";
import AreaChart from "./charts/AreaChart";
import ScatterChart from "./charts/ScatterChart";
import HeatmapChart from "./charts/HeatmapChart";
import HistogramChart from "./charts/HistogramChart";
import CdfChart from "./charts/CdfChart";
import DumbbellChart from "./charts/DumbbellChart";
import RankingChart from "./charts/RankingChart";
import WaterfallChart from "./charts/WaterfallChart";
import TableChart from "./charts/TableChart";
import StackedBarChart from "./charts/StackedBarChart";
import GroupedBarChart from "./charts/GroupedBarChart";
import SlopeChart from "./charts/SlopeChart";
import SmallMultiplesChart from "./charts/SmallMultiplesChart";
import Landing from "./Landing";
import { resolveTheme, type Theme } from "./theme";

type Comp = React.ComponentType<{ data?: unknown; theme: Theme }>;

const routes: Record<string, Comp> = {
  latency: LatencyChart,
  bytes: BytesChart,
  recall: RecallChart,
  "critical-path": CriticalPathChart,
  "pack-layout": PackLayout,
  delivery: Delivery,
  line: LineChart,
  area: AreaChart,
  scatter: ScatterChart,
  heatmap: HeatmapChart,
  histogram: HistogramChart,
  cdf: CdfChart,
  dumbbell: DumbbellChart,
  ranking: RankingChart,
  waterfall: WaterfallChart,
  table: TableChart,
  "stacked-bar": StackedBarChart,
  "grouped-bar": GroupedBarChart,
  slope: SlopeChart,
  "small-multiples": SmallMultiplesChart,
};

function readQuery(): {
  route: string;
  data: unknown;
  themeName: string | null;
} {
  if (typeof window === "undefined") {
    return { route: "index", data: undefined, themeName: null };
  }
  const url = new URL(window.location.href);
  const t = url.searchParams.get("type");
  const d = url.searchParams.get("data");
  const themeName = url.searchParams.get("theme");
  if (t) {
    let parsed: unknown = undefined;
    if (d) {
      try {
        const normalized = d.replace(/-/g, "+").replace(/_/g, "/");
        const pad =
          normalized.length % 4 === 0
            ? ""
            : "=".repeat(4 - (normalized.length % 4));
        const json = atob(normalized + pad);
        parsed = JSON.parse(
          decodeURIComponent(
            Array.prototype.map
              .call(json, (c: string) =>
                "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
              )
              .join(""),
          ),
        );
      } catch {
        parsed = undefined;
      }
    }
    return { route: t, data: parsed, themeName };
  }
  const h = window.location.hash.replace(/^#\/?/, "");
  return { route: h || "index", data: undefined, themeName };
}

export default function App() {
  const [state, setState] = useState<{
    route: string;
    data: unknown;
    themeName: string | null;
  }>(readQuery());
  useEffect(() => {
    const on = () => setState(readQuery());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);

  if (state.route === "index") return <Landing />;

  const Comp = routes[state.route];
  if (!Comp) {
    return (
      <div style={{ padding: 40, fontFamily: "Inter" }}>
        unknown chart type &mdash; <a href="#/">back to home</a>
      </div>
    );
  }

  // theme resolution order:
  //   1. URL query ?theme=<name>
  //   2. data.theme (string name or object override)
  //   3. default "paper"
  let themeInput: string | Partial<Theme> | undefined =
    state.themeName ?? undefined;
  const dataObj = state.data as { theme?: string | Partial<Theme> } | undefined;
  if (!themeInput && dataObj && typeof dataObj === "object" && dataObj.theme) {
    themeInput = dataObj.theme;
  }
  const theme = resolveTheme(themeInput);

  return (
    <div
      id="chart-root"
      className="chart-card"
      style={{ background: theme.bg }}
    >
      <Comp data={state.data} theme={theme} />
    </div>
  );
}
