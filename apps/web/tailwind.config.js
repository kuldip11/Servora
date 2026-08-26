/** @type {import('tailwindcss').Config} */
import uiPreset from "../../packages/ui/tailwind-preset.js";

export default {
  presets: [uiPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // App-specific extras not covered by the shared preset. The old
      // `brand` (fuchsia) scale lived here too, but it was dead config —
      // every component actually used Tailwind's built-in `violet`
      // directly, which is now `--primary` in the shared token set.
      // Named shadows below are pre-existing call sites (`shadow-card`,
      // `shadow-elevated`) — kept as-is; Phase 1 doesn't touch component
      // internals, so these aren't migrated onto `--shadow-*` yet.
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        elevated:
          "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
        dropdown:
          "0 4px 16px -2px rgb(0 0 0 / 0.12), 0 2px 6px -1px rgb(0 0 0 / 0.06)",
      },
      spacing: {
        4.5: "1.125rem",
        13: "3.25rem",
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
