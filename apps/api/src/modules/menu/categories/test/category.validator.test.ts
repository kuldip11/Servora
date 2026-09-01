import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  createCategoryBody,
  updateCategoryBody,
  categoryIdParams,
} from "@/modules/menu/categories/category.validator";

describe("category.validator validators", () => {
  it("requires a category name for creation", () => {
    expect(Value.Check(createCategoryBody, {})).toBe(false);
    expect(Value.Check(createCategoryBody, { name: "Drinks" })).toBe(true);
    expect(Value.Check(updateCategoryBody, {})).toBe(true);
  });
  it("requires category id params", () => {
    expect(Value.Check(categoryIdParams, {})).toBe(false);
    expect(Value.Check(categoryIdParams, { id: "c1" })).toBe(true);
  });
});
