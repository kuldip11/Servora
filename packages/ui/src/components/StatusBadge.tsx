import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  info: "bg-info-surface text-info",
  neutral: "bg-surface-secondary text-text-secondary",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-text-disabled",
};

export interface StatusBadgeProps {
  label: ReactNode;
  /** @default 'neutral' */
  tone?: StatusTone;
  /** @default true */
  dot?: boolean;
  className?: string;
}

/**
 * Generic status→tone primitive (docs/design-system/00-PLAN.md Phase 3;
 * decided in the Phase 0 audit's duplication findings). Collapses the
 * 3 independent status-badge implementations the audit found — Admin's
 * menu-item `StatusBadge`, Waiter App's order `StatusBadge`, and Kitchen
 * Display's inline `TicketCard`/`KitchenBoard` status colors — into one
 * shared rendering component. Each domain keeps its own status
 * enum→tone map; only the markup/color logic is now shared.
 *
 * Migrated onto this: `apps/web/src/features/menu/components/StatusBadge.tsx`
 * (exact tone-for-variant swap, zero visual change — its existing 5
 * statuses already matched this component's 5 tones 1:1).
 *
 * Not yet migrated, on purpose:
 * - `apps/waiter-app/src/features/orders/components/StatusBadge.tsx` —
 *   its `PAID` status is rendered violet today, which doesn't correspond
 *   to any of these 5 semantic tones without either changing that
 *   status's color or adding a 6th "brand" tone. That's a product call,
 *   not a mechanical rename, so it's left for whoever owns that
 *   decision rather than made silently here.
 * - Kitchen Display's inline colors — tracked under Phase 12 (KDS app
 *   migration) along with everything else bespoke in that app.
 */
export function StatusBadge({
  label,
  tone = "neutral",
  dot = true,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", DOT_CLASSES[tone])}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
