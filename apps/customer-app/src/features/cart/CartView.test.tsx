import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartView } from "./CartView";
import type { CartLine } from "./pricing";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const cart = [
  {
    item: {
      id: "item-1",
      name: "Mushroom pizza",
      basePrice: "500",
      taxRate: "5",
      imageUrl: null,
      images: [],
      variants: [],
      modifierGroupLinks: [],
    },
    quantity: 1,
    selectedOptions: [],
    fulfillmentType: "DINE_IN",
  },
] as unknown as CartLine[];

const roots: Array<ReturnType<typeof createRoot>> = [];

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.innerHTML = "";
});

const buttonNamed = (name: RegExp) =>
  [...document.querySelectorAll("button")].find((button) =>
    name.test(button.textContent ?? ""),
  );

describe("CartView round fulfilment", () => {
  it("asks once at placement and keeps table takeaway on the table tab", () => {
    const onPlace = vi.fn();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);
    act(() =>
      root.render(
        <CartView
          cart={cart}
          combos={[]}
          subtotal={500}
          tax={25}
          total={525}
          table="12"
          mode="DINE_IN"
          onBack={() => {}}
          onChange={() => {}}
          onComboChange={() => {}}
          onEdit={() => {}}
          onPlace={onPlace}
          couponCode=""
          onCouponCodeChange={() => {}}
          loyaltyPhone=""
          onLoyaltyPhoneChange={() => {}}
          loading={false}
        />,
      ),
    );

    expect(document.body.textContent).not.toContain("Eat here");
    const placeOrder = buttonNamed(/place order/i);
    expect(placeOrder).toBeDefined();
    act(() =>
      placeOrder!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(document.body.textContent).toContain(
      "How should we prepare this order?",
    );
    expect(document.body.textContent).toContain(
      "deliver it to Table 12, and keep it on the same table bill",
    );

    const takeaway = buttonNamed(/pack for takeaway/i);
    expect(takeaway).toBeDefined();
    act(() =>
      takeaway!.dispatchEvent(new MouseEvent("click", { bubbles: true })),
    );
    expect(onPlace).toHaveBeenCalledWith("TAKEAWAY");
  });
});
