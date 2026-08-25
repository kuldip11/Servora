import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../Button";

/**
 * Phase 7 (Part 1) — `FilterBar`. A layout wrapper for the row of
 * search/select/date-range controls list pages put above their table
 * (see `apps/web/src/features/orders/pages/OrdersPage.tsx`'s current
 * hand-rolled `<div className="flex items-center gap-3 flex-wrap">`
 * for the pattern this replaces). Deliberately not opinionated about
 * *which* controls it holds — pass `SearchInput`/`SelectMenu`/whatever
 * as `children`; `FilterBar` only owns the wrap/gap layout and the
 * optional "Clear filters" affordance.
 *
 * `onClearAll` is omitted (not just disabled) when there's nothing to
 * clear, rather than always rendering it and toggling `disabled` — an
 * always-visible-but-disabled clear button invites clicking it to see
 * what happens, which is worse than it simply not being there yet.
 */

export interface FilterBarProps {
  children: ReactNode;
  /** Show a trailing "Clear filters" button. Omit entirely when no filter is active. */
  onClearAll?: (() => void) | undefined;
  className?: string | undefined;
}

export function FilterBar({ children, onClearAll, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {children}
      {onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          <X aria-hidden="true" className="w-3.5 h-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
