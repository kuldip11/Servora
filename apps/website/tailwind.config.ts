import type { Config } from "tailwindcss";
import preset from "../../packages/ui/tailwind-preset.js";

const config: Config = {
  presets: [preset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
};

export default config;
