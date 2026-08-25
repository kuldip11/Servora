/**
 * Shared Tailwind preset — maps semantic design tokens (packages/ui/src/theme/tokens.css)
 * onto Tailwind's theme. Each app does `presets: [uiPreset]` in its own
 * tailwind.config.js instead of hand-defining (and drifting on) its own
 * color/radius/shadow/spacing scales.
 *
 * These resolve to CSS variables, not fixed values, so switching
 * `data-theme` (light/dark/high-contrast) repaints every class built
 * from this preset with zero component code changes.
 *
 * See docs/design-system/README.md "Phase 1 detail".
 *
 * Phase 8 (Motion System) added `transitionDuration`/
 * `transitionTimingFunction` below, plus the `tailwindcss-animate`
 * plugin. Durations/easings are numbers/cubic-beziers, not colors, so
 * they don't fit the CSS-custom-property pattern the rest of this
 * file uses — `packages/ui/src/animations/tokens.ts` is their real
 * source of truth (JS-importable, e.g. for a component that needs the
 * raw millisecond number), and the values below are kept in sync with
 * it by hand, since this plain-JS preset can't import a `.ts` file at
 * Tailwind-config-load time. If the two ever drift, `tokens.ts` wins.
 */

import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      transitionDuration: {
        instant: "100ms",
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
        slower: "500ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        // Radix Accordion exposes its measured content height as a CSS
        // var (`--radix-accordion-content-height`) precisely so a real
        // height animation (not just instant show/hide) is possible —
        // `tailwindcss-animate`'s own keyframe set doesn't include this
        // one (it's Accordion-specific, not a generic enter/exit), so
        // it's defined here rather than left for `Accordion.tsx` to
        // reinvent inline.
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Skeleton shimmer-sweep (`SkeletonLoader.tsx`) — a highlight
        // band translated across the placeholder via a `before:`
        // pseudo-element, rather than `tailwindcss-animate`'s
        // fade/zoom/slide set which is built for enter/exit, not a
        // continuously-looping effect.
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 200ms ease-out",
        "accordion-up": "accordion-up 200ms ease-out",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          disabled: "var(--text-disabled)",
        },
        border: "var(--border)",
        divider: "var(--divider)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          surface: "var(--primary-surface)",
          border: "var(--primary-border)",
          // Phase 9: the text color to put ON a `bg-primary` surface — white
          // in light/high-contrast, dark ink in dark theme (its amber
          // primary fails AA with white). See tokens.css's `--primary-foreground`
          // comment for the measured contrast ratios behind this.
          foreground: "var(--primary-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          surface: "var(--success-surface)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          surface: "var(--warning-surface)",
          foreground: "var(--warning-foreground)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          surface: "var(--danger-surface)",
          foreground: "var(--danger-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          surface: "var(--info-surface)",
          foreground: "var(--info-foreground)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        dropdown: "var(--shadow-dropdown)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  // `presets` consumers (every app's tailwind.config.js does
  // `presets: [uiPreset]`) get this `plugins` array merged with their
  // own automatically — Tailwind's documented preset-merging behavior,
  // not something each app needs to repeat. `tailwindcss-animate`
  // supplies the generic `animate-in`/`animate-out` + `fade-*`/
  // `zoom-*`/`slide-*` utility classes every overlay component (Phase
  // 5) keys off `data-[state=open|closed]` — see `overlay/shared.tsx`.
  plugins: [tailwindcssAnimate],
};
