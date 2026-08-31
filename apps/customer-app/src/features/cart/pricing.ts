import type { CustomerMenuItem } from "../../api";

export type SelectedOption = { optionId: string; quantity: number; zoneLabel?: "LEFT" | "RIGHT" | "WHOLE" };
export type CartLine = {
  item: CustomerMenuItem;
  quantity: number;
  variantId?: string;
  selectedOptions: SelectedOption[];
  fulfillmentType: "DINE_IN" | "TAKEAWAY";
};

function findOption(item: CustomerMenuItem, optionId: string) {
  return item.modifierGroupLinks
    .flatMap(({ group }) => group.options)
    .find((option) => option.id === optionId);
}

export function getLineUnitPrice(line: CartLine) {
  const variant = line.item.variants.find(
    (value) => value.id === line.variantId,
  );
  const optionPrice = (selection: SelectedOption) => {
    const option = findOption(line.item, selection.optionId);
    const scoped = line.variantId ? option?.variantPrices?.find((value) => value.variantId === line.variantId) : undefined;
    return Number(scoped?.additionalPrice ?? option?.additionalPrice ?? 0) * selection.quantity;
  };
  const whole = line.selectedOptions.filter((selection) => !selection.zoneLabel || selection.zoneLabel === "WHOLE").reduce((sum, selection) => sum + optionPrice(selection), 0);
  const zoned = line.selectedOptions.filter((selection) => selection.zoneLabel && selection.zoneLabel !== "WHOLE");
  const byZone = new Map<string, number>();
  for (const selection of zoned) byZone.set(selection.zoneLabel!, (byZone.get(selection.zoneLabel!) ?? 0) + optionPrice(selection));
  const zoneTotals = [...byZone.values()];
  const rule = line.item.zonePricingRule ?? "HIGHER";
  const zoneModifierTotal = !line.item.supportsZones || !zoneTotals.length
    ? zoned.reduce((sum, selection) => sum + optionPrice(selection), 0)
    : rule === "HIGHER"
      ? Math.max(...zoneTotals)
      : rule === "AVERAGE"
        ? zoneTotals.reduce((sum, value) => sum + value, 0) / zoneTotals.length
        : zoneTotals.reduce((sum, value) => sum + value * 0.5, 0);
  return Number(variant?.price ?? line.item.basePrice) + whole + zoneModifierTotal;
}

export function getLineSubtotal(line: CartLine) {
  return getLineUnitPrice(line) * line.quantity;
}

export type CartSummary = {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
};

export function getCartSummary(cart: CartLine[]): CartSummary {
  const summary = cart.reduce(
    (result, line) => {
      const lineSubtotal = getLineSubtotal(line);
      const rate = Number(line.item.taxRate);
      const taxRate = Number.isFinite(rate) ? rate : 0;
      result.subtotal += lineSubtotal;
      result.tax += (lineSubtotal * taxRate) / 100;
      result.itemCount += line.quantity;
      return result;
    },
    { subtotal: 0, tax: 0, total: 0, itemCount: 0 },
  );

  summary.total = summary.subtotal + summary.tax;
  return summary;
}

export function getCartSubtotal(cart: CartLine[]) {
  return getCartSummary(cart).subtotal;
}

export function getCartTax(cart: CartLine[]) {
  return getCartSummary(cart).tax;
}

export function getCartTotal(cart: CartLine[]) {
  return getCartSummary(cart).total;
}

export function getItemCount(cart: CartLine[]) {
  return getCartSummary(cart).itemCount;
}

export function getCartLineKey(
  line: Pick<
    CartLine,
    "item" | "variantId" | "selectedOptions" | "fulfillmentType"
  >,
) {
  return JSON.stringify({
    itemId: line.item.id,
    variantId: line.variantId ?? null,
    selectedOptions: [...line.selectedOptions].sort((a, b) =>
      `${a.optionId}:${a.zoneLabel ?? "WHOLE"}`.localeCompare(`${b.optionId}:${b.zoneLabel ?? "WHOLE"}`),
    ),
    fulfillmentType: line.fulfillmentType,
  });
}
