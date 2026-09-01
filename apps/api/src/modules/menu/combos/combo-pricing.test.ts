import { describe, expect, it } from "vitest";
import { allocateComboTotal, priceCombo } from "./combo-pricing";
const slots = [
  {
    id: "main",
    name: "Choose main",
    minSelections: 1,
    maxSelections: 1,
    options: [{ id: "paneer", basePrice: 200, upcharge: 20 }],
  },
  {
    id: "drink",
    name: "Choose drink",
    minSelections: 1,
    maxSelections: 1,
    options: [{ id: "cola", basePrice: 50, upcharge: 0 }],
  },
];
const selections = [
  { slotId: "main", optionIds: ["paneer"] },
  { slotId: "drink", optionIds: ["cola"] },
];
describe("combo pricing stage", () => {
  it("uses fixed price plus upcharges without double counting children", () =>
    expect(
      priceCombo(
        { pricePolicy: "FIXED", fixedPrice: 199, percentOff: null, slots },
        selections,
      ),
    ).toEqual({ total: 219, componentSum: 250, upcharges: 20 }));
  it("discounts component sum then adds upcharges", () =>
    expect(
      priceCombo(
        {
          pricePolicy: "PERCENT_OFF_SUM",
          fixedPrice: null,
          percentOff: 10,
          slots,
        },
        selections,
      ).total,
    ).toBe(245));
  it("enforces slot cardinality", () =>
    expect(() =>
      priceCombo(
        { pricePolicy: "FIXED", fixedPrice: 199, percentOff: null, slots },
        [],
      ),
    ).toThrow("requires"));
});

describe("D2: stage 4 is a pure consumer of resolved stage-1–3 component prices", () => {
  it("discounts the resolved component sum and never performs its own menu lookup", () => {
    const resolvedSlots = [
      {
        id: "main",
        name: "Choose main",
        minSelections: 1,
        maxSelections: 1,
        options: [{ id: "paneer", basePrice: 150, upcharge: 20 }],
      },
      {
        id: "drink",
        name: "Choose drink",
        minSelections: 1,
        maxSelections: 1,
        options: [{ id: "cola", basePrice: 50, upcharge: 0 }],
      },
    ];
    const result = priceCombo(
      {
        pricePolicy: "PERCENT_OFF_SUM",
        fixedPrice: null,
        percentOff: 10,
        slots: resolvedSlots,
      },
      selections,
    );
    expect(result.componentSum).toBe(200);
    expect(result.total).toBe(200);
  });
});

describe("D2 deterministic combo allocation", () => {
  it("allocates to cents and preserves the exact authoritative total", () => {
    const base = (id: string, subtotal: number) => ({
      menuItemId: id,
      menuItemName: id,
      quantity: 1,
      unitPrice: subtotal,
      subtotal,
      taxRate: 0,
      fulfillmentType: "DINE_IN" as const,
      modifiers: [],
      pricingAttribution: { BASE_PRICE: subtotal, VARIANT: 0, MODIFIER: 0 },
    });
    const lines = allocateComboTotal(
      [base("a", 10), base("b", 10), base("c", 10)],
      10,
    );
    expect(lines.map((line) => line.subtotal)).toEqual([3.34, 3.33, 3.33]);
    expect(lines.reduce((sum, line) => sum + line.subtotal, 0)).toBe(10);
    expect(
      lines.every((line) => typeof line.pricingAttribution.COMBO === "number"),
    ).toBe(true);
  });
});
