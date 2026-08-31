

export const DURATIONS = {

  instant: 100,

  fast: 150,

  base: 200,

  slow: 300,

  slower: 500,
} as const;

export type DurationToken = keyof typeof DURATIONS;

export const EASINGS = {

  standard: "cubic-bezier(0.4, 0, 0.2, 1)",

  decelerate: "cubic-bezier(0, 0, 0.2, 1)",

  accelerate: "cubic-bezier(0.4, 0, 1, 1)",

  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export type EasingToken = keyof typeof EASINGS;

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
