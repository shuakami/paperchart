// Layout override system. Every chart accepts a `layout` block that can tune
// canvas size, spacing, font scale, axis caption, corner annotation, and a few
// chart-specific knobs. All fields are optional; charts start from good
// defaults so AI callers can pass nothing and get a polished figure.

export type BaseLayout = {
  // canvas dimensions (px). charts pick sensible defaults per type.
  width?: number;
  height?: number;

  // asymmetric padding overrides (px). charts compute plot region from these.
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };

  // multiplicative font-size scale (1.0 = default).
  fontScale?: number;

  // hide the corner annotation block (top-right) even if present in data.
  hideCorner?: boolean;

  // override the corner annotation text (array of lines). takes precedence
  // over any default text shipped with the chart.
  corner?: string[];

  // override axis captions. strings are rendered under / left-of the plot.
  xAxisCaption?: string;
  yAxisCaption?: string;

  // override the footnote rendered at the bottom of the canvas.
  footnote?: string;

  // optional explicit title + subtitle. most charts ship without titles;
  // this is for authors who want the chart to be self-contained.
  title?: string;
  subtitle?: string;

  // show/hide x-axis tick labels and baseline grid.
  hideGrid?: boolean;
  hideXTicks?: boolean;
  hideYTicks?: boolean;

  // chart-specific extensions attached under this catch-all. each chart
  // declares its own allowed keys (e.g. barThickness, rowGap, dotRadius).
  [k: string]: unknown;
};

export type StyleOverrides = {
  // per-slot color overrides; all optional. keyed by semantic slot.
  bg?: string;
  ink?: string;
  muted?: string;
  accent?: string;
  secondary?: string;
  rule?: string;

  // font-family override (defaults to Inter + JetBrains Mono for tab-nums).
  fontFamily?: string;
  monoFontFamily?: string;
};

// resolve a numeric layout value with a default fallback.
export function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function str(v: unknown, fallback: string): string {
  if (typeof v === "string") return v;
  return fallback;
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  return fallback;
}

// Given raw JSON input to a chart, extract the data / layout / style blocks.
// Supports both wrapped form ({ data, layout, style, theme }) and bare-data
// form (legacy, used by existing sample files). For the wrapped form, `data`
// is what the chart consumes; for the bare form, the whole input IS data.
export function unwrap<T = unknown>(
  input: unknown,
): {
  data: T | undefined;
  layout: BaseLayout;
  style: StyleOverrides;
} {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const obj = input as {
      data?: T;
      rows?: T;
      layout?: BaseLayout;
      style?: StyleOverrides;
      theme?: unknown;
    };
    // wrapped forms: { data: ... } OR { rows: ... }
    if ("data" in obj && obj.data !== undefined) {
      return {
        data: obj.data,
        layout: obj.layout ?? {},
        style: obj.style ?? {},
      };
    }
    if ("rows" in obj && obj.rows !== undefined) {
      return {
        data: obj.rows as T,
        layout: obj.layout ?? {},
        style: obj.style ?? {},
      };
    }
    // if nothing matches, treat the whole object as data (for charts whose
    // data IS an object, like Delivery { header, panels, ... })
    return {
      data: input as T,
      layout: obj.layout ?? {},
      style: obj.style ?? {},
    };
  }
  // arrays, primitives → bare data
  return { data: input as T, layout: {}, style: {} };
}
