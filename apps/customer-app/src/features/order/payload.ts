import type { CreateCustomerOrderInput } from "../order/api";
import type { CartLine } from "../cart/pricing";
import { normalizeSelectedOptions } from "../cart/configuration";

export function createOrderPayload(cart: CartLine[]): CreateCustomerOrderInput {
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
}
