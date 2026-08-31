import { Card } from "@pos/ui";
import type { Order } from "@pos/types";
import { formatCurrency } from "../utils/orderHelpers";

interface Props {
  order: Order;
}

// Design-system Phase 11, Sprint WA-4: `Card` (Phase 2), `rounded-2xl`
// override, same technique as every other card in this app. **Flagged,
// not silent:** the original's `px-4 py-3` (16px/12px) has no exact
// match in `Card`'s `sm`(8px)/`md`(16px)/`lg`(24px) padding scale —
// `padding="md"` (16px uniform) is the closest, a small vertical-space
// increase from the original 12px, same category of un-matchable-token
// delta every prior sprint has flagged rather than pixel-chasing.
export function OrderTotals({ order }: Props) {
  return (
    <Card padding="md" className="mx-4 mt-3 rounded-2xl space-y-2">
      <div className="flex justify-between text-sm text-text-secondary">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm text-text-secondary">
        <span>{order.items?.some((item) => item.taxMode === "INCLUSIVE") ? (order.items?.some((item) => item.taxMode === "EXCLUSIVE") ? "Tax (mixed)" : "Tax included") : "Tax"}</span>
        <span>{formatCurrency(order.taxAmount)}</span>
      </div>
      {Number(order.discountAmount) > 0 && <div className="flex justify-between text-sm text-success"><span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span></div>}
      {Number(order.serviceChargeAmount ?? 0) > 0 && <div className="flex justify-between text-sm text-text-secondary"><span>Service charge</span><span>{formatCurrency(order.serviceChargeAmount)}</span></div>}
      {Math.abs(Number(order.roundingAdjustment ?? 0)) >= 0.005 && <div className="flex justify-between text-sm text-text-secondary"><span>Rounding</span><span>{formatCurrency(order.roundingAdjustment)}</span></div>}
      <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-divider">
        <span>Total</span>
        <span>{formatCurrency(order.totalAmount)}</span>
      </div>
    </Card>
  );
}
