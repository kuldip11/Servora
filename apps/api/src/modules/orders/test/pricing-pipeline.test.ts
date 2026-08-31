import { beforeEach, describe, expect, it, vi } from "vitest";

const { findByIds, findPricingOverrides, findCandidates, findPerCoverRule } = vi.hoisted(() => ({
  findByIds: vi.fn(),
  findPricingOverrides: vi.fn(),
  findCandidates: vi.fn(),
  findPerCoverRule: vi.fn(),
}));

vi.mock("../../menu/availability/availability.repository", () => ({
  availabilityRepository: { findByIds, findPricingOverrides },
}));

vi.mock("../../menu/pricing/price-rule.repository", () => ({
  priceRuleRepository: { findCandidates, findPerCoverRule },
}));

import {
  pricingPipeline,
  resolveBasePriceStage,
  resolveModifierStage,
  resolveVariantStage,
  selectPriceRule,
  type MatchingPriceRule,
  type PricableMenuItem,
  type PricingContext,
} from "../pricing/pricing-pipeline";
import { priceCombo } from "../../menu/combos/combo-pricing";

const context: PricingContext = {
  tenantId: "t1",
  branchId: "b1",
  channel: "STAFF",
  fulfillmentType: "DINE_IN",
  asOf: new Date("2026-08-29T10:00:00.000Z"),
};

const menu = (
  overrides: Partial<PricableMenuItem> = {},
): PricableMenuItem => ({
  id: "m1",
  branchId: null,
  name: "Pizza",
  categoryId: "cat-1",
  isAvailable: true,
  basePrice: "100.00",
  taxRate: "5",
  variants: [],
  modifierGroupLinks: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  findByIds.mockResolvedValue([menu()]);
  findPricingOverrides.mockResolvedValue([]);
  findCandidates.mockResolvedValue([]);
});

describe("PricingPipeline stages", () => {
  it("stage 1 resolves branch base-price and tax overrides without mutating the item", () => {
    const item = menu();
    const result = resolveBasePriceStage(item, {
      menuItemId: "m1",
      price: "125.50",
      taxRate: "12",
    });

    expect(result).toEqual({ price: 125.5, taxRate: 12, attribution: 125.5 });
    expect(item.basePrice).toBe("100.00");
    expect(item.taxRate).toBe("5");
  });

  it("stage 1 resolves a percent-off happy-hour rule from the item's base price", () => {
    const item = menu({ basePrice: "125.00" });
    const result = resolveBasePriceStage(item, {
      menuItemId: "m1",
      price: null,
      percentOff: "20.00",
      taxRate: null,
    });
    expect(result).toEqual({ price: 100, taxRate: 5, attribution: 100 });
  });

  it("stage 2 preserves variant replacement semantics and attributes only the delta", () => {
    const item = menu({
      variants: [{ id: "v1", name: "Large", price: "150" }],
    });
    expect(resolveVariantStage(item, 120, "v1")).toEqual({
      price: 150,
      variantName: "Large",
      attribution: 30,
    });
  });

  it("stage 2 can resolve an unavailable variant for read-only reporting without changing order defaults", () => {
    const item = menu({ variants: [
      { id: "large", name: "Large", price: "150", status: "OUT_OF_STOCK" },
    ] });
    expect(() => resolveVariantStage(item, 100, "large")).toThrow("Large is unavailable");
    expect(resolveVariantStage(item, 100, "large", false, true)).toMatchObject({
      price: 150,
      variantName: "Large",
    });
  });

  it("stage 2 rejects only the 86'd variant and leaves its sibling orderable", () => {
    const item = menu({ variants: [
      { id: "small", name: "Small", price: "100", status: "ACTIVE" },
      { id: "large", name: "Large", price: "150", status: "ACTIVE", manualOverrideStatus: "OUT_OF_STOCK", manualOverrideReason: "Large packaging unavailable" },
    ] });
    expect(() => resolveVariantStage(item, 100, "large")).toThrow("Large is unavailable: Large packaging unavailable");
    expect(resolveVariantStage(item, 100, "small")).toMatchObject({ price: 100, variantName: "Small" });
  });

  it("stage 3 validates modifier rules and attributes additive modifier value", () => {
    const item = menu({
      modifierGroupLinks: [
        {
          group: {
            id: "g1",
            name: "Extras",
            minSelections: 1,
            maxSelections: 2,
            selectionType: "MULTIPLE",
            options: [
              {
                id: "o1",
                name: "Cheese",
                isAvailable: true,
                maxQuantity: 2,
                additionalPrice: "20",
              },
            ],
          },
        },
      ],
    });

    expect(resolveModifierStage(item, [{ optionId: "o1", quantity: 3 }])).toEqual({
      modifiers: [
        {
          modifierId: "o1",
          modifierGroupName: "Extras",
          name: "Cheese",
          price: 20,
          quantity: 2,
        },
      ],
      attribution: 40,
    });
  });
  it("rejects a dependent modifier selection without its prerequisite", () => {
    const item = menu({ modifierGroupLinks: [
      { group: { id: "crust", name: "Crust", minSelections: 0, maxSelections: 1, selectionType: "SINGLE", options: [{ id: "half", name: "Half & Half", isAvailable: true, maxQuantity: 1, additionalPrice: "0" }] } },
      { group: { id: "left", name: "Left toppings", dependsOnOptionId: "half", minSelections: 0, maxSelections: 2, selectionType: "MULTIPLE", options: [{ id: "cheese", name: "Cheese", isAvailable: true, maxQuantity: 1, additionalPrice: "20" }] } },
    ] });
    expect(() => resolveModifierStage(item, [{ optionId: "cheese", quantity: 1 }])).toThrow("requires its prerequisite");
    expect(() => resolveModifierStage(item, [{ optionId: "half", quantity: 1 }, { optionId: "cheese", quantity: 1 }])).not.toThrow();
  });
  it("nets and labels a negative substitution price", () => {
    const item = menu({ modifierGroupLinks: [{ group: { id: "side", name: "Swap side", groupType: "SUBSTITUTION", minSelections: 0, maxSelections: 1, selectionType: "SINGLE", options: [{ id: "salad", name: "Salad", replacesDefaultComponent: "Fries", isAvailable: true, maxQuantity: 1, additionalPrice: "-20" }] } }] });
    expect(resolveModifierStage(item, [{ optionId: "salad", quantity: 1 }])).toMatchObject({ attribution: -20, modifiers: [{ name: "~~Fries~~ → Salad", price: -20 }] });
  });
});

describe("PricingPipeline golden regression matrix", () => {
  it("matches the pre-A4 base-price and tax result", async () => {
    const result = await pricingPipeline.price(context, [
      { menuItemId: "m1", quantity: 2, seatLabel: "Seat 2" },
    ]);

    const { pricingReplayEvidence, ...goldenLine } = result.lines[0]!;
    expect({ ...result, lines: [goldenLine] }).toMatchObject({
      lines: [
        {
          menuItemId: "m1",
          menuItemName: "Pizza",
          variantId: undefined,
          variantName: undefined,
          quantity: 2,
          unitPrice: 100,
          subtotal: 200,
          taxRate: 5,
          chefNotes: undefined,
          seatLabel: "Seat 2",
          fulfillmentType: "DINE_IN",
          modifiers: [],
          pricingAttribution: {
            BASE_PRICE: 100,
            VARIANT: 0,
            MODIFIER: 0,
            CATEGORY_ID: "cat-1",
          },
        },
      ],
      subtotal: 200,
      taxAmount: 10,
    });
    expect(pricingReplayEvidence).toMatchObject({
      requestedLine: { menuItemId: "m1", quantity: 2, seatLabel: "Seat 2" },
      item: { id: "m1", basePrice: "100.00" },
      branchOverride: null,
      priceRules: [],
    });
  });


  it("H1 replays the exact pricing pipeline from immutable evidence without reading current repositories", async () => {
    findPricingOverrides.mockResolvedValue([{
      id: "override-1", menuItemId: "m1", price: "120.00", taxRate: "12.00",
    }]);
    const original = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 2 }]);
    const evidence = original.lines[0]!.pricingReplayEvidence!;

    findByIds.mockClear();
    findPricingOverrides.mockClear();
    findCandidates.mockClear();
    findByIds.mockRejectedValue(new Error("current menu must not be read during replay"));
    findPricingOverrides.mockRejectedValue(new Error("current overrides must not be read during replay"));
    findCandidates.mockRejectedValue(new Error("current price rules must not be read during replay"));

    const replayed = await pricingPipeline.price(
      { ...context, historicalReplay: evidence },
      [evidence.requestedLine],
    );

    expect(replayed.lines[0]).toMatchObject({ unitPrice: 120, subtotal: 240, taxRate: 12 });
    expect(replayed.lines[0]!.pricingAttribution.PRICE_SOURCE).toMatchObject({
      kind: "BRANCH_OVERRIDE", id: "override-1",
    });
    expect(findByIds).not.toHaveBeenCalled();
    expect(findPricingOverrides).not.toHaveBeenCalled();
    expect(findCandidates).not.toHaveBeenCalled();
  });

  it("matches pre-A4 variant replacement plus modifier pricing", async () => {
    findByIds.mockResolvedValue([
      menu({
        variants: [{ id: "v1", name: "Large", price: "150" }],
        modifierGroupLinks: [
          {
            group: {
              id: "g1",
              name: "Extras",
              minSelections: 0,
              maxSelections: 2,
              selectionType: "MULTIPLE",
              options: [
                {
                  id: "o1",
                  name: "Cheese",
                  isAvailable: true,
                  maxQuantity: 2,
                  additionalPrice: "20",
                },
              ],
            },
          },
        ],
      }),
    ]);

    const result = await pricingPipeline.price(context, [
      {
        menuItemId: "m1",
        variantId: "v1",
        quantity: 2,
        selectedOptions: [{ optionId: "o1", quantity: 3 }],
      },
    ]);

    expect(result).toMatchObject({ subtotal: 380, taxAmount: 19 });
    expect(result.lines[0]).toMatchObject({
      variantName: "Large",
      unitPrice: 190,
      subtotal: 380,
      pricingAttribution: {
        BASE_PRICE: 100,
        VARIANT: 50,
        MODIFIER: 40,
      },
    });
    expect(result.lines[0]!.modifiers[0]).toMatchObject({ quantity: 2, price: 20 });
  });

  it("moves the existing branch price/tax overlay into stage 1 with identical totals", async () => {
    findPricingOverrides.mockResolvedValue([
      { menuItemId: "m1", price: "120", taxRate: "12" },
    ]);

    const result = await pricingPipeline.price(context, [
      { menuItemId: "m1", quantity: 2 },
    ]);

    expect(result).toMatchObject({ subtotal: 240, taxAmount: 28.8 });
    expect(result.lines[0]).toMatchObject({
      unitPrice: 120,
      pricingAttribution: { BASE_PRICE: 120, VARIANT: 0, MODIFIER: 0 },
    });
  });

  it("does not apply tenant-wide branch overrides to a branch-exclusive item", async () => {
    findByIds.mockResolvedValue([menu({ branchId: "b1" })]);
    findPricingOverrides.mockResolvedValue([
      { menuItemId: "m1", price: "120", taxRate: "12" },
    ]);

    const result = await pricingPipeline.price(context, [
      { menuItemId: "m1", quantity: 1 },
    ]);

    expect(findPricingOverrides).toHaveBeenCalledWith("t1", [], "b1");
    expect(result).toMatchObject({ subtotal: 100, taxAmount: 5 });
  });

  it("applies a percent-off price rule only inside its fixed asOf time window", async () => {
    findCandidates.mockResolvedValue([{
      id: "happy", menuItemId: "m1", variantId: null, branchId: null, channel: null, fulfillmentType: null,
      startDate: null, endDate: null, startTime: "09:00:00", endTime: "11:00:00",
      price: null, percentOff: "20.00", taxRate: null, priority: 0,
    }]);
    const active = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1 }]);
    expect(active.lines[0]).toMatchObject({ unitPrice: 80, subtotal: 80 });

    const inactive = await pricingPipeline.price({ ...context, asOf: new Date("2026-08-29T12:00:00.000Z") }, [{ menuItemId: "m1", quantity: 1 }]);
    expect(inactive.lines[0]).toMatchObject({ unitPrice: 100, subtotal: 100 });
  });

  it("keeps a winning variant-specific absolute PriceRule through stage 2", async () => {
    findByIds.mockResolvedValue([menu({ variants: [{ id: "v1", name: "Large", price: "150" }] })]);
    findCandidates.mockResolvedValue([{
      id: "variant-rule", menuItemId: "m1", variantId: "v1", branchId: "b1", channel: "STAFF", fulfillmentType: null,
      startDate: null, endDate: null, startTime: null, endTime: null,
      price: "120", percentOff: null, taxRate: null, priority: 0,
    }]);

    const result = await pricingPipeline.price(context, [{ menuItemId: "m1", variantId: "v1", quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({
      unitPrice: 120,
      variantName: "Large",
      pricingAttribution: { BASE_PRICE: 120, VARIANT: 0 },
    });
  });

  it("computes a winning variant-specific percent-off PriceRule from the variant price", async () => {
    findByIds.mockResolvedValue([menu({ variants: [{ id: "v1", name: "Large", price: "150" }] })]);
    findCandidates.mockResolvedValue([{
      id: "variant-happy", menuItemId: "m1", variantId: "v1", branchId: "b1", channel: "STAFF", fulfillmentType: null,
      startDate: null, endDate: null, startTime: null, endTime: null,
      price: null, percentOff: "20", taxRate: null, priority: 0,
    }]);

    const result = await pricingPipeline.price(context, [{ menuItemId: "m1", variantId: "v1", quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({ unitPrice: 120, variantName: "Large" });
  });

  it("applies a general happy-hour percent rule to a selected variant's resolved price", async () => {
    findByIds.mockResolvedValue([menu({ variants: [{ id: "v1", name: "Large", price: "150" }] })]);
    findCandidates.mockResolvedValue([{
      id: "happy-all-variants", menuItemId: "m1", variantId: null, branchId: null, channel: null, fulfillmentType: null,
      startDate: null, endDate: null, startTime: "09:00:00", endTime: "11:00:00",
      price: null, percentOff: "20", taxRate: null, priority: 0,
    }]);

    const result = await pricingPipeline.price(context, [{ menuItemId: "m1", variantId: "v1", quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({ unitPrice: 120, variantName: "Large" });
  });

  it("applies happy-hour percent-off to the resolved branch price and preserves branch tax when the rule does not override tax", async () => {
    findPricingOverrides.mockResolvedValue([{ menuItemId: "m1", price: "120", taxRate: "12" }]);
    findCandidates.mockResolvedValue([{
      id: "happy-branch", menuItemId: "m1", variantId: null, branchId: null, channel: null, fulfillmentType: null,
      startDate: null, endDate: null, startTime: "09:00:00", endTime: "11:00:00",
      price: null, percentOff: "20", taxRate: null, priority: 0,
    }]);

    const result = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({ unitPrice: 96, taxRate: 12 });
    expect(result.taxAmount).toBeCloseTo(11.52, 8);
  });

  it("still lets stage 2 replace a branch price override when a lower-specificity rule does not win stage 1", async () => {
    findByIds.mockResolvedValue([menu({ variants: [{ id: "v1", name: "Large", price: "150" }] })]);
    findPricingOverrides.mockResolvedValue([{ menuItemId: "m1", price: "120", taxRate: "5" }]);
    findCandidates.mockResolvedValue([{
      id: "channel-rule", menuItemId: "m1", variantId: null, branchId: null, channel: "STAFF", fulfillmentType: null,
      startDate: null, endDate: null, startTime: null, endTime: null,
      price: "110", percentOff: null, taxRate: null, priority: 999,
    }]);

    const result = await pricingPipeline.price(context, [{ menuItemId: "m1", variantId: "v1", quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({ unitPrice: 150, variantName: "Large" });
  });

  it("uses the most specific active price rule ahead of a branch price override", async () => {
    findPricingOverrides.mockResolvedValue([
      { menuItemId: "m1", price: "120", taxRate: "12" },
    ]);
    findCandidates.mockResolvedValue([
      {
        id: "r-general",
        menuItemId: "m1",
        variantId: null,
        branchId: null,
        channel: "STAFF",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        price: "125",
        taxRate: "5",
        priority: 100,
      },
      {
        id: "r-specific",
        menuItemId: "m1",
        variantId: null,
        branchId: "b1",
        channel: "STAFF",
        fulfillmentType: null,
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        price: "140",
        taxRate: "18",
        priority: 0,
      },
    ]);

    const result = await pricingPipeline.price(context, [
      { menuItemId: "m1", quantity: 1 },
    ]);

    expect(result).toMatchObject({ subtotal: 140, taxAmount: 25.2 });
  });
});

describe("D2 combo stage consumes authoritative D1 component pricing", () => {
  it("uses an active happy-hour component price before applying the stage-4 combo policy", async () => {
    findByIds.mockResolvedValue([menu({ basePrice: "100.00" })]);
    findCandidates.mockResolvedValue([{
      id: "happy-component", menuItemId: "m1", variantId: null, branchId: null, channel: "STAFF", fulfillmentType: null,
      startDate: null, endDate: null, startTime: "16:00:00", endTime: "18:00:00",
      price: null, percentOff: "20.00", taxRate: null, priority: 0, effectiveFrom: null,
    }]);
    const happyContext = { ...context, asOf: new Date("2026-08-29T17:00:00.000Z") };
    const component = await pricingPipeline.price(happyContext, [{ menuItemId: "m1", quantity: 1 }]);
    expect(component.lines[0]!.unitPrice).toBe(80);

    const combo = priceCombo({
      pricePolicy: "PERCENT_OFF_SUM", fixedPrice: null, percentOff: 10,
      slots: [{ id: "main", name: "Main", minSelections: 1, maxSelections: 1, options: [{ id: "pizza", basePrice: component.lines[0]!.unitPrice, upcharge: 0 }] }],
    }, [{ slotId: "main", optionIds: ["pizza"] }]);
    expect(combo.componentSum).toBe(80);
    expect(combo.total).toBe(72);
  });
});

describe("PricingPipeline D1: full specificity matrix across all dimensions", () => {
  const rule = (overrides: Partial<MatchingPriceRule>): MatchingPriceRule => ({
    id: "r",
    menuItemId: "m1",
    variantId: null,
    branchId: null,
    channel: null,
    fulfillmentType: null,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    price: "0",
    taxRate: null,
    priority: 0,
    ...overrides,
  });

  it("a channel-only rule and a time-window-only rule for the same item resolve independently", () => {
    const deliveryMarkup = rule({ id: "delivery", channel: "CUSTOMER_QR", price: "150" });
    const happyHour = rule({
      id: "happy-hour",
      startTime: "16:00:00",
      endTime: "18:00:00",
      price: "80",
    });

    const deliveryCtx: PricingContext = {
      ...context,
      channel: "CUSTOMER_QR",
      asOf: new Date("2026-08-29T10:00:00.000Z"),
    };
    expect(
      selectPriceRule([deliveryMarkup, happyHour], deliveryCtx)?.id,
    ).toBe("delivery");

    const happyHourCtx: PricingContext = {
      ...context,
      channel: "STAFF",
      asOf: new Date("2026-08-29T17:00:00.000Z"),
    };
    expect(
      selectPriceRule([deliveryMarkup, happyHour], happyHourCtx)?.id,
    ).toBe("happy-hour");
  });

  it("prefers the rule with the most simultaneously-matched dimensions (variant, branch, channel, fulfillment, time)", () => {
    const rules = [
      rule({ id: "item-wide", price: "100" }),
      rule({ id: "branch-only", branchId: "b1", price: "110" }),
      rule({ id: "branch-channel", branchId: "b1", channel: "STAFF", price: "120" }),
      rule({
        id: "branch-channel-fulfillment",
        branchId: "b1",
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        price: "130",
      }),
      rule({
        id: "fully-specific",
        variantId: "v1",
        branchId: "b1",
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        startTime: "09:00:00",
        endTime: "23:00:00",
        price: "140",
      }),
    ];

    const result = selectPriceRule(rules, context, "v1");
    expect(result?.id).toBe("fully-specific");
  });

  it("exhaustively prefers every more-specific combination across variant, branch, channel, fulfillment, and time dimensions", () => {
    const dimensions = ["variant", "branch", "channel", "fulfillment", "time"] as const;
    const makeScopedRule = (id: string, mask: number): MatchingPriceRule => {
      const scoped = rule({ id, price: String(100 + mask) });
      if (mask & 1) scoped.variantId = "v1";
      if (mask & 2) scoped.branchId = "b1";
      if (mask & 4) scoped.channel = "STAFF";
      if (mask & 8) scoped.fulfillmentType = "DINE_IN";
      if (mask & 16) { scoped.startTime = "09:00:00"; scoped.endTime = "23:00:00"; }
      return scoped;
    };

    for (let mask = 1; mask < (1 << dimensions.length); mask += 1) {
      const lessSpecificMask = mask & (mask - 1);
      const winner = makeScopedRule(`winner-${mask}`, mask);
      const fallback = makeScopedRule(`fallback-${mask}`, lessSpecificMask);
      expect(selectPriceRule([fallback, winner], context, "v1")?.id).toBe(winner.id);
    }
  });

  it("falls back to the next-most-specific rule when the top candidate's variant doesn't match", () => {
    const rules = [
      rule({ id: "branch-channel-fulfillment", branchId: "b1", channel: "STAFF", fulfillmentType: "DINE_IN", price: "130" }),
      rule({ id: "fully-specific-other-variant", variantId: "v2", branchId: "b1", channel: "STAFF", fulfillmentType: "DINE_IN", price: "140" }),
    ];
    const result = selectPriceRule(rules, context, "v1");
    expect(result?.id).toBe("branch-channel-fulfillment");
  });

  it("breaks an equal-specificity tie using priority, then stable id", () => {
    const rules = [
      rule({ id: "b", channel: "STAFF", priority: 0, price: "100" }),
      rule({ id: "a", channel: "STAFF", priority: 5, price: "110" }),
    ];
    expect(selectPriceRule(rules, context)?.id).toBe("a");

    const tiedPriority = [
      rule({ id: "z", channel: "STAFF", priority: 0, price: "100" }),
      rule({ id: "a", channel: "STAFF", priority: 0, price: "110" }),
    ];
    expect(selectPriceRule(tiedPriority, context)?.id).toBe("a");
  });

  it("uses start-inclusive/end-exclusive time boundaries so adjacent rules never both match", () => {
    const first = rule({ id: "first", startTime: "16:00:00", endTime: "18:00:00", price: "90" });
    const second = rule({ id: "second", startTime: "18:00:00", endTime: "20:00:00", price: "80" });

    expect(selectPriceRule([first, second], { ...context, asOf: new Date("2026-08-29T15:59:59.000Z") }))
      .toBeUndefined();
    expect(selectPriceRule([first, second], { ...context, asOf: new Date("2026-08-29T16:00:00.000Z") })?.id)
      .toBe("first");
    expect(selectPriceRule([first, second], { ...context, asOf: new Date("2026-08-29T17:59:59.000Z") })?.id)
      .toBe("first");
    expect(selectPriceRule([first, second], { ...context, asOf: new Date("2026-08-29T18:00:00.000Z") })?.id)
      .toBe("second");
  });

  it("honors inclusive date bounds independently from time-window specificity", () => {
    const dated = rule({ id: "dated", startDate: "2026-08-29", endDate: "2026-08-30", price: "90" });
    expect(selectPriceRule([dated], { ...context, asOf: new Date("2026-08-28T12:00:00.000Z") }))
      .toBeUndefined();
    expect(selectPriceRule([dated], { ...context, asOf: new Date("2026-08-29T12:00:00.000Z") })?.id)
      .toBe("dated");
    expect(selectPriceRule([dated], { ...context, asOf: new Date("2026-08-30T12:00:00.000Z") })?.id)
      .toBe("dated");
    expect(selectPriceRule([dated], { ...context, asOf: new Date("2026-08-31T12:00:00.000Z") }))
      .toBeUndefined();
  });

  it("resolves an overnight happy-hour window and rejects a non-overlapping time correctly", () => {
    const overnight = rule({ id: "late-night", startTime: "22:00:00", endTime: "02:00:00", price: "90" });
    expect(
      selectPriceRule([overnight], { ...context, asOf: new Date("2026-08-29T23:30:00.000Z") })?.id,
    ).toBe("late-night");
    expect(
      selectPriceRule([overnight], { ...context, asOf: new Date("2026-08-29T01:00:00.000Z") })?.id,
    ).toBe("late-night");
    expect(
      selectPriceRule([overnight], { ...context, asOf: new Date("2026-08-29T12:00:00.000Z") })?.id,
    ).toBeUndefined();
  });
});

describe("PricingPipeline validation regressions", () => {
  it("allows read-only pricing reports to price an unavailable item through the same pipeline", async () => {
    findByIds.mockResolvedValue([menu({ isAvailable: false })]);
    await expect(
      pricingPipeline.price({ ...context, allowUnavailable: true }, [{ menuItemId: "m1", quantity: 1 }]),
    ).resolves.toMatchObject({ lines: [{ unitPrice: 100 }] });
  });

  it("prices a base/variant reporting row without forcing required order-entry modifiers", async () => {
    findByIds.mockResolvedValue([
      menu({
        modifierGroupLinks: [{
          group: {
            id: "required-side", name: "Choose a side", minSelections: 1, maxSelections: 1,
            selectionType: "SINGLE",
            options: [{ id: "fries", name: "Fries", isAvailable: true, maxQuantity: 1, additionalPrice: "25" }],
          },
        }],
      }),
    ]);

    await expect(
      pricingPipeline.price(
        { ...context, allowIncompleteModifierSelection: true },
        [{ menuItemId: "m1", quantity: 1 }],
      ),
    ).resolves.toMatchObject({ lines: [{ unitPrice: 100, modifiers: [] }] });

    await expect(
      pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1 }]),
    ).rejects.toThrow("requires at least");
  });

  it("preserves missing/unavailable item and variant errors", async () => {
    findByIds.mockResolvedValue([]);
    await expect(
      pricingPipeline.price(context, [{ menuItemId: "missing", quantity: 1 }]),
    ).rejects.toThrow("not found");

    findByIds.mockResolvedValue([menu({ isAvailable: false })]);
    await expect(
      pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1 }]),
    ).rejects.toThrow("not available");

    findByIds.mockResolvedValue([menu()]);
    await expect(
      pricingPipeline.price(context, [
        { menuItemId: "m1", variantId: "bad", quantity: 1 },
      ]),
    ).rejects.toThrow("Variant not found");
  });

  it("preserves modifier availability and selection-rule errors", async () => {
    findByIds.mockResolvedValue([
      menu({
        modifierGroupLinks: [
          {
            group: {
              id: "g1",
              name: "Size",
              minSelections: 1,
              maxSelections: 1,
              selectionType: "SINGLE",
              options: [
                {
                  id: "o1",
                  name: "A",
                  isAvailable: true,
                  maxQuantity: 1,
                  additionalPrice: "0",
                },
                {
                  id: "o2",
                  name: "B",
                  isAvailable: false,
                  maxQuantity: 1,
                  additionalPrice: "0",
                },
              ],
            },
          },
        ],
      }),
    ]);

    await expect(
      pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1 }]),
    ).rejects.toThrow("requires at least");

    await expect(
      pricingPipeline.price(context, [
        {
          menuItemId: "m1",
          quantity: 1,
          selectedOptions: [{ optionId: "o1" }, { optionId: "o2" }],
        },
      ]),
    ).rejects.toThrow("currently unavailable");
  });
});

describe("advanced pricing acceptance", () => {
  const modifierItem = (zonePricingRule: "AVERAGE" | "HIGHER" | "SUM_HALF" = "HIGHER") => menu({
    supportsZones: true,
    zonePricingRule,
    variants: [
      { id: "small", name: "Small", price: "100" },
      { id: "large", name: "Large", price: "150" },
    ],
    modifierGroupLinks: [{
      group: {
        id: "toppings", name: "Toppings", minSelections: 0, maxSelections: 2,
        selectionType: "MULTIPLE",
        options: [
          { id: "cheese", name: "Cheese", isAvailable: true, maxQuantity: 1, additionalPrice: "20", variantPrices: [{ variantId: "large", additionalPrice: "40" }] },
          { id: "mushroom", name: "Mushroom", isAvailable: true, maxQuantity: 1, additionalPrice: "30" },
        ],
      },
    }],
  });

  it("G1 resolves a variant-specific modifier override and falls back to the flat price", () => {
    const item = modifierItem();
    expect(resolveModifierStage(item, [{ optionId: "cheese", quantity: 1 }], { variantId: "large" }).attribution).toBe(40);
    expect(resolveModifierStage(item, [{ optionId: "cheese", quantity: 1 }], { variantId: "small" }).attribution).toBe(20);
    expect(resolveModifierStage(item, [{ optionId: "cheese", quantity: 1 }]).attribution).toBe(20);
  });

  it.each([
    ["HIGHER", 30],
    ["AVERAGE", 25],
    ["SUM_HALF", 25],
  ] as const)("G2 applies %s split-zone pricing", (rule, expected) => {
    const item = modifierItem(rule);
    const priced = resolveModifierStage(item, [
      { optionId: "cheese", quantity: 1, zoneLabel: "LEFT" },
      { optionId: "mushroom", quantity: 1, zoneLabel: "RIGHT" },
    ]);
    expect(priced.attribution).toBe(expected);
    expect(priced.modifiers.map((entry) => entry.zoneLabel)).toEqual(["LEFT", "RIGHT"]);
  });

  it("G2 leaves non-zoned modifier summation unchanged", () => {
    const item = modifierItem("HIGHER");
    item.supportsZones = false;
    expect(resolveModifierStage(item, [
      { optionId: "cheese", quantity: 1 },
      { optionId: "mushroom", quantity: 1 },
    ]).attribution).toBe(50);
  });

  it("G3 prices FIXED, WEIGHT_BASED, and OPEN modes through the same pipeline", async () => {
    findByIds.mockResolvedValue([menu({ pricingMode: "FIXED", basePrice: "10" })]);
    const fixed = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 2 }]);
    expect(fixed).toMatchObject({ subtotal: 20, lines: [{ unitPrice: 10 }] });

    findByIds.mockResolvedValue([menu({ pricingMode: "WEIGHT_BASED", weightUnit: "KG", basePrice: "10" })]);
    const weighted = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1, weightQuantity: 0.45 }]);
    expect(weighted).toMatchObject({ subtotal: 4.5, lines: [{ unitPrice: 4.5, weightQuantity: 0.45, weightUnit: "KG" }] });

    findByIds.mockResolvedValue([menu({ pricingMode: "OPEN", openPriceMin: "25", openPriceMax: "500", basePrice: "0" })]);
    const open = await pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1, manualPrice: 125 }]);
    expect(open).toMatchObject({ subtotal: 125, lines: [{ unitPrice: 125, manualPrice: 125 }] });
    await expect(pricingPipeline.price(context, [{ menuItemId: "m1", quantity: 1, manualPrice: 5 }])).rejects.toThrow("sanity band");
  });

  it("G7 prefers tenant pricing over organization pricing while allowing org fallback", () => {
    const org: MatchingPriceRule = {
      id: "org", tenantId: null, organizationId: "org-1", menuItemId: null, menuItemSku: "PIZZA",
      variantId: null, branchId: null, channel: null, fulfillmentType: null,
      startDate: null, endDate: null, startTime: null, endTime: null, priority: 0,
      price: "90", taxRate: null,
    };
    const tenant: MatchingPriceRule = { ...org, id: "tenant", tenantId: "t1", organizationId: null, menuItemId: "m1", menuItemSku: null, price: "95" };
    expect(selectPriceRule([org], context)?.id).toBe("org");
    expect(selectPriceRule([org, tenant], context)?.id).toBe("tenant");
  });

  it("G8 includes customerGroupId in specificity without changing ungrouped resolution", () => {
    const base: MatchingPriceRule = {
      id: "base", tenantId: "t1", organizationId: null, menuItemId: "m1", variantId: null,
      branchId: null, channel: null, fulfillmentType: null, startDate: null, endDate: null,
      startTime: null, endTime: null, priority: 0, price: "100", taxRate: null,
    };
    const group: MatchingPriceRule = { ...base, id: "vip", customerGroupId: "vip", price: "80" };
    expect(selectPriceRule([base, group], context)?.id).toBe("base");
    expect(selectPriceRule([base, group], { ...context, customerGroupId: "vip" })?.id).toBe("vip");
  });
});
