import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The built site is published from the gh-pages branch at
// https://shuakami.github.io/paperchart/ so we need the base path
// when running `vite build`. Dev server keeps the default "/" root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/paperchart/" : "/",
  plugins: [react()],
}));
