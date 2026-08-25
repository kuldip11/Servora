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
} from "../item.validator";

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
