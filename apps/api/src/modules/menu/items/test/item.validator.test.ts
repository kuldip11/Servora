import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  createItemBody,
  updateItemBody,
  duplicateItemBody,
  updateItemStatusBody,
  updateItemAvailabilityBody,
  itemIdParams,
  itemStatusParams,
  itemStatusQuery,
} from "@/modules/menu/items/item.validator";

describe("item.validator validators", () => {
  it("requires category, name, and base price for item creation", () => {
    expect(Value.Check(createItemBody, {})).toBe(false);
    expect(
      Value.Check(createItemBody, {
        categoryId: "c1",
        name: "Tea",
        basePrice: 10,
      }),
    ).toBe(true);
    expect(Value.Check(updateItemBody, {})).toBe(true);
    expect(
      Value.Check(createItemBody, {
        categoryId: "c1",
        name: "Tea",
        basePrice: 10,
        taxMode: null,
        effectiveFrom: null,
        availabilityReason: null,
      }),
    ).toBe(true);
    expect(
      Value.Check(updateItemBody, {
        description: null,
        effectiveFrom: null,
        variants: [{ id: "v1", name: "Half", price: 90 }],
      }),
    ).toBe(true);
    expect(
      Value.Check(createItemBody, {
        categoryId: "c1",
        name: "Tea",
        basePrice: 10,
        manualCost: 0,
      }),
    ).toBe(true);
    expect(Value.Check(updateItemBody, { manualCost: null })).toBe(true);
    expect(Value.Check(updateItemBody, { manualCost: -0.01 })).toBe(false);
  });
  it("validates status, availability, and id params", () => {
    expect(Value.Check(duplicateItemBody, {})).toBe(true);
    expect(Value.Check(updateItemStatusBody, {})).toBe(false);
    expect(Value.Check(updateItemStatusBody, { status: "ACTIVE" })).toBe(true);
    expect(Value.Check(updateItemAvailabilityBody, {})).toBe(false);
    expect(Value.Check(updateItemAvailabilityBody, { isAvailable: true })).toBe(
      true,
    );
    expect(Value.Check(itemIdParams, {})).toBe(false);
    expect(Value.Check(itemStatusParams, { status: "ACTIVE" })).toBe(true);
    expect(Value.Check(itemStatusQuery, {})).toBe(true);
  });
});
