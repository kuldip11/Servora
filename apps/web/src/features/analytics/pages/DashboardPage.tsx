import { useMemo, useState } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  CircleDollarSign,
  ShoppingBag,
  AlertTriangle,
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
import { formatCurrency, formatTime } from "@/shared/utils/format";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "@/shared/utils/order-status";
import { useDashboardStats } from "@/features/analytics/hooks/useDashboardStats";
import { useDashboardRealtimeSync } from "@/features/analytics/hooks/useDashboardRealtimeSync";
import { useCostMarginReport } from "@/features/analytics/hooks/useCostMarginReport";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { useAuthStore } from "@/store/auth";

import {
  ANALYTICS_STATUS_TONE,
  DASHBOARD_QUICK_ACTIONS,
} from "@/features/analytics/constants";

export const DashboardPage = () => {
  const branchId = useAuthStore((state) => state.branchId);
  const [marginCategory, setMarginCategory] = useState("all");
  const [marginSort, setMarginSort] = useState<"high" | "low">("high");
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
  } = useOrders({ status: "OPEN", limit: 100 });
  useDashboardRealtimeSync();
  const { data: costMargins, isLoading: costMarginsLoading } =
    useCostMarginReport({
      enabled: branchId !== "all",
    });
  const marginCategories = useMemo(
    () =>
      Array.from(
        new Map(
          (costMargins ?? []).map((row) => [row.categoryId, row.categoryName]),
        ).entries(),
      ),
    [costMargins],
  );
  const visibleMargins = useMemo(() => {
    const rows = (costMargins ?? []).filter(
      (row) => marginCategory === "all" || row.categoryId === marginCategory,
    );
    return [...rows].sort((a, b) => {
      if (a.marginPercent === null) return 1;
      if (b.marginPercent === null) return -1;
      return marginSort === "high"
        ? b.marginPercent - a.marginPercent
        : a.marginPercent - b.marginPercent;
    });
  }, [costMargins, marginCategory, marginSort]);

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

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Recipe cost & margin
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Current authoritative selling price minus recipe cost, including
              variant scope, sub-recipes and yield.
            </p>
          </div>
          {branchId !== "all" ? (
            <div className="flex gap-2">
              <select
                aria-label="Filter margin report by category"
                value={marginCategory}
                onChange={(event) => setMarginCategory(event.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary"
              >
                <option value="all">All categories</option>
                {marginCategories.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Sort margin report"
                value={marginSort}
                onChange={(event) =>
                  setMarginSort(event.target.value as "high" | "low")
                }
                className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary"
              >
                <option value="high">Margin: high to low</option>
                <option value="low">Margin: low to high</option>
              </select>
            </div>
          ) : null}
        </div>
        {branchId === "all" ? (
          <p className="py-8 text-center text-sm text-text-disabled">
            Select a branch to calculate inventory-backed recipe cost and
            margin.
          </p>
        ) : costMarginsLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !visibleMargins.length ? (
          <p className="py-8 text-center text-sm text-text-disabled">
            No menu items to report yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-text-secondary">
                <tr>
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3 text-right">Price</th>
                  <th className="py-2 pr-3 text-right">Cost</th>
                  <th className="py-2 pr-3 text-right">Margin</th>
                  <th className="py-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleMargins.map((row) => (
                  <tr key={`${row.menuItemId}:${row.variantId ?? "base"}`}>
                    <td className="py-2.5 pr-3 font-medium text-text-primary">
                      {row.menuItemName}
                      {row.variantName ? (
                        <span className="ml-1 text-xs font-normal text-text-secondary">
                          · {row.variantName}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-text-secondary">
                      {row.categoryName}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      {formatCurrency(row.price)}
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      {row.cost === null ? "—" : formatCurrency(row.cost)}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-medium">
                      {row.margin === null ? "—" : formatCurrency(row.margin)}
                    </td>
                    <td className="py-2.5 text-right">
                      {row.marginPercent === null ? (
                        <Badge variant="warning">Cost not configured</Badge>
                      ) : (
                        <Badge
                          variant={
                            row.marginPercent >= 50
                              ? "success"
                              : row.marginPercent >= 25
                                ? "warning"
                                : "danger"
                          }
                        >
                          {row.marginPercent.toFixed(1)}%
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
                const tone = ANALYTICS_STATUS_TONE[order.status];
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
            {DASHBOARD_QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  search={
                    ("search" in action ? action.search : undefined) as never
                  }
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
};
