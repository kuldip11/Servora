export interface BillableOrderItemLike {
  itemStatus: string;
  compedAt?: unknown;
  billingExcluded?: boolean | null | undefined;
}

export const isBillableOrderItem = (item: BillableOrderItemLike): boolean => {
  if (item.billingExcluded) return false;
  return (
    item.itemStatus === "ACTIVE" ||
    (item.itemStatus === "REFIRED" && !item.compedAt)
  );
};
