import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

const PADDING = {
  none: "p-0",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional so `Card` can double as an empty loading-skeleton block
   * (`<Card className="h-28 animate-pulse" />`, used by `DashboardPage`/
   * `BranchesPage`/`TablesPage`) without a caller having to pass
   * `children={null}` explicitly just to satisfy the type. */
  children?: ReactNode;
  /** @default 'lg' — matches the previous `.card` class's `p-6`. */
  padding?: keyof typeof PADDING;
  /** Adds hover elevation + pointer cursor, for cards that act as buttons/links. */
  interactive?: boolean;
  as?: ElementType;
}

/**
 * Upgraded for Phase 2: consumes `--surface`/`--border`/`--shadow-sm`/
 * `--radius-lg` tokens instead of the old hardcoded `.card` class
 * (`bg-white border-gray-100 shadow-card`). Same visual result in the
 * light theme today — the values these tokens hold are pulled 1:1 from
 * that old class — but this version now repaints correctly under
 * `data-theme="dark"`/`"high-contrast"`.
 *
 * Note: the raw `.card` CSS utility class in each app's `index.css`
 * (still used directly by e.g. `StatCard`) is untouched by this change
 * — only this component's own markup was migrated onto tokens.
 */
export function Card({
  children,
  padding = "lg",
  interactive = false,
  as: Tag = "div",
  className,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-surface border border-border rounded-lg shadow-sm",
        PADDING[padding],
        interactive &&
          "transition-shadow duration-base ease-standard hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
