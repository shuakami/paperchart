import { chromium } from "playwright-chromium";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// Usage:
//   npm run dev &          # starts the Vite dev server on :5173
//   node snap.mjs          # renders every chart route to ./out/*.png
//
// Override the server URL with BASE=... and the output directory with OUT=...

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = process.env.OUT || path.join(__dirname, "out");
const BASE = process.env.BASE || "http://127.0.0.1:5173";

fs.mkdirSync(OUT, { recursive: true });

// Chart routes are exposed by src/App.tsx; add yours here when you add a chart.
const routes = [
  { slug: "latency", file: "latency.png" },
  { slug: "bytes", file: "bytes.png" },
  { slug: "pack-layout", file: "pack-layout.png" },
  { slug: "delivery", file: "delivery.png" },
  { slug: "recall", file: "recall.png" },
  { slug: "critical-path", file: "critical-path.png" },
  { slug: "line", file: "line.png" },
  { slug: "area", file: "area.png" },
  { slug: "scatter", file: "scatter.png" },
  { slug: "heatmap", file: "heatmap.png" },
  { slug: "histogram", file: "histogram.png" },
  { slug: "cdf", file: "cdf.png" },
  { slug: "dumbbell", file: "dumbbell.png" },
  { slug: "ranking", file: "ranking.png" },
  { slug: "waterfall", file: "waterfall.png" },
  { slug: "table", file: "table.png" },
  { slug: "stacked-bar", file: "stacked-bar.png" },
  { slug: "grouped-bar", file: "grouped-bar.png" },
  { slug: "slope", file: "slope.png" },
  { slug: "small-multiples", file: "small-multiples.png" },
  { slug: "timeline", file: "timeline.png" },
  { slug: "funnel", file: "funnel.png" },
  { slug: "sankey", file: "sankey.png" },
  { slug: "treemap", file: "treemap.png" },
  { slug: "radar", file: "radar.png" },
  { slug: "box-plot", file: "box-plot.png" },
  { slug: "calendar-heatmap", file: "calendar-heatmap.png" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 1200 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const THEME = process.env.THEME || "";
const SUFFIX = process.env.SUFFIX || "";

for (const r of routes) {
  const tq = THEME ? `?type=${r.slug}&theme=${THEME}` : `?type=${r.slug}`;
  const target = `${BASE}/${tq}`;
  console.log("→", target);
  await page.goto(target, { waitUntil: "networkidle" });
  await page.waitForSelector("#chart-root", { state: "attached" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const el = await page.$("#chart-root");
  if (!el) throw new Error(`no #chart-root for ${r.slug}`);
  const outName = SUFFIX
    ? r.file.replace(/\.png$/, `${SUFFIX}.png`)
    : r.file;
  const filename = path.join(OUT, outName);
  await el.screenshot({ path: filename, omitBackground: false });
  const { size } = fs.statSync(filename);
  console.log("   ", outName, size, "bytes");
}

await browser.close();
console.log("done ·", OUT);
