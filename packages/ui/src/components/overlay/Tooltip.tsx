import type { ReactNode } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../../utils/cn";

export interface TooltipProps {
  trigger: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  align?: "start" | "center" | "end" | undefined;
}

/**
 * Hover/focus hint text. Built on `@radix-ui/react-tooltip`, which
 * needs exactly one `TooltipProvider` (also exported here, thin
 * re-export of Radix's own) as an ancestor — it's the thing that makes
 * a second tooltip open instantly instead of waiting out the hover
 * delay again right after the first one closes.
 *
 * **Correction (Session 10, docs/accessibility): this comment
 * previously said "not wired into any app's `main.tsx`, no real call
 * site yet" — that's stale.** `Sidebar.tsx` (Phase 6) does render real
 * `Tooltip`s, for its collapsed-state item labels, and deliberately
 * mounts its own `TooltipProvider` scoped to itself rather than
 * requiring a global one in every app's `main.tsx` (see `Sidebar.tsx`'s
 * own doc comment — nesting `TooltipProvider`s is Radix-supported). A
 * consumer reaching for `Tooltip` directly (outside `Sidebar`) still
 * needs its own `TooltipProvider` ancestor if one isn't already
 * present higher up — that part of the original caveat still holds,
 * just not the "zero real usage" framing.
 */
/** Phase 8: same side-aware fade+zoom+slide idea as `menuContentClasses`
 * (`overlay/shared.tsx`) — kept as a separate constant rather than
 * importing that one, since `Tooltip` doesn't share `menuContentClasses`'
 * bordered-surface/padding shape (a tooltip is a small dark pill, not a
 * menu panel) and importing just for the animation classes would pull in
 * an implied visual relationship that isn't really there. `duration-fast`
 * both ways — tooltips are the smallest, most frequent overlay in the
 * system, so they should feel closer to instant than any other. */
const tooltipAnimationClasses = cn(
  // Radix Tooltip's open state is `delayed-open` (hover, after the delay)
  // or `instant-open` (focus) — never a bare `open` the way Dialog/menus
  // use. Both need the animation, or keyboard-focus tooltips would only
  // ever fade in via the hover path and pop in instantly on focus.
  "data-[state=delayed-open]:animate-in data-[state=instant-open]:animate-in",
  "data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:fade-in-0",
  "data-[state=delayed-open]:zoom-in-95 data-[state=instant-open]:zoom-in-95",
  "data-[state=delayed-open]:duration-fast data-[state=instant-open]:duration-fast",
  "data-[state=delayed-open]:ease-decelerate data-[state=instant-open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
  "data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
);

/**
 * Phase 9 (Accessibility Hardening) fix: this used to render
 * `bg-text-primary ... text-white`. `--text-primary` is theme-reactive —
 * it's `#111827` (near-black) in light/high-contrast but `#f9fafb`
 * (near-white) in dark theme (see `theme/tokens.css`). So in dark theme
 * this rendered a near-white pill with white text: contrast ~1:1,
 * effectively invisible. `bg-gray-900`/`fill-gray-900` are fixed values,
 * not tokens, on purpose — a tooltip is meant to always be "a small dark
 * pill" per the animation doc comment below regardless of active theme,
 * the same reasoning `SkeletonLoader`'s shimmer highlight (Phase 8
 * detail, README) already used for a non-theme-conditional color.
 */
export function Tooltip({
  trigger,
  content,
  side = "top",
  align = "center",
}: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{trigger}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-dropdown",
            "max-w-xs",
            tooltipAnimationClasses,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-gray-900" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
