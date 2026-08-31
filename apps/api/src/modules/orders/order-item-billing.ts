export interface BillableOrderItemLike {
  itemStatus: string;
  compedAt?: unknown;
  billingExcluded?: boolean | null | undefined;
}

export function isBillableOrderItem(item: BillableOrderItemLike): boolean {
  if (item.billingExcluded) return false;
  return item.itemStatus === "ACTIVE" ||
    (item.itemStatus === "REFIRED" && !item.compedAt);
}
