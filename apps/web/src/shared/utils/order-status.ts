export function getOrderStatusColor(status: string): string {
  // Phase 16 token audit — was raw Tailwind scale colors (bg-blue-100/
  // bg-orange-100/etc.), invisible to theme switching in all 3 consumers
  // (OrderDetailPage, OrdersPage, DashboardPage). PAID keeps the same
  // brand-color intent as `StatusBadge`'s own PAID case (see
  // apps/waiter-app's equivalent) via `--primary`, rather than one of
  // the 4 semantic status tones.
  const map: Record<string, string> = {
    OPEN: "bg-info-surface text-info",
    BILL_REQUESTED: "bg-warning-surface text-warning",
    PAID: "bg-primary-surface text-primary",
    CLOSED: "bg-surface-secondary text-text-secondary",
    CANCELLED: "bg-danger-surface text-danger",
  };
  return map[status] ?? "bg-surface-secondary text-text-secondary";
}

export function getOrderStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
