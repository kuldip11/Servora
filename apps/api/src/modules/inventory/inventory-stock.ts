/**
 * Pure stock-transaction arithmetic — extracted from the inline
 * if/else-if/else chain that used to live in the repository's
 * `updateStock`, the same pattern `orders/order-pricing.ts` and
 * `kitchen-tickets/ticket-status.machine.ts` established: dense,
 * previously-untested domain logic gets its own DB-free file so it can be
 * unit tested directly instead of only through a full service/repository
 * round-trip.
 *
 * No behavior change from the pre-refactor repository — including one
 * quirk worth flagging rather than silently "fixing": WASTE and
 * ADJUSTMENT both set the stock to the given `quantity` as an absolute
 * value. WASTE was never treated as "subtract this much" in the
 * pre-refactor code; it fell into the same catch-all `else` branch as
 * ADJUSTMENT. Preserved as-is here — see docs/NEXT_STEPS.md.
 */
import type { InventoryTransactionType } from '@pos/types';

export type StockResolution =
  | { ok: true; balanceAfter: number }
  | { ok: false; reason: 'INSUFFICIENT_STOCK' };

export function resolveStockBalance(
  currentStock: number,
  quantity: number,
  transactionType: InventoryTransactionType,
): StockResolution {
  if (transactionType === 'IN') {
    return { ok: true, balanceAfter: currentStock + quantity };
  }

  if (transactionType === 'OUT') {
    const balanceAfter = currentStock - quantity;
    if (balanceAfter < 0) return { ok: false, reason: 'INSUFFICIENT_STOCK' };
    return { ok: true, balanceAfter };
  }

  // ADJUSTMENT and WASTE: sets the absolute value (see file header note).
  return { ok: true, balanceAfter: quantity };
}
