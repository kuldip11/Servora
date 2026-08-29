import {
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  RefreshCw,
  CircleDollarSign,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  StatCard,
  Card,
  Grid,
  Page,
  PageHeader,
  StatusBadge,
  Badge,
  Button,
  SkeletonCard,
} from "@pos/ui";
import { formatCurrency, formatTime } from "../../../shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "../../../shared/utils/order-status";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useDashboardRealtimeSync } from "../hooks/useDashboardRealtimeSync";
import { useOrders } from "../../orders/hooks/useOrders";
import { useAuthStore } from "../../../store/auth";

const STATUS_TONE: Partial<
  Record<string, "info" | "warning" | "neutral" | "danger">
> = {
  OPEN: "info",
  BILL_REQUESTED: "warning",
  CLOSED: "neutral",
  CANCELLED: "danger",
};

const QUICK_ACTIONS = [
  { label: "New Order", icon: ShoppingBag, to: "/orders" as const },
  {
    label: "Kitchen Queue",
    icon: ChefHat,
    to: "/orders" as const,
    search: { view: "kitchen" },
  },
  { label: "Inventory", icon: Package, to: "/inventory" as const },
  {
    label: "Low Stock",
    icon: AlertTriangle,
    to: "/inventory" as const,
    search: { filter: "low" },
  },
];

export function DashboardPage() {
  const branchId = useAuthStore((state) => state.branchId);
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
    isFetching: statsFetching,
  } = useDashboardStats();
  const {
    data: activeOrders,
    isLoading: activeOrdersLoading,
    isError: activeOrdersError,
    refetch: refetchOrders,
  } = useOrders({ status: "OPEN" });
  useDashboardRealtimeSync();

  const scopeLabel = branchId === "all" ? "All branches" : "Selected branch";
  const hasAttention =
    (stats?.lowStockAlerts ?? 0) > 0 || (stats?.activeOrders ?? 0) > 0;

  return (
    <Page>
      <PageHeader
        title="Owner dashboard"
        description="Live sales, orders, and operational signals for the current restaurant scope."
        actions={<Badge variant="info">{scopeLabel}</Badge>}
      />

      {statsError ? (
        <Card className="border-danger/30 bg-danger-surface">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-danger">
                Dashboard data is temporarily unavailable
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Your operational pages are still available. Retry the owner
                summary when ready.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => void refetchStats()}
              disabled={statsFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      ) : null}

      {statsLoading ? (
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </Grid>
      ) : (
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap="md">
          <StatCard
            title="Orders today"
            value={stats?.totalOrdersToday ?? 0}
            icon={ShoppingBag}
            color="violet"
            subtitle="Placed since start of day"
          />
          <StatCard
            title="Revenue today"
            value={formatCurrency(stats?.revenueToday ?? 0)}
            icon={CircleDollarSign}
            color="emerald"
            subtitle="Captured from paid orders"
          />
          <StatCard
            title="Active orders"
            value={stats?.activeOrders ?? 0}
            icon={Clock}
            color="amber"
            subtitle="Currently in progress"
          />
          <StatCard
            title="Low stock"
            value={stats?.lowStockAlerts ?? 0}
            icon={AlertTriangle}
            color={stats?.lowStockAlerts ? "red" : "emerald"}
            subtitle="Items below threshold"
          />
        </Grid>
      )}

      {!statsLoading && !statsError ? (
        <Grid columns={{ base: 1, sm: 3 }} gap="md">
          <StatCard
            title="Average order"
            value={formatCurrency(stats?.averageOrderValue ?? 0)}
            icon={TrendingUp}
            color="violet"
            subtitle="Paid orders today"
          />
          <StatCard
            title="Paid orders"
            value={stats?.paidOrdersToday ?? 0}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Completed payments today"
          />
          <StatCard
            title="Cancelled"
            value={stats?.cancelledOrdersToday ?? 0}
            icon={AlertTriangle}
            color={stats?.cancelledOrdersToday ? "red" : "emerald"}
            subtitle="Cancelled today"
          />
        </Grid>
      ) : null}

      {!statsLoading && !statsError ? (
        <Card className={hasAttention ? "border-warning/30" : undefined}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${hasAttention ? "bg-warning-surface text-warning" : "bg-success-surface text-success"}`}
              >
                {hasAttention ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  {hasAttention
                    ? "Operations need attention"
                    : "Operations look clear"}
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  {(stats?.activeOrders ?? 0) > 0
                    ? `${stats?.activeOrders ?? 0} active order${stats?.activeOrders === 1 ? "" : "s"}`
                    : "No active orders"}
                  {" · "}
                  {(stats?.lowStockAlerts ?? 0) > 0
                    ? `${stats?.lowStockAlerts ?? 0} low-stock alert${stats?.lowStockAlerts === 1 ? "" : "s"}`
                    : "No low-stock alerts"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/orders"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
              >
                Review orders
              </Link>
              <Link
                to="/inventory"
                className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
              >
                Review inventory
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <Grid columns={{ base: 1, lg: 2 }} gap="lg">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Top selling items
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Today in {scopeLabel.toLowerCase()}
              </p>
            </div>
            <Badge variant="success">Live</Badge>
          </div>
          {!stats?.topItems?.length ? (
            <p className="py-8 text-center text-sm text-text-disabled">
              No item sales yet today
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-surface text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.count} sold
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Revenue by hour
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Paid revenue today
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          {!stats?.revenueByHour?.length ? (
            <p className="py-8 text-center text-sm text-text-disabled">
              No paid revenue yet today
            </p>
          ) : (
            <div className="space-y-3">
              {stats.revenueByHour.map((point) => {
                const max = Math.max(
                  ...stats.revenueByHour.map((entry) => entry.revenue),
                  1,
                );
                const width = Math.max(
                  4,
                  Math.round((point.revenue / max) * 100),
                );
                return (
                  <div
                    key={point.hour}
                    className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 text-xs"
                  >
                    <span className="text-text-secondary">
                      {String(point.hour).padStart(2, "0")}:00
                    </span>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-surface-secondary"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-fast"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(point.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Grid>

      <Grid columns={{ base: 1, lg: 2 }} gap="lg">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Active orders
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Orders that still need operational follow-through
              </p>
            </div>
            <Badge variant="info">{activeOrders?.length ?? 0} orders</Badge>
          </div>
          {activeOrdersLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : activeOrdersError ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">
                Active orders could not be loaded.
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                onClick={() => void refetchOrders()}
              >
                Retry orders
              </Button>
            </div>
          ) : !activeOrders?.length ? (
            <div className="py-8 text-center text-text-disabled">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">No active orders right now</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeOrders.slice(0, 5).map((order) => {
                const tone = STATUS_TONE[order.status];
                return (
                  <Link
                    key={order.id}
                    to="/orders/$orderId"
                    params={{ orderId: order.id }}
                    className="flex items-center justify-between gap-4 rounded-md bg-surface-secondary p-3 transition-colors duration-fast ease-standard hover:bg-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        Order #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {order.items?.length ?? 0} items ·{" "}
                        {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {tone ? (
                        <StatusBadge
                          tone={tone}
                          label={getOrderStatusLabel(order.status)}
                        />
                      ) : (
                        <Badge className={getOrderStatusColor(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      )}
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {activeOrders.length > 5 ? (
                <Link
                  to="/orders"
                  className="flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
                >
                  View all active orders <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-text-primary">
              Quick actions
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Jump straight into the workflows owners and managers use most.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  search={action.search as never}
                  className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-all duration-fast ease-standard hover:border-primary/30 hover:bg-primary-surface/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary transition-colors group-hover:bg-primary-surface group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-text-primary">
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-text-disabled transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </Card>
      </Grid>
    </Page>
  );
}
