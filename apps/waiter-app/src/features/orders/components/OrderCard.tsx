import { memo } from "react";
import { Bell, ChevronRight, ReceiptText } from "lucide-react";
import { Card } from "@pos/ui";
import type { Order } from "@pos/types";
import { StatusBadge } from "./StatusBadge";
import {
  shortOrderId,
  formatCurrency,
  isOrderReady,
} from "@/features/orders/utils/orderHelpers";

interface Props {
  order: Order;
  onSelect: (id: string) => void;

  variant?: "compact" | "detailed";
}

export const OrderCard = memo(function OrderCard({
  order,
  onSelect,
  variant = "detailed",
}: Props) {
  const ready = isOrderReady(order);
  const tableName =
    order.table?.name ?? (order.type === "TAKEAWAY" ? "TA" : "Order");
  const elapsedMinutes = order.createdAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000),
      )
    : null;
  const attentionLabel = ready
    ? "Ready to serve"
    : order.status === "BILL_REQUESTED"
      ? "Bill requested"
      : "In progress";

  if (variant === "compact") {
    return (
      <Card
        as="button"
        onClick={() => onSelect(order.id)}
        padding="md"
        className={`grid min-h-[72px] w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl text-left transition-transform active:scale-[0.98] ${
          ready ? "border-success ring-1 ring-success/30" : ""
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-xs font-semibold text-text-primary">
          {tableName}
        </span>
        <span className="min-w-0">
          <strong
            className={`flex items-center gap-1.5 truncate text-sm font-semibold ${ready ? "text-success" : order.status === "BILL_REQUESTED" ? "text-warning" : "text-text-primary"}`}
          >
            {ready ? (
              <Bell className="h-4 w-4 shrink-0" />
            ) : order.status === "BILL_REQUESTED" ? (
              <ReceiptText className="h-4 w-4 shrink-0" />
            ) : null}
            {attentionLabel}
          </strong>
          <span className="mt-1 block truncate text-xs text-text-secondary">
            {shortOrderId(order.id)} · {order.items?.length ?? 0} items
            {elapsedMinutes !== null ? ` · ${elapsedMinutes} min` : ""}
          </span>
        </span>
        <span className="flex min-h-10 items-center gap-1 rounded-xl bg-primary-surface px-3 text-xs font-semibold text-primary">
          Open <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </Card>
    );
  }

  return (
    <Card
      as="button"
      onClick={() => onSelect(order.id)}
      padding="md"
      className={`w-full rounded-2xl text-left transition-transform active:scale-[0.98] ${
        ready ? "border-success ring-1 ring-success/30" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ready && <Bell className="h-4 w-4 text-success" />}
          <span className="font-mono font-bold text-sm text-text-primary">
            {shortOrderId(order.id)}
          </span>
          {order.table && (
            <span className="text-xs bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
              Table {order.table.name}
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mb-3 space-y-1 rounded-xl bg-surface-secondary p-3">
        {order.items?.slice(0, 2).map((item) => (
          <p key={item.id} className="text-xs text-text-secondary">
            {item.quantity}× {item.menuItemName}
          </p>
        ))}
        {(order.items?.length ?? 0) > 2 && (
          <p className="text-xs text-text-disabled">
            +{(order.items?.length ?? 0) - 2} more
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-text-secondary">
          {order.type?.replace("_", " ")}
          {elapsedMinutes !== null ? ` · ${elapsedMinutes} min` : ""}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text-primary">
            {formatCurrency(order.totalAmount)}
          </span>
          <ChevronRight className="w-4 h-4 text-text-disabled" />
        </div>
      </div>
    </Card>
  );
});
