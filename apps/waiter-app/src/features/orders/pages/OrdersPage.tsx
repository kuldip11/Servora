import { useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Spinner, IconButton, EmptyState } from "@pos/ui";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { OrderCard } from "@/features/orders/components/OrderCard";

interface Props {
  onSelectOrder: (id: string) => void;
}

export const OrdersPage = ({ onSelectOrder }: Props) => {
  const [filter, setFilter] = useState<"ready" | "active" | "all">("ready");
  const { data: orders, isLoading, refetch, isFetching } = useOrders();

  const active =
    orders?.filter((o) => ["OPEN", "BILL_REQUESTED"].includes(o.status)) ?? [];
  const ready =
    orders?.filter((o) =>
      o.kitchenTickets?.some((t) => t.status === "READY"),
    ) ?? [];
  const display =
    filter === "ready" ? ready : filter === "active" ? active : (orders ?? []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Orders</h1>
          <p className="mt-0.5 text-xs text-text-secondary">
            {active.length} active · {orders?.length ?? 0} total today
          </p>
        </div>
        {}
        <IconButton
          icon={RefreshCw}
          aria-label="Refresh orders"
          onClick={() => refetch()}
          className={isFetching ? "animate-spin" : ""}
        />
      </div>

      {}
      <div className="flex gap-2 px-4 py-3">
        {(["ready", "active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-10 flex-1 rounded-xl border px-3 text-xs font-semibold transition-colors ${
              filter === f
                ? "border-primary bg-primary-surface text-primary"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {f === "ready"
              ? `Ready ${ready.length}`
              : f === "active"
                ? `Active ${active.length}`
                : "All"}
          </button>
        ))}
      </div>

      {}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6" />
          </div>
        ) : display.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders"
            description={
              filter === "active"
                ? "No active orders right now"
                : filter === "ready"
                  ? "Nothing is waiting to be served"
                  : "No orders placed yet"
            }
          />
        ) : (
          <div className="space-y-2 px-4 pb-5 pt-1">
            {display.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onSelect={onSelectOrder}
                variant="detailed"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
