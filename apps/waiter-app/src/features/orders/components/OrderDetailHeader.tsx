import { X } from "lucide-react";
import { IconButton } from "@pos/ui";
import type { Order } from "@pos/types";
import { StatusBadge } from "./StatusBadge";
import { shortOrderId } from "../utils/orderHelpers";

interface Props {
  order: Order;
  onBack: () => void;
}

export function OrderDetailHeader({ order, onBack }: Props) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
      {

                                                                   }
      <IconButton
        icon={X}
        aria-label="Back to Orders"
        size="lg"
        className="w-9 h-9 rounded-xl bg-surface-secondary hover:bg-surface-secondary"
        onClick={onBack}
      />
      <div className="flex-1">
        <h2 className="font-bold text-text-primary">
          {shortOrderId(order.id)}
        </h2>
        <p className="text-xs text-text-disabled">
          {order.type?.replace("_", " ")}
          {order.table ? ` · Table ${order.table.name}` : ""}
        </p>
      </div>
      <StatusBadge status={order.status} />
    </div>
  );
}
