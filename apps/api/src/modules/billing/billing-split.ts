export function splitMoneyEvenly(amount: number, ways: number): number[] {
  if (!Number.isInteger(ways) || ways < 1) throw new Error("INVALID_SPLIT_COUNT");
  const sign = amount < 0 ? -1 : 1;
  const cents = Math.abs(Math.round(amount * 100));
  const base = Math.floor(cents / ways);
  const remainder = cents % ways;
  return Array.from({ length: ways }, (_, index) => {
    const signedCents = sign * (base + (index < remainder ? 1 : 0));
    return signedCents === 0 ? 0 : signedCents / 100;
  });
}

export function areAllBillsPaid(
  bills: Array<{ id: string; totalAmount: string | number }>,
  paidByBill: ReadonlyMap<string, number>,
): boolean {
  return bills.every(
    (bill) => (paidByBill.get(bill.id) ?? 0) >= Number(bill.totalAmount) - 0.01,
  );
}

export function combinedOrderAmounts(
  orders: Array<{
    subtotal: string | number;
    taxAmount: string | number;
    discountAmount: string | number;
    serviceChargeAmount?: string | number;
    roundingAdjustment?: string | number;
    totalAmount: string | number;
  }>,
) {
  const sum = (
    key:
      | "subtotal"
      | "taxAmount"
      | "discountAmount"
      | "serviceChargeAmount"
      | "roundingAdjustment"
      | "totalAmount",
  ) => orders.reduce((total, order) => total + Number(order[key] ?? 0), 0).toFixed(2);
  return {
    subtotal: sum("subtotal"),
    taxAmount: sum("taxAmount"),
    discountAmount: sum("discountAmount"),
    serviceChargeAmount: sum("serviceChargeAmount"),
    roundingAdjustment: sum("roundingAdjustment"),
    totalAmount: sum("totalAmount"),
  };
}

export type ItemAllocation = { label?: string; orderItemIds: string[] };
export type ItemShareAllocation = {
  label?: string;
  itemShares: Array<{ orderItemId: string; shareRatio: number }>;
};
export type BillableOrderItem = { id: string; comboGroupId?: string | null };

export function validateItemShareAllocations(
  activeItemIds: string[],
  allocations: ItemShareAllocation[],
): { ok: true } | { ok: false; reason: "EMPTY_BILL" | "UNKNOWN_ITEM" | "INVALID_RATIO" | "UNASSIGNED_ITEM" } {
  if (allocations.some((allocation) => allocation.itemShares.length === 0)) return { ok: false, reason: "EMPTY_BILL" };
  const active = new Set(activeItemIds);
  const totals = new Map<string, number>();
  for (const allocation of allocations) {
    for (const share of allocation.itemShares) {
      if (!active.has(share.orderItemId)) return { ok: false, reason: "UNKNOWN_ITEM" };
      if (!Number.isFinite(share.shareRatio) || share.shareRatio <= 0 || share.shareRatio > 1) return { ok: false, reason: "INVALID_RATIO" };
      totals.set(share.orderItemId, (totals.get(share.orderItemId) ?? 0) + share.shareRatio);
    }
  }
  for (const id of active) {
    if (Math.abs((totals.get(id) ?? 0) - 1) > 0.000001) return { ok: false, reason: "UNASSIGNED_ITEM" };
  }
  return { ok: true };
}

export function validateFractionalComboAllocations(
  items: BillableOrderItem[],
  allocations: ItemShareAllocation[],
): { ok: true } | { ok: false; reason: "SPLIT_COMBO_GROUP" } {
  const sharesByItem = new Map<string, Map<number, number>>();
  allocations.forEach((allocation, billIndex) => {
    for (const share of allocation.itemShares) {
      const byBill = sharesByItem.get(share.orderItemId) ?? new Map<number, number>();
      byBill.set(billIndex, share.shareRatio);
      sharesByItem.set(share.orderItemId, byBill);
    }
  });
  for (const group of buildBillableItemGroups(items)) {
    if (group.length < 2) continue;
    const baseline = sharesByItem.get(group[0]!) ?? new Map();
    for (const id of group.slice(1)) {
      const current = sharesByItem.get(id) ?? new Map();
      const bills = new Set([...baseline.keys(), ...current.keys()]);
      for (const bill of bills) {
        if (Math.abs((baseline.get(bill) ?? 0) - (current.get(bill) ?? 0)) > 0.000001) {
          return { ok: false, reason: "SPLIT_COMBO_GROUP" };
        }
      }
    }
  }
  return { ok: true };
}

/**
 * C9/D2: combo parent + component rows are one indivisible billing unit.
 * The returned arrays preserve the original item order inside each group.
 */
export function buildBillableItemGroups(items: BillableOrderItem[]): string[][] {
  const grouped = new Map<string, string[]>();
  for (const item of items) {
    const key = item.comboGroupId ? `combo:${item.comboGroupId}` : `item:${item.id}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item.id]);
  }
  return [...grouped.values()];
}

export function groupOrderItemsForEvenBills(
  items: BillableOrderItem[],
  ways: number,
): string[][] | null {
  if (!Number.isInteger(ways) || ways < 1) throw new Error("INVALID_SPLIT_COUNT");
  const groups = buildBillableItemGroups(items);
  if (groups.length < ways) return null;
  const bills = Array.from({ length: ways }, () => [] as string[]);
  groups.forEach((group, index) => bills[index % ways]!.push(...group));
  return bills;
}

export function validateComboGroupAllocations(
  items: BillableOrderItem[],
  allocations: ItemAllocation[],
): { ok: true } | { ok: false; reason: "SPLIT_COMBO_GROUP" } {
  const billByItem = new Map<string, number>();
  allocations.forEach((allocation, billIndex) => {
    allocation.orderItemIds.forEach((id) => billByItem.set(id, billIndex));
  });

  for (const group of buildBillableItemGroups(items)) {
    if (group.length < 2) continue;
    const assignedBills = new Set(
      group
        .map((id) => billByItem.get(id))
        .filter((value): value is number => value !== undefined),
    );
    if (assignedBills.size > 1) return { ok: false, reason: "SPLIT_COMBO_GROUP" };
  }
  return { ok: true };
}

export function validateItemAllocations(
  activeItemIds: string[],
  allocations: ItemAllocation[],
):
  | { ok: true }
  | {
      ok: false;
      reason: "EMPTY_BILL" | "UNKNOWN_ITEM" | "DUPLICATE_ITEM" | "UNASSIGNED_ITEM";
    } {
  if (allocations.some((allocation) => allocation.orderItemIds.length === 0)) {
    return { ok: false, reason: "EMPTY_BILL" };
  }
  const active = new Set(activeItemIds);
  const assigned = new Set<string>();
  for (const allocation of allocations) {
    for (const itemId of allocation.orderItemIds) {
      if (!active.has(itemId)) return { ok: false, reason: "UNKNOWN_ITEM" };
      if (assigned.has(itemId)) return { ok: false, reason: "DUPLICATE_ITEM" };
      assigned.add(itemId);
    }
  }
  if (assigned.size !== active.size) return { ok: false, reason: "UNASSIGNED_ITEM" };
  return { ok: true };
}

export function allocateTotalsByWeight(total: number, weights: number[]): number[] {
  const sign = total < 0 ? -1 : 1;
  const totalCents = Math.abs(Math.round(total * 100));
  const weightTotal = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (weightTotal <= 0) return splitMoneyEvenly(total, weights.length);
  const raw = weights.map((weight) => (totalCents * Math.max(0, weight)) / weightTotal);
  const cents = raw.map(Math.floor);
  let remainder = totalCents - cents.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index += 1) {
    cents[order[index % order.length]!.index]! += 1;
  }
  return cents.map((value) => {
    const signed = sign * value;
    return signed === 0 ? 0 : signed / 100;
  });
}

export function buildSeatAllocationPlan(
  items: Array<{
    id: string;
    seatLabel: string | null;
    subtotal: string | number;
    taxRate: string | number;
    taxMode?: "INCLUSIVE" | "EXCLUSIVE";
    comboGroupId?: string | null;
  }>,
  sharedItemStrategy: "EVEN_SPLIT" | "MANUAL",
) {
  const labels = [
    ...new Set(
      items
        .map((item) => item.seatLabel?.trim())
        .filter((label): label is string => !!label),
    ),
  ];
  if (labels.length === 0) return { status: "no_seats" as const };
  const allocations = labels.map((label) => ({
    label,
    orderItemIds: [] as string[],
  }));

  const units = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.comboGroupId ? `combo:${item.comboGroupId}` : `item:${item.id}`;
    units.set(key, [...(units.get(key) ?? []), item]);
  }

  const weightOf = (unit: typeof items) =>
    unit.reduce(
      (sum, item) =>
        sum +
        Number(item.subtotal) *
          (item.taxMode === "INCLUSIVE" ? 1 : 1 + Number(item.taxRate) / 100),
      0,
    );
  const sharedUnits: Array<{ items: typeof items; weight: number }> = [];

  for (const unit of units.values()) {
    const unitLabels = [
      ...new Set(
        unit
          .map((item) => item.seatLabel?.trim())
          .filter((label): label is string => !!label),
      ),
    ];
    if (unitLabels.length === 1) {
      const allocation = allocations.find((entry) => entry.label === unitLabels[0])!;
      allocation.orderItemIds.push(...unit.map((item) => item.id));
    } else {
      // A combo is atomic for billing. A mixed-seat combo (or an unlabeled
      // shared item) goes through the shared-item strategy instead of
      // scattering its parent/components across receipts.
      sharedUnits.push({ items: unit, weight: weightOf(unit) });
    }
  }

  if (sharedUnits.length && sharedItemStrategy === "MANUAL") {
    return {
      status: "manual_required" as const,
      allocations,
      sharedItemIds: sharedUnits.flatMap((unit) => unit.items.map((item) => item.id)),
    };
  }

  const allocationWeight = (allocation: ItemAllocation) =>
    allocation.orderItemIds.reduce((sum, id) => {
      const item = items.find((candidate) => candidate.id === id)!;
      return (
        sum +
        Number(item.subtotal) *
          (item.taxMode === "INCLUSIVE" ? 1 : 1 + Number(item.taxRate) / 100)
      );
    }, 0);
  const weights = allocations.map(allocationWeight);
  for (const unit of sharedUnits) {
    const lightest = weights.indexOf(Math.min(...weights));
    allocations[lightest]!.orderItemIds.push(...unit.items.map((item) => item.id));
    weights[lightest]! += unit.weight;
  }
  return { status: "complete" as const, allocations };
}


/** G5: seat planner that honors explicit per-item fractional shares first. */
export function buildFractionalSeatAllocationPlan(
  items: Array<{
    id: string;
    seatLabel: string | null;
    subtotal: string | number;
    taxRate: string | number;
    taxMode?: "INCLUSIVE" | "EXCLUSIVE";
    comboGroupId?: string | null;
    seatShares?: Array<{ seatLabel: string; shareRatio: string | number }>;
  }>,
  sharedItemStrategy: "EVEN_SPLIT" | "MANUAL",
) {
  if (!items.some((item) => item.seatShares?.length)) return null;
  const labels = [...new Set(items.flatMap((item) => [
    ...(item.seatLabel?.trim() ? [item.seatLabel.trim()] : []),
    ...(item.seatShares ?? []).map((share) => share.seatLabel.trim()).filter(Boolean),
  ]))];
  if (!labels.length) return { status: "no_seats" as const };
  const allocations: ItemShareAllocation[] = labels.map((label) => ({ label, itemShares: [] }));
  const allocationFor = (label: string) => allocations.find((entry) => entry.label === label)!;
  const unresolved: typeof items = [];

  for (const item of items) {
    if (item.seatShares?.length) {
      const total = item.seatShares.reduce((sum, share) => sum + Number(share.shareRatio), 0);
      if (Math.abs(total - 1) > 0.000001) throw new Error("INVALID_SEAT_SHARE_TOTAL");
      for (const share of item.seatShares) {
        allocationFor(share.seatLabel.trim()).itemShares.push({ orderItemId: item.id, shareRatio: Number(share.shareRatio) });
      }
    } else if (item.seatLabel?.trim()) {
      allocationFor(item.seatLabel.trim()).itemShares.push({ orderItemId: item.id, shareRatio: 1 });
    } else {
      unresolved.push(item);
    }
  }

  if (unresolved.length && sharedItemStrategy === "MANUAL") {
    return {
      status: "manual_required" as const,
      allocations: allocations.map((allocation) => ({ label: allocation.label, orderItemIds: allocation.itemShares.map((share) => share.orderItemId) })),
      sharedItemIds: unresolved.map((item) => item.id),
    };
  }

  // Preserve B9's established whole-unit distribution for untagged lines;
  // only explicitly seat-shared G5 lines are fractional.
  const weightForAllocation = (allocation: ItemShareAllocation) => allocation.itemShares.reduce((sum, share) => {
    const item = items.find((candidate) => candidate.id === share.orderItemId)!;
    return sum + Number(item.subtotal) * (item.taxMode === "INCLUSIVE" ? 1 : 1 + Number(item.taxRate) / 100) * share.shareRatio;
  }, 0);
  const weights = allocations.map(weightForAllocation);
  for (const item of unresolved) {
    const lightest = weights.indexOf(Math.min(...weights));
    allocations[lightest]!.itemShares.push({ orderItemId: item.id, shareRatio: 1 });
    weights[lightest]! += Number(item.subtotal) * (item.taxMode === "INCLUSIVE" ? 1 : 1 + Number(item.taxRate) / 100);
  }
  return { status: "complete" as const, allocations };
}
