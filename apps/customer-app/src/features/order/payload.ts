import type { CreateCustomerOrderInput } from "@/features/order/api";
import type { CartLine } from "@/features/cart/pricing";
import { normalizeSelectedOptions } from "@/features/cart/configuration";

export const createOrderPayload = (
  cart: CartLine[],
): CreateCustomerOrderInput => {
  return {
    items: cart.map((line) => ({
      menuItemId: line.item.id,
      quantity: line.quantity,
      ...(line.variantId ? { variantId: line.variantId } : {}),
      ...(line.selectedOptions.length
        ? { selectedOptions: normalizeSelectedOptions(line.selectedOptions) }
        : {}),
      fulfillmentType: line.fulfillmentType,
    })),
  };
};
