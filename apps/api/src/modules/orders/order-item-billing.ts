export interface BillableOrderItemLike {
  itemStatus: string;
  compedAt?: unknown;
  billingExcluded?: boolean | null | undefined;
}

/** Single in-memory billing predicate shared by order/customer repricing. */
export function isBillableOrderItem(item: BillableOrderItemLike): boolean {
  if (item.billingExcluded) return false;
  return item.itemStatus === "ACTIVE" ||
    (item.itemStatus === "REFIRED" && !item.compedAt);
}
