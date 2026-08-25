import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import { SkipLink } from "../navigation/SkipLink";

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** e.g. a `Sidebar` (Phase 6). Omit for apps with no persistent side nav. */
  sidebar?: ReactNode;
  /** e.g. a `TopNav` (Phase 6). Omit for apps with no top bar. */
  topbar?: ReactNode;
  /** e.g. a `BottomNav` (Phase 6) — Waiter App's pattern. */
  bottombar?: ReactNode;
  /** Fixed width of the `sidebar` slot on screens where it's shown. @default '256px' */
  sidebarWidth?: string;
  /**
   * Renders a "Skip to main content" link as the first focusable element,
   * jumping keyboard focus straight to `children`'s landmark (WCAG 2.4.1).
   * Set `false` only if the consuming page already renders its own skip
   * link (e.g. a custom auth-screen layout that doesn't use `AppShell`).
   * @default true
   */
  skipLink?: boolean;
}

/**
 * Structural frame only — full-height viewport, fixed sidebar/topbar/
 * bottombar slots around a scrolling content area. Doesn't render any
 * navigation itself (that's Phase 6's `Sidebar`/`TopNav`/`BottomNav`);
 * this just gives every app the same shell shape to slot them into.
 *
 * Phase 8 (Motion System) added `transition-[width]` to the sidebar
 * slot: `Sidebar`'s own collapse toggle only flips its internal
 * `collapsed` boolean (`Sidebar.tsx`), the actual width change is the
 * consuming app's job (pass a narrower `sidebarWidth` when
 * `collapsed` is true) — this transition is what makes that width
 * change animate instead of snapping, regardless of which app wires
 * it up.
 */
export function AppShell({
  children,
  sidebar,
  topbar,
  bottombar,
  sidebarWidth = "256px",
  skipLink = true,
  className,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn("min-h-screen bg-background flex", className)}
      {...props}
    >
      {skipLink && <SkipLink />}

      {sidebar && (
        <aside
          className="hidden lg:block shrink-0 border-r border-border bg-surface transition-[width] duration-base ease-standard"
          style={{ width: sidebarWidth }}
        >
          {sidebar}
        </aside>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {topbar && (
          <header className="shrink-0 border-b border-border bg-surface">
            {topbar}
          </header>
        )}

        {/*
         * `id` is the SkipLink's jump target; `tabIndex={-1}` makes it
         * programmatically focusable (so focus visibly *moves* here, not
         * just the viewport scrolling) without adding it to the natural
         * Tab order — a plain `<main>` can't receive focus at all in most
         * browsers, so this is required, not decorative. `outline-none`
         * here is intentional and safe: this element only ever receives
         * *programmatic* focus (never a real keyboard Tab stop, since
         * tabIndex={-1} skips it), so there is no visible-focus-indicator
         * requirement to satisfy — unlike every genuinely tabbable
         * element in this codebase, which must keep its focus ring.
         */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto outline-none"
        >
          {children}
        </main>

        {bottombar && (
          <footer
            className="shrink-0 border-t border-border bg-surface"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {bottombar}
          </footer>
        )}
      </div>
    </div>
  );
}
