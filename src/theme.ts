// Theme engine. Every chart reads a 5-token theme — bg, ink, muted, accent,
// secondary, rule — no hardcoded hex in chart code. Users can pick one of the
// built-in themes via CLI `--theme` or pass a custom one via the JSON input
// under `theme:`.

export type Theme = {
  name: string;
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  secondary: string;
  rule: string;
  // optional derived slot for stacked charts and heatmaps
  accentSoft?: string;
  secondarySoft?: string;
  panel?: string;
};

export const THEMES: Record<string, Theme> = {
  // warm off-white, rust accent — the original look
  paper: {
    name: "paper",
    bg: "#F6F1EA",
    ink: "#2B2A27",
    muted: "#5B574E",
    accent: "#C75F3C",
    secondary: "#D6B99B",
    rule: "#E6DCCE",
    accentSoft: "#E89A80",
    secondarySoft: "#E8D5BA",
    panel: "#FBF7F0",
  },
  // near-white, black ink, graphite accent — the OpenAI research post look
  ink: {
    name: "ink",
    bg: "#FAFAF8",
    ink: "#111111",
    muted: "#5B5B5B",
    accent: "#111111",
    secondary: "#B8B8B5",
    rule: "#E5E5E2",
    accentSoft: "#4A4A4A",
    secondarySoft: "#D4D4D1",
    panel: "#FFFFFF",
  },
  // cool neutral, deep blue accent — Stripe Press / research paper
  slate: {
    name: "slate",
    bg: "#F4F5F7",
    ink: "#1B2230",
    muted: "#56627A",
    accent: "#3B5BDB",
    secondary: "#9AA7BC",
    rule: "#DCE0E8",
    accentSoft: "#8AA0EC",
    secondarySoft: "#C4CCD9",
    panel: "#FFFFFF",
  },
  // warm off-white, forest green accent
  forest: {
    name: "forest",
    bg: "#F4F1E8",
    ink: "#1E2A22",
    muted: "#4E5A50",
    accent: "#2F6B48",
    secondary: "#B8BEA6",
    rule: "#DDDACB",
    accentSoft: "#83A794",
    secondarySoft: "#D4D4C2",
    panel: "#FAF8F0",
  },
  // pure monochrome, no accent color
  mono: {
    name: "mono",
    bg: "#FFFFFF",
    ink: "#000000",
    muted: "#6B6B6B",
    accent: "#000000",
    secondary: "#BABABA",
    rule: "#E5E5E5",
    accentSoft: "#454545",
    secondarySoft: "#D8D8D8",
    panel: "#FAFAFA",
  },
  // dark mode — charcoal background, warm orange accent
  dusk: {
    name: "dusk",
    bg: "#14130F",
    ink: "#F2E9DA",
    muted: "#9C9385",
    accent: "#E58A4A",
    secondary: "#6B6357",
    rule: "#2A2723",
    accentSoft: "#B96F3B",
    secondarySoft: "#4A4540",
    panel: "#1C1A17",
  },
};

export const THEME_NAMES = Object.keys(THEMES);
export const DEFAULT_THEME = "paper";

export function resolveTheme(input?: string | Partial<Theme>): Theme {
  if (!input) return THEMES[DEFAULT_THEME];
  if (typeof input === "string") {
    return THEMES[input] ?? THEMES[DEFAULT_THEME];
  }
  const base = THEMES[input.name ?? DEFAULT_THEME] ?? THEMES[DEFAULT_THEME];
  return { ...base, ...input };
}
