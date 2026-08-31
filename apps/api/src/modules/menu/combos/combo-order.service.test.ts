import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCombo, priceComponents } = vi.hoisted(() => ({
  findCombo: vi.fn(),
  priceComponents: vi.fn(),
}));

vi.mock("../../../db", () => ({
  db: {
    query: {
      combos: { findFirst: findCombo },
    },
  },
}));

vi.mock("../../orders/pricing/pricing-pipeline", () => ({
  pricingPipeline: { price: priceComponents },
}));

import { priceComboOrders } from "./combo-order.service";

const context = {
  tenantId: "tenant-1",
  branchId: "branch-1",
  channel: "STAFF" as const,
  fulfillmentType: "TAKEAWAY" as const,
  asOf: new Date("2026-08-29T17:00:00.000Z"),
};

const combo = {
  id: "11111111-1111-4111-8111-111111111111",
  tenantId: "tenant-1",
  name: "Lunch Combo",
  status: "ACTIVE" as const,
  pricePolicy: "FIXED" as const,
  fixedPrice: "199.00",
  percentOff: null,
  slots: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Choose main",
      minSelections: 1,
      maxSelections: 1,
      options: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          menuItemId: "44444444-4444-4444-8444-444444444444",
          variantId: null,
          upcharge: "20.00",
        },
      ],
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      name: "Choose drink",
      minSelections: 1,
      maxSelections: 1,
      options: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          menuItemId: "77777777-7777-4777-8777-777777777777",
          variantId: null,
          upcharge: "0.00",
        },
      ],
    },
  ],
};

const request = {
  comboId: combo.id,
  quantity: 1,
  selections: [
    {
      slotId: combo.slots[0]!.id,
      optionIds: [combo.slots[0]!.options[0]!.id],
    },
    {
      slotId: combo.slots[1]!.id,
      optionIds: [combo.slots[1]!.options[0]!.id],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  findCombo.mockResolvedValue(combo);
  priceComponents.mockResolvedValue({
    lines: [
      {
        menuItemId: combo.slots[0]!.options[0]!.menuItemId,
        menuItemName: "Paneer",
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
        taxRate: 5,
        fulfillmentType: "TAKEAWAY",
        modifiers: [],
        pricingAttribution: { BASE_PRICE: 150, VARIANT: 0, MODIFIER: 0 },
      },
      {
        menuItemId: combo.slots[1]!.options[0]!.menuItemId,
        menuItemName: "Cola",
        quantity: 1,
        unitPrice: 50,
        subtotal: 50,
        taxRate: 12,
        fulfillmentType: "TAKEAWAY",
        modifiers: [],
        pricingAttribution: { BASE_PRICE: 50, VARIANT: 0, MODIFIER: 0 },
      },
    ],
    subtotal: 200,
    taxAmount: 13.5,
  });
});

describe("D2 combo order integration", () => {
  it("creates one parent plus normal component children without double counting", async () => {
    const result = await priceComboOrders(context, [request]);

    expect(priceComponents).toHaveBeenCalledWith(
      context,
      expect.arrayContaining([
        expect.objectContaining({
          menuItemId: combo.slots[0]!.options[0]!.menuItemId,
          fulfillmentType: "TAKEAWAY",
        }),
        expect.objectContaining({
          menuItemId: combo.slots[1]!.options[0]!.menuItemId,
          fulfillmentType: "TAKEAWAY",
        }),
      ]),
    );

    expect(result.lines).toHaveLength(3);
    const [parent, ...children] = result.lines;
    expect(parent).toMatchObject({
      menuItemId: null,
      menuItemName: "Lunch Combo",
      comboId: combo.id,
      quantity: 1,
      unitPrice: 219,
      subtotal: 0,
      fulfillmentType: "TAKEAWAY",
    });
    expect(children.every((line) => line.comboId === combo.id)).toBe(true);
    expect(
      children.every((line) => line.comboGroupId === parent!.comboGroupId),
    ).toBe(true);
    expect(children.reduce((sum, line) => sum + line.subtotal, 0)).toBe(219);
    expect(result.subtotal).toBe(219);
    expect(result.lines.reduce((sum, line) => sum + line.subtotal, 0)).toBe(
      219,
    );
    expect(result.taxAmount).toBeCloseTo(
      children.reduce(
        (sum, line) => sum + (line.subtotal * line.taxRate) / 100,
        0,
      ),
      8,
    );
  });

  it("rejects duplicate slot and option selections server-side", async () => {
    await expect(
      priceComboOrders(context, [
        {
          ...request,
          selections: [request.selections[0]!, request.selections[0]!],
        },
      ]),
    ).rejects.toThrow("Duplicate combo slot selection");

    await expect(
      priceComboOrders(context, [
        {
          ...request,
          selections: [
            {
              ...request.selections[0]!,
              optionIds: [
                request.selections[0]!.optionIds[0]!,
                request.selections[0]!.optionIds[0]!,
              ],
            },
            request.selections[1]!,
          ],
        },
      ]),
    ).rejects.toThrow("Duplicate combo option selection");
  });

  it("uses the stage-1-through-3 resolved component prices before stage 4", async () => {
    const result = await priceComboOrders(context, [
      {
        ...request,
        comboId: combo.id,
      },
    ]);

    expect(result.subtotal).toBe(219);
    expect(result.lines[0]!.pricingAttribution.COMBO).toBe(219);
  });
});
