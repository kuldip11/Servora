import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Spinner, EmptyState } from "@pos/ui";
import { useOrders } from "@/features/orders/hooks/useOrders";
import { OrderCard } from "@/features/orders/components/OrderCard";

interface Props {
  onSelectOrder: (id: string) => void;
}

export const OrdersPage = ({ onSelectOrder }: Props) => {
  const [filter, setFilter] = useState<"ready" | "active" | "all">("ready");
  const { data: orders, isLoading } = useOrders();

  const active =
    orders?.filter((o) => ["OPEN", "BILL_REQUESTED"].includes(o.status)) ?? [];
  const ready =
    orders?.filter((o) =>
      o.kitchenTickets?.some((t) => t.status === "READY"),
    ) ?? [];
  const display =
    filter === "ready" ? ready : filter === "active" ? active : (orders ?? []);

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <div className="px-3.5 pb-1 pt-3.5">
        <h1 className="text-[22px] font-medium text-text-primary">Orders</h1>
      </div>

      {}
      <div className="flex gap-[7px] px-3.5 py-3">
        {(["ready", "active", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`min-h-10 flex-1 rounded-xl border px-3 text-xs font-medium transition-colors ${
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
          <div className="space-y-2 px-3.5 pb-5 pt-1">
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
