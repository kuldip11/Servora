import { useState } from "react";
import { ClipboardList, RefreshCw, Bell } from "lucide-react";
import { Spinner, IconButton, EmptyState } from "@pos/ui";
import { useOrders } from "../hooks/useOrders";
import { OrderCard } from "../components/OrderCard";

interface Props {
  onSelectOrder: (id: string) => void;
}

export function OrdersPage({ onSelectOrder }: Props) {
  const [filter, setFilter] = useState<"active" | "all">("active");
  const { data: orders, isLoading, refetch, isFetching } = useOrders();

  const active =
    orders?.filter((o) => ["OPEN", "BILL_REQUESTED"].includes(o.status)) ?? [];
  const ready =
    orders?.filter((o) =>
      o.kitchenTickets?.some((t) => t.status === "READY"),
    ) ?? [];
  const display = filter === "active" ? active : (orders ?? []);

  return (
    <div className="flex flex-col h-full">
      {            }
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div>
          <h2 className="font-bold text-text-primary">Orders</h2>
          <p className="text-xs text-text-disabled">
            {orders?.length ?? 0} total today
          </p>
        </div>
        {

                                                                       }
        <IconButton
          icon={RefreshCw}
          aria-label="Refresh orders"
          onClick={() => refetch()}
          className={isFetching ? "animate-spin" : ""}
        />
      </div>

      {                 }
      <div className="flex gap-2 px-4 py-3 bg-surface border-b border-border">
        {(["active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-surface-secondary text-text-secondary"
            }`}
          >
            {f === "active" ? `Active (${active.length})` : "All"}
          </button>
        ))}
      </div>

      {                  }
      {ready.length > 0 && (
        <div className="mx-3 mt-3 bg-success-surface border border-success/20 rounded-2xl p-3 flex items-center gap-3">
          <Bell className="w-5 h-5 text-success animate-bounce flex-shrink-0" />
          <p className="text-sm font-semibold text-success">
            {ready.length} order{ready.length > 1 ? "s" : ""} ready for pickup!
          </p>
        </div>
      )}

      {          }
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
                : "No orders placed yet"
            }
          />
        ) : (
          <div className="px-3 py-3 space-y-2">
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
}
