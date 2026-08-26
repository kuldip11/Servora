import { cn } from "../../utils/cn";
import { CELL_PADDING, type TableDensity } from "./shared";

/**
 * Phase 7 (Part 1) — Skeleton loading primitives. `Skeleton` is the base
 * shimmering rectangle; `SkeletonText`/`SkeletonTable`/`SkeletonCard` are
 * composed shapes for the loading states this phase's other components
 * need (`Table`'s `loading` prop renders `SkeletonTable` internally —
 * see `Table.tsx` — rather than duplicating this row markup there).
 *
 * Phase 8 (Motion System) replaced the plain `animate-pulse` this used to
 * carry with a real shimmer-sweep: a `before:` pseudo-element (a
 * semi-transparent gradient band) translated across the placeholder via
 * the `shimmer` keyframe defined in `tailwind-preset.js`. `overflow-hidden`
 * on the base element clips the band to the skeleton's own shape —
 * without it, the band would visibly spill past rounded corners on `radius`
 * values other than the default. `via-white/20` is a light highlight band
 * regardless of `data-theme` — deliberately not theme-conditional, since
 * this project's `dark`/`high-contrast` themes are chosen via the
 * `data-theme` attribute rather than Tailwind's `dark:` class strategy, so
 * a `dark:` variant class here would silently never apply; a light sweep
 * reads fine as a highlight against both light and dark base surfaces,
 * the same convention most skeleton-loader implementations converge on
 * regardless of their own theme model.
 */

export interface SkeletonProps {
  className?: string | undefined;
  /** @default '1rem' */
  height?: string | undefined;
  /** @default '100%' */
  width?: string | undefined;
  /** @default 'md' — matches most text/badge corners; use 'full' for avatars. */
  radius?: "sm" | "md" | "lg" | "full" | undefined;
}

const RADIUS_CLASSES = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export function Skeleton({
  className,
  height = "1rem",
  width = "100%",
  radius = "md",
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-surface-secondary",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        RADIUS_CLASSES[radius],
        className,
      )}
      style={{ height, width }}
    />
  );
}

export interface SkeletonTextProps {
  /** Number of lines. @default 1 */
  lines?: number | undefined;
  /** Width of the last line, so a multi-line block doesn't look like a solid bar. @default '60%' */
  lastLineWidth?: string | undefined;
  className?: string | undefined;
}

export function SkeletonText({
  lines = 1,
  lastLineWidth = "60%",
  className,
}: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  className?: string | undefined;
  /** Renders a leading avatar-shaped block above the text lines. @default false */
  withMedia?: boolean | undefined;
}

export function SkeletonCard({
  className,
  withMedia = false,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-md border border-border rounded-lg bg-surface",
        className,
      )}
    >
      {withMedia && <Skeleton height="2.5rem" width="2.5rem" radius="full" />}
      <SkeletonText lines={3} />
    </div>
  );
}

export interface SkeletonTableProps {
  rows?: number | undefined;
  columns?: number | undefined;
  density?: TableDensity | undefined;
  className?: string | undefined;
}

/**
 * Row/column-shaped skeleton, sized to roughly match a real `Table` row so the
 * loading→loaded transition doesn't visibly reflow. Shared by `Table`'s
 * `loading` prop and available standalone for any other data-fetch-in-progress
 * surface that isn't built on `Table` (e.g. a card grid that wants a table-like
 * loading placeholder before its first real render decides the layout).
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  density = "comfortable",
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            "flex items-center gap-4 border-b border-divider last:border-b-0",
            CELL_PADDING[density],
          )}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="0.875rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
