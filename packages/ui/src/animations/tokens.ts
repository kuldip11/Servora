/**
 * Motion tokens — Phase 8 (docs/design-system/00-PLAN.md).
 *
 * Single source of truth for durations and easings, the same role
 * `theme/tokens.css` plays for color/radius/shadow/spacing (Phase 1).
 * These values are mirrored into `tailwind-preset.js`'s
 * `transitionDuration` / `transitionTimingFunction` so every app gets
 * `duration-fast` / `ease-decelerate` etc. as real Tailwind utilities
 * — this file is what to change if a value ever needs to move, not
 * the preset (the preset just re-exports these as strings, since
 * Tailwind config can't import `.ts` at build time in this project's
 * plain-JS preset — see the "kept in sync manually" note there).
 *
 * Values aren't invented: 150ms/200ms sit in the conventional range
 * for UI micro-interactions (Material Design's own guidance uses
 * 100-300ms for this class of transition), and the four eases below
 * are the standard cubic-bezier curves most design systems converge
 * on (Material, Radix's own docs, etc. — nothing framework-specific
 * makes these "wrong" to reuse here).
 */

export const DURATIONS = {
  /** Micro-feedback only — icon rotation, checkbox tick. */
  instant: 100,
  /** The default for hovers, focus rings, menu items — most `transition-colors` call sites. */
  fast: 150,
  /** Overlays enter/exit, accordion expand/collapse, toasts. */
  base: 200,
  /** Larger surfaces — full-screen dialogs on mobile, page-level transitions. */
  slow: 300,
  /** Deliberately slow — reserved for rare cases (e.g. a celebratory animation), not general UI. */
  slower: 500,
} as const;

export type DurationToken = keyof typeof DURATIONS;

export const EASINGS = {
  /** Default for anything that isn't clearly an enter or an exit (color/shadow hovers). */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Entering elements — starts fast, settles gently. Use for `animate-in`/mount transitions. */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Exiting elements — starts gently, leaves fast. Use for `animate-out`/unmount transitions. */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Playful overshoot — used sparingly (e.g. a success checkmark), never on overlays/menus. */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export type EasingToken = keyof typeof EASINGS;

/** The media query the design system's reduced-motion handling keys off — see `theme/motion.css`. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
