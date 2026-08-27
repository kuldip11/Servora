import type { CustomerMenuItem } from "../../api";

export type SelectedOption = { optionId: string; quantity: number };
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
  const variant = line.item.variants.find((value) => value.id === line.variantId);
  const modifierTotal = line.selectedOptions.reduce((sum, selection) => {
    const option = findOption(line.item, selection.optionId);
    return sum + Number(option?.additionalPrice ?? 0) * selection.quantity;
  }, 0);
  return Number(variant?.price ?? line.item.basePrice) + modifierTotal;
}

export function getLineSubtotal(line: CartLine) {
  return getLineUnitPrice(line) * line.quantity;
}

export type CartSummary = { subtotal: number; tax: number; total: number; itemCount: number };

/**
 * Client-side estimate. The API remains authoritative for final totals.
 * Calculate all summary values in one pass so cart changes do not traverse the
 * same line collection four times.
 */
export function getCartSummary(cart: CartLine[]): CartSummary {
  const summary = cart.reduce((result, line) => {
    const lineSubtotal = getLineSubtotal(line);
    const rate = Number(line.item.taxRate);
    const taxRate = Number.isFinite(rate) ? rate : 0;
    result.subtotal += lineSubtotal;
    result.tax += lineSubtotal * taxRate / 100;
    result.itemCount += line.quantity;
    return result;
  }, { subtotal: 0, tax: 0, total: 0, itemCount: 0 });

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

export function getCartLineKey(line: Pick<CartLine, "item" | "variantId" | "selectedOptions" | "fulfillmentType">) {
  return JSON.stringify({
    itemId: line.item.id,
    variantId: line.variantId ?? null,
    selectedOptions: [...line.selectedOptions].sort((a, b) => a.optionId.localeCompare(b.optionId)),
    fulfillmentType: line.fulfillmentType,
  });
}
