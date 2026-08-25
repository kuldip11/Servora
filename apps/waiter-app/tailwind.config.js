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
      // Pre-existing call site (`shadow-elevated`) — kept as-is, not
      // migrated onto `--shadow-*` yet (that's a Phase 2+ concern).
      boxShadow: {
        elevated:
          "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};
