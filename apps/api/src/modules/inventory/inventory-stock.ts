/**
 * Pure stock-transaction arithmetic — extracted from the inline
 * if/else-if/else chain that used to live in the repository's
 * `updateStock`, the same pattern `orders/order-pricing.ts` and
 * `kitchen-tickets/ticket-status.machine.ts` established: dense,
 * previously-untested domain logic gets its own DB-free file so it can be
 * unit tested directly instead of only through a full service/repository
 * round-trip.
 *
 * Transaction semantics are explicit: IN adds stock, OUT and WASTE
 * subtract stock, and ADJUSTMENT sets an absolute counted balance. This
 * keeps the dedicated E3 waste workflow aligned with its user-facing
 * "quantity wasted" contract instead of treating waste as a recount.
 */
import type { InventoryTransactionType } from "@pos/types";

export type StockResolution =
  | { ok: true; balanceAfter: number }
  | { ok: false; reason: "INSUFFICIENT_STOCK" };

export function resolveStockBalance(
  currentStock: number,
  quantity: number,
  transactionType: InventoryTransactionType,
): StockResolution {
  if (transactionType === "IN") {
    return { ok: true, balanceAfter: currentStock + quantity };
  }

  if (transactionType === "OUT" || transactionType === "WASTE") {
    const balanceAfter = currentStock - quantity;
    if (balanceAfter < 0) return { ok: false, reason: "INSUFFICIENT_STOCK" };
    return { ok: true, balanceAfter };
  }

  // ADJUSTMENT is an absolute physical-count correction.
  return { ok: true, balanceAfter: quantity };
}

export function resolveInventoryReversal(currentStock: number, quantityActuallyDeducted: number) {
  return { balanceAfter: currentStock + quantityActuallyDeducted };
}
