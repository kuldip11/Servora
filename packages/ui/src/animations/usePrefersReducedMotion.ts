import { useSyncExternalStore } from "react";
import { REDUCED_MOTION_QUERY } from "./tokens";

/**
 * The `theme/motion.css` global media-query override (Phase 8) is what
 * actually neutralizes CSS `animation`/`transition` durations for
 * every component automatically — nothing needs to read this hook
 * just to get that. This hook exists for the smaller set of cases
 * where motion is driven from JS rather than CSS classes alone (e.g.
 * skipping a `scrollIntoView({ behavior: 'smooth' })` call, or
 * choosing whether to run an imperative animation library call at
 * all) and the component needs to *know*, not just have the CSS
 * quietly shortened underneath it.
 *
 * `useSyncExternalStore` (same primitive `Toast.tsx`'s pub/sub already
 * uses) rather than `useState`+`useEffect` — this is external browser
 * state, which is exactly what that hook is for, and it avoids the
 * extra render-then-correct flash `useEffect` would introduce on
 * first paint.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}
