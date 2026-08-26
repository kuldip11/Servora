import {
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChefHat,
} from "lucide-react";
import {
  StatCard,
  Card,
  Grid,
  Page,
  PageHeader,
  StatusBadge,
  Badge,
} from "@pos/ui";
import { formatCurrency, formatTime } from "../../../shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "../../../shared/utils/order-status";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useDashboardRealtimeSync } from "../hooks/useDashboardRealtimeSync";
import { useOrders } from "../../orders/hooks/useOrders";

// **Correction to the audit's migration-map note, not a silent
// reinterpretation:** `phase-0-ui-audit.md` describes this page as
// "Charts (Recharts) plus a reused `useOrders({status:'OPEN'})` list."
// Grepping this page (and the rest of `apps/web/src`) turns up zero
// imports of `recharts` anywhere — there's no chart here, and never was
// one in this pass of the repo. The Recharts-theming work the audit's
// note anticipated ("Chart theming will need to consume the same token
// set once Phase 1 lands") has no actual call site to apply it to.
// Flagged in Phase 13 as a dead-dependency candidate rather than
// removed on the spot (that pass's own scope was the Component
// Duplication Map, not a dependency audit); Phase 14's bundle analysis
// confirmed it — zero references repo-wide, not just this page — and
// removed `recharts` from `apps/web/package.json`.

// Same `STATUS_TONE` convention `OrdersPage`'s Phase 7 migration
// already established (see that file's doc comment) — reused verbatim
// rather than re-derived, so the two places in Admin that render an
// order-status badge agree on what color means what. `PAID` is
// intentionally omitted for the same open, not-silently-resolved
// reason: `getOrderStatusColor` renders it as brand violet, which
// doesn't map onto any of `StatusBadge`'s 5 semantic tones any better
// here than it did in `OrdersPage` or the Waiter App's own status
// badge (flagged since Phase 3). In practice this page's query
// (`useOrders({ status: 'OPEN' })`) only ever returns `OPEN` orders, so
// the `PAID` case can't actually render today — the map stays complete
// against the full status enum anyway, matching `OrdersPage`'s own
// defensive convention rather than narrowing it to "whatever this one
// query happens to return right now."
const STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
  // PAID intentionally omitted — see comment above.
};

const QUICK_ACTIONS = [
  {
    label: "New Order",
    icon: ShoppingBag,
    href: "/orders",
    color: "bg-violet-600",
  },
  {
    label: "Kitchen Queue",
    icon: ChefHat,
    href: "/orders?view=kitchen",
    color: "bg-amber-500",
  },
  {
    label: "Inventory",
    icon: Package,
    href: "/inventory",
    color: "bg-emerald-600",
  },
  {
    label: "Low Stock",
    icon: AlertTriangle,
    href: "/inventory?filter=low",
    color: "bg-red-500",
  },
];

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activeOrders } = useOrders({ status: "OPEN" });
  useDashboardRealtimeSync();

  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your restaurant"
      />

      {/* Stats */}
      {statsLoading ? (
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="h-28 animate-pulse" />
          ))}
        </Grid>
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
          <StatCard
            title="Orders Today"
            value={stats?.totalOrdersToday ?? 0}
            icon={ShoppingBag}
            color="violet"
            subtitle="Total orders placed today"
          />
          <StatCard
            title="Revenue Today"
            value={formatCurrency(stats?.revenueToday ?? 0)}
            icon={TrendingUp}
            color="emerald"
            subtitle="From paid orders"
          />
          <StatCard
            title="Active Orders"
            value={stats?.activeOrders ?? 0}
            icon={Clock}
            color="amber"
            subtitle="Currently in progress"
          />
          <StatCard
            title="Low Stock Alerts"
            value={stats?.lowStockAlerts ?? 0}
            icon={AlertTriangle}
            color={stats?.lowStockAlerts ? "red" : "emerald"}
            subtitle="Items below threshold"
          />
        </Grid>
      )}

      {/* Active Orders */}
      <Grid columns={{ base: 1, lg: 2 }} gap="lg">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">
              Active Orders
            </h2>
            <Badge variant="info">{activeOrders?.length ?? 0} orders</Badge>
          </div>
          {!activeOrders?.length ? (
            <div className="text-center py-8 text-text-disabled">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active orders right now</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeOrders.map((order) => {
                const tone = STATUS_TONE[order.status];
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-md bg-surface-secondary hover:bg-border transition-colors duration-fast ease-standard"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Order #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {order.items?.length ?? 0} items ·{" "}
                        {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tone ? (
                        <StatusBadge
                          tone={tone}
                          label={getOrderStatusLabel(order.status)}
                        />
                      ) : (
                        // PAID — no semantic tone maps onto brand violet, see file-level comment above.
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:shadow-md transition-all duration-fast ease-standard"
                >
                  <div
                    className={`w-9 h-9 ${action.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    {action.label}
                  </span>
                </a>
              );
            })}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}
