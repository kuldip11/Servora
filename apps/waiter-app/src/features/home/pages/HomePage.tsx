import {
  ShoppingBag,
  Bell,
  ChevronRight,
  CheckCircle2,
  Droplets,
  ReceiptText,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { apiClient } from "../../../shared/lib/api-client";
import { Card } from "@pos/ui";
import { useOrders } from "../../orders/hooks/useOrders";
import { OrderCard } from "../../orders/components/OrderCard";

interface Props {
  waiterName: string;
  onNewOrder: () => void;
  onViewOrders: () => void;
  onSelectOrder: (id: string) => void;
}

// Phase 11 — `the design-system contract` names this file directly as a reference
// example ("HomePage/OrderCard are good visual references, just need
// to move onto shared primitives instead of one-off markup"). The
// hero banner has no matching `packages/ui` primitive (nothing else in
// this project renders a full-bleed colored header block like this),
// so it stays page-specific markup — only its color literals moved
// onto tokens, same as every Admin sprint's treatment of a
// deliberately page-specific visual element (e.g. `DashboardPage`'s
// quick-action tiles, Sprint AD-7).
export function HomePage({
  waiterName,
  onNewOrder,
  onViewOrders,
  onSelectOrder,
}: Props) {
  const { data: orders } = useOrders();
  const [requests, setRequests] = useState<
    Array<{ id: string; tableId: string; type: string; status: string }>
  >([]);
  useEffect(() => {
    void apiClient
      .get("/customer/requests")
      .then((response) => setRequests(response.data.data ?? []))
      .catch(() => undefined);
  }, []);
  useRealtimeEvent("customer.request.created", (event) => {
    setRequests((current) =>
      current.some((r) => r.id === event.payload.id)
        ? current
        : [
            {
              id: event.payload.id,
              tableId: event.payload.tableId,
              type: event.payload.type,
              status: event.payload.status,
            },
            ...current,
          ],
    );
  });
  useRealtimeEvent("customer.request.updated", (event) => {
    if (["RESOLVED", "CANCELLED"].includes(event.payload.status))
      setRequests((current) =>
        current.filter((r) => r.id !== event.payload.id),
      );
  });
  async function resolveRequest(id: string) {
    await apiClient.patch(`/customer/requests/${id}`, { status: "RESOLVED" });
    setRequests((current) => current.filter((r) => r.id !== id));
  }

  const active =
    orders?.filter((o) => ["OPEN", "BILL_REQUESTED"].includes(o.status)) ?? [];
  const ready = active.filter((o) =>
    o.kitchenTickets?.some((t) => t.status === "READY"),
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-primary px-5 pt-10 pb-8">
        <p className="text-primary-foreground text-xs font-medium">
          Welcome back
        </p>
        <h1 className="text-2xl font-bold text-primary-foreground mt-0.5">
          {waiterName}
        </h1>
        {ready.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-primary-foreground/20 rounded-xl px-3 py-2">
            <Bell className="w-4 h-4 text-primary-foreground animate-bounce" />
            <p className="text-primary-foreground text-sm font-semibold">
              {ready.length} order{ready.length > 1 ? "s" : ""} ready for pickup
            </p>
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl border border-warning/30 bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" />
              <p className="font-bold text-sm">Customer requests</p>
              <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold">
                {requests.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {requests.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 rounded-xl bg-background px-3 py-2"
                >
                  <span className="text-primary">
                    {request.type === "WATER" ? (
                      <Droplets className="w-4 h-4" />
                    ) : request.type === "BILL" ? (
                      <ReceiptText className="w-4 h-4" />
                    ) : (
                      <Utensils className="w-4 h-4" />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    Table request ·{" "}
                    {request.type.replace("_", " ").toLowerCase()}
                  </span>
                  <button
                    onClick={() => void resolveRequest(request.id)}
                    className="text-xs font-semibold text-primary"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 -mt-4 space-y-3 pb-6">
        {/* New Order CTA */}
        <Card
          as="button"
          onClick={onNewOrder}
          padding="md"
          className="w-full rounded-2xl flex items-center gap-4 shadow-md active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-text-primary">New Order</p>
            <p className="text-xs text-text-secondary">
              Browse menu · select variants & modifiers
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-text-disabled" />
        </Card>

        {/* Active orders */}
        {active.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-sm font-semibold text-text-secondary">
                Active Orders
              </p>
              <button
                onClick={onViewOrders}
                className="text-xs text-primary font-medium"
              >
                See all
              </button>
            </div>
            <div className="space-y-2">
              {active.slice(0, 4).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={onSelectOrder}
                  variant="compact"
                />
              ))}
            </div>
          </div>
        ) : (
          <Card padding="lg" className="rounded-2xl text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold text-text-secondary">
              All caught up!
            </p>
            <p className="text-xs text-text-disabled mt-1">
              No active orders right now
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
