#!/usr/bin/env node
// paperchart CLI
//   paperchart <type> -i data.json -o out.png [--width 1600] [--dpr 2]
//
// Reads a JSON file, renders one of the paperchart primitives with that data,
// and writes a PNG to disk. Ships with its own prebuilt static bundle and runs
// Playwright-Chromium headless to screenshot the chart at 2x DPR.
//
// Intended to be AI-friendly: feed structured JSON, get a clean PNG. No React
// editing, no dev server setup. See the project README for per-chart schemas.

import { parseArgs } from "node:util";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";

const TYPES = [
  "latency",
  "bytes",
  "recall",
  "critical-path",
  "pack-layout",
  "delivery",
  "line",
  "area",
  "scatter",
  "heatmap",
  "histogram",
  "cdf",
  "dumbbell",
  "ranking",
  "waterfall",
  "table",
  "stacked-bar",
  "grouped-bar",
  "slope",
  "small-multiples",
  "timeline",
  "funnel",
  "sankey",
  "treemap",
  "radar",
  "box-plot",
  "calendar-heatmap",
];

const THEMES = ["paper", "ink", "slate", "forest", "mono", "dusk"];

function die(msg, code = 1) {
  process.stderr.write(`paperchart: ${msg}\n`);
  process.exit(code);
}

function printHelp() {
  process.stdout.write(
    [
      "Usage:",
      "  paperchart <type> -i data.json -o out.png [options]",
      "",
      "Types:",
      "  " + TYPES.join(", "),
      "",
      "Themes:",
      "  " + THEMES.join(", ") + " (default: paper)",
      "",
      "Options:",
      "  -i, --input <path>    Path to JSON input.",
      "                        Use `--defaults` to render the built-in sample.",
      "  -o, --output <path>   Path to PNG output. Required.",
      "  -t, --theme <name>    Color theme (" + THEMES.join(" | ") + ").",
      "  -w, --width <px>      Viewport width (default 1600).",
      "      --dpr <factor>    Device pixel ratio for the render (default 2).",
      "      --defaults        Skip -i, render the sample shipped with the CLI.",
      "      --help            Print this message.",
      "",
      "Schemas: https://github.com/shuakami/paperchart#json-schemas",
      "",
    ].join("\n"),
  );
}

function parseCliArgs() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }
  const type = argv[0];
  if (!TYPES.includes(type)) {
    die(
      `unknown chart type "${type}". one of: ${TYPES.join(", ")}\n` +
        `run \`paperchart --help\` to see usage.`,
    );
  }
  let values;
  try {
    ({ values } = parseArgs({
      args: argv.slice(1),
      options: {
        input: { type: "string", short: "i" },
        output: { type: "string", short: "o" },
        theme: { type: "string", short: "t" },
        width: { type: "string", short: "w", default: "1600" },
        dpr: { type: "string", default: "2" },
        defaults: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
      },
      strict: true,
    }));
  } catch (e) {
    die(`${e.message}\n\nrun \`paperchart --help\` to see usage.`);
  }
  if (values.theme && !THEMES.includes(values.theme)) {
    die(
      `unknown theme "${values.theme}". one of: ${THEMES.join(", ")}\n` +
        `run \`paperchart --help\` to see usage.`,
    );
  }
  if (values.help) {
    printHelp();
    process.exit(0);
  }
  if (!values.output) die("missing -o <output.png>");
  if (!values.defaults && !values.input) {
    die("missing -i <input.json>  (or pass --defaults to render the sample)");
  }
  return { type, values };
}

function loadData(inputPath) {
  if (!inputPath) return undefined;
  const abs = path.resolve(inputPath);
  let raw;
  try {
    raw = fs.readFileSync(abs, "utf8");
  } catch (e) {
    die(`cannot read input: ${abs}\n  ${e.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    die(`input is not valid JSON: ${abs}\n  ${e.message}`);
  }
  return parsed;
}

function encodeForUrl(obj) {
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf8").toString("base64");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function startStaticServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqUrl;
      try {
        reqUrl = new URL(req.url, "http://x");
      } catch {
        res.writeHead(400).end();
        return;
      }
      let reqPath = decodeURIComponent(reqUrl.pathname);
      if (reqPath.startsWith("/paperchart/"))
        reqPath = reqPath.slice("/paperchart".length);
      if (reqPath === "/") reqPath = "/index.html";
      const filePath = path.join(distDir, reqPath);
      if (!filePath.startsWith(distDir)) {
        res.writeHead(403).end();
        return;
      }
      fs.readFile(filePath, (err, buf) => {
        if (err) {
          fs.readFile(path.join(distDir, "index.html"), (e2, html) => {
            if (e2) {
              res.writeHead(404).end("not found");
              return;
            }
            res.writeHead(200, {
              "content-type": "text/html; charset=utf-8",
            });
            res.end(html);
          });
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, {
          "content-type": MIME[ext] ?? "application/octet-stream",
          "cache-control": "no-store",
        });
        res.end(buf);
      });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function renderChart({ type, data, width, dpr, output, distDir, theme }) {
  const server = await startStaticServer(distDir);
  const port = server.address().port;

  let chromium;
  try {
    ({ chromium } = await import("playwright-chromium"));
  } catch {
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      server.close();
      die(
        "playwright-chromium is not installed. install it with:\n" +
          "    npm i -g playwright-chromium\n" +
          "  then re-run paperchart.",
      );
    }
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    server.close();
    die(
      `failed to launch headless Chromium.\n  ${e.message}\n\n` +
        "if you installed playwright-chromium globally and this is the first run,\n" +
        "you may also need: `npx playwright install chromium`",
    );
  }

  try {
    const context = await browser.newContext({
      viewport: { width: Number(width), height: 1200 },
      deviceScaleFactor: Number(dpr),
    });
    const page = await context.newPage();

    const themeQ = theme
      ? `&theme=${encodeURIComponent(theme)}`
      : "";
    let target;
    if (data !== undefined) {
      const encoded = encodeForUrl(data);
      target = `http://127.0.0.1:${port}/?type=${encodeURIComponent(
        type,
      )}&data=${encodeURIComponent(encoded)}${themeQ}`;
    } else {
      target = `http://127.0.0.1:${port}/?type=${encodeURIComponent(type)}${themeQ}`;
    }

    await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector("#chart-root", {
      state: "attached",
      timeout: 10000,
    });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
    await page.waitForTimeout(180);

    const el = await page.$("#chart-root");
    if (!el) die("chart failed to render (no #chart-root element found)");

    const absOut = path.resolve(output);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    await el.screenshot({ path: absOut });
    const size = fs.statSync(absOut).size;
    process.stdout.write(
      `paperchart → ${absOut}  (${type}, ${size} bytes)\n`,
    );
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
}

async function main() {
  const { type, values } = parseCliArgs();
  const data = values.defaults ? undefined : loadData(values.input);
  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "..", "dist"),
    path.resolve(here, "..", "..", "dist"),
  ];
  const distDir = candidates.find((d) => fs.existsSync(path.join(d, "index.html")));
  if (!distDir) {
    die(
      "paperchart dist bundle not found.\n" +
        "  looked for: " +
        candidates.map((d) => path.join(d, "index.html")).join(", ") +
        "\n\n" +
        "if you cloned the repo directly, run `npm install && npm run build` first.",
    );
  }
  await renderChart({
    type,
    data,
    width: values.width,
    dpr: values.dpr,
    output: values.output,
    distDir,
    theme: values.theme,
  });
  // extra safety: unix-style exit (on some Node + Playwright setups the process
  // lingers briefly after server.close())
  setTimeout(() => process.exit(0), 50).unref();
}

main().catch((e) => {
  process.stderr.write(`paperchart: ${e?.stack ?? e?.message ?? e}\n`);
  process.exit(2);
});
