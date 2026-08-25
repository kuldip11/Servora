/**
 * Order item resolution & pricing — extracted from `orders/service.ts`
 * (where it lived as an inline `resolveItems` function) because it's the
 * densest, highest-value-to-test logic in the module: variant pricing,
 * additive modifier pricing, and modifier-group min/max/selection-type
 * enforcement, none of which had a single test before this migration.
 *
 * Deliberately pure — no DB access — so it can be unit tested directly
 * against fixture menu items instead of only reachable through a live
 * order-creation flow.
 *
 * The menu module hasn't been refactored yet (see docs/NEXT_STEPS.md), so
 * it doesn't export a proper "menu item ready for pricing" type. This
 * interface documents exactly the subset of fields this module reads off
 * whatever `availabilityRepository.findByIds(...)` returns — narrower and more
 * honest than the `Map<string, any>` the pre-refactor code used, without
 * taking on a full retype of the menu module's Drizzle relational query
 * result in this change.
 */
import { ValidationError } from "../../core/errors";

export interface PricableMenuItem {
  id: string;
  name: string;
  isAvailable: boolean;
  basePrice: string;
  taxRate: string;
  variants: Array<{ id: string; name: string; price: string }>;
  modifierGroupLinks: Array<{
    group: {
      id: string;
      name: string;
      minSelections: number;
      maxSelections: number | null;
      selectionType: "SINGLE" | "MULTIPLE";
      options: Array<{
        id: string;
        name: string;
        isAvailable: boolean;
        maxQuantity: number | null;
        additionalPrice: string;
      }>;
    };
  }>;
}

export interface OrderItemInput {
  menuItemId: string;
  variantId?: string | undefined;
  quantity: number;
  chefNotes?: string | undefined;
  selectedOptions?:
    Array<{ optionId: string; quantity?: number | undefined }> | undefined;
}

export interface ResolvedOrderItem {
  menuItemId: string;
  menuItemName: string;
  variantId?: string | undefined;
  variantName?: string | undefined;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  chefNotes?: string | undefined;
  modifiers: Array<{
    modifierId: string;
    modifierGroupName: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface ResolveItemsResult {
  resolved: ResolvedOrderItem[];
  subtotal: number;
  taxAmount: number;
}

/**
 * Resolves a client's requested items/variants/modifiers against the
 * actual menu data and computes pricing. Every check here is a *real*
 * enforcement point, not just a UI convenience — a client could send
 * anything directly to the API, bypassing whatever the ordering UI
 * would have prevented.
 *
 * Throws `ValidationError` (400, preserving the original endpoint's
 * status code) with a human-readable message identifying the offending
 * item — same wording as the pre-refactor inline version.
 */
export function resolveItems(
  items: OrderItemInput[],
  itemMap: Map<string, PricableMenuItem>,
): ResolveItemsResult {
  let subtotal = 0;
  let taxAmount = 0;

  const resolved = items.map((item) => {
    const menuItem = itemMap.get(item.menuItemId);
    if (!menuItem)
      throw new ValidationError(`Menu item ${item.menuItemId} not found`);
    if (!menuItem.isAvailable)
      throw new ValidationError(`${menuItem.name} is not available`);

    // Variants (e.g. "Half" / "Full") are independently-priced options, not
    // add-ons to basePrice — a selected variant's price REPLACES the base
    // price. Modifiers (below) are the additive kind, e.g. "Extra Cheese +₹30".
    let unitPrice = parseFloat(menuItem.basePrice);
    let variantName: string | undefined;

    if (item.variantId) {
      const variant = menuItem.variants.find((v) => v.id === item.variantId);
      if (!variant)
        throw new ValidationError(`Variant not found on ${menuItem.name}`);
      unitPrice = parseFloat(variant.price);
      variantName = variant.name;
    }

    // Flatten this item's available groups/options, then validate the
    // selection against each group's min/max rule.
    const groups = menuItem.modifierGroupLinks.map((l) => l.group);
    const optionLookup = new Map<
      string,
      {
        option: PricableMenuItem["modifierGroupLinks"][number]["group"]["options"][number];
        group: PricableMenuItem["modifierGroupLinks"][number]["group"];
      }
    >();
    for (const group of groups) {
      for (const option of group.options ?? []) {
        optionLookup.set(option.id, { option, group });
      }
    }

    const selectedByGroup = new Map<
      string,
      Array<{ optionId: string; quantity: number }>
    >();
    for (const sel of item.selectedOptions ?? []) {
      const found = optionLookup.get(sel.optionId);
      if (!found)
        throw new ValidationError(
          `Modifier option ${sel.optionId} not found on ${menuItem.name}`,
        );
      if (!found.option.isAvailable) {
        throw new ValidationError(
          `${found.option.name} is currently unavailable`,
        );
      }
      const qty = Math.min(sel.quantity ?? 1, found.option.maxQuantity ?? 1);
      const list = selectedByGroup.get(found.group.id) ?? [];
      list.push({ optionId: sel.optionId, quantity: qty });
      selectedByGroup.set(found.group.id, list);
    }

    for (const group of groups) {
      const picked = selectedByGroup.get(group.id) ?? [];
      if (picked.length < group.minSelections) {
        throw new ValidationError(
          `"${group.name}" requires at least ${group.minSelections} selection(s) on ${menuItem.name}`,
        );
      }
      if (group.maxSelections != null && picked.length > group.maxSelections) {
        throw new ValidationError(
          `"${group.name}" allows at most ${group.maxSelections} selection(s) on ${menuItem.name}`,
        );
      }
      if (group.selectionType === "SINGLE" && picked.length > 1) {
        throw new ValidationError(
          `"${group.name}" only allows one selection on ${menuItem.name}`,
        );
      }
    }

    const modifiers: ResolvedOrderItem["modifiers"] = [];
    for (const [, picks] of selectedByGroup) {
      for (const pick of picks) {
        const { option, group } = optionLookup.get(pick.optionId)!;
        modifiers.push({
          modifierId: option.id,
          modifierGroupName: group.name,
          name: option.name,
          price: parseFloat(option.additionalPrice),
          quantity: pick.quantity,
        });
        unitPrice += parseFloat(option.additionalPrice) * pick.quantity;
      }
    }

    const itemSubtotal = unitPrice * item.quantity;
    const itemTax = (itemSubtotal * parseFloat(menuItem.taxRate)) / 100;
    subtotal += itemSubtotal;
    taxAmount += itemTax;

    return {
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      variantId: item.variantId,
      variantName,
      quantity: item.quantity,
      unitPrice,
      subtotal: itemSubtotal,
      chefNotes: item.chefNotes,
      modifiers,
    };
  });

  return { resolved, subtotal, taxAmount };
}
