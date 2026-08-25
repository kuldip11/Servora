import { StatusBadge as SharedStatusBadge, type StatusTone } from "@pos/ui";
import { STATUS_CONFIG } from "../constants";

// Reuses the exact OPEN/BILL_REQUESTED/CLOSED/CANCELLED→tone map
// apps/web/src/features/orders/pages/OrdersPage.tsx (Phase 7) already
// established for this same status enum, so Admin and Waiter App agree
// on what each order status means — the shared `StatusBadge` primitive
// (Phase 3) was built for exactly this: collapsing the 3 independent
// status-badge implementations the Phase 0 audit found (Admin's menu
// status, this one, and Kitchen Display's inline ticket colors, the
// last still tracked under Phase 12). This was the 2nd of those 3.
//
// PAID is intentionally NOT mapped onto the shared `StatusBadge`'s 5
// semantic tones (Phase 3/Phase 7/Sprint AD-7/AD-8 each carried this
// forward rather than re-litigate it) — it's brand-colored, not a
// success/warning/danger/info/neutral state. Phase 16: that brand
// color now has a real theme token (`--primary`), so the previously
// hardcoded `bg-violet-100 text-violet-700` below is migrated onto
// it rather than left unresolved a fifth time.
const STATUS_TONE: Record<string, StatusTone> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const tone = STATUS_TONE[status];

  if (cfg && tone) {
    return <SharedStatusBadge label={cfg.label} tone={tone} />;
  }

  if (status === "PAID") {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-surface text-primary">
        {cfg?.label ?? "Paid"}
      </span>
    );
  }

  // Unknown status — same gray fallback the original component had.
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-secondary text-text-secondary">
      {cfg?.label ?? status}
    </span>
  );
}
