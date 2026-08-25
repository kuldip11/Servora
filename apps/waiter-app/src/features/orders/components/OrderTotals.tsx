import { Card } from '@pos/ui';
import type { Order } from '@pos/types';
import { formatCurrency } from '../utils/orderHelpers';

interface Props { order: Order; }

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
        <span>Tax</span>
        <span>{formatCurrency(order.taxAmount)}</span>
      </div>
      <div className="flex justify-between text-base font-bold text-text-primary pt-2 border-t border-divider">
        <span>Total</span>
        <span>{formatCurrency(order.totalAmount)}</span>
      </div>
    </Card>
  );
}
