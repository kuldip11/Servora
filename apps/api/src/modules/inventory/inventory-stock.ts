import type { InventoryTransactionType } from "@pos/types";

export type StockResolution =
  | { ok: true; balanceAfter: number }
  | { ok: false; reason: "INSUFFICIENT_STOCK" };

export const resolveStockBalance = (
  currentStock: number,
  quantity: number,
  transactionType: InventoryTransactionType,
): StockResolution => {
  if (transactionType === "IN") {
    return { ok: true, balanceAfter: currentStock + quantity };
  }

  if (transactionType === "OUT" || transactionType === "WASTE") {
    const balanceAfter = currentStock - quantity;
    if (balanceAfter < 0) return { ok: false, reason: "INSUFFICIENT_STOCK" };
    return { ok: true, balanceAfter };
  }

  return { ok: true, balanceAfter: quantity };
};

export const resolveInventoryReversal = (
  currentStock: number,
  quantityActuallyDeducted: number,
) => {
  return { balanceAfter: currentStock + quantityActuallyDeducted };
};
