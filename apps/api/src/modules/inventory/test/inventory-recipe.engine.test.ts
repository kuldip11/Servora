import { describe, expect, it } from "vitest";
import {
  aggregateRawNeeds,
  canSatisfyNeeds,
  recipeYieldFactor,
  weightRecipeScale,
} from "../inventory-recipe.engine";

describe("inventory recipe engine", () => {
  it("normalizes weight-priced recipe quantities to kilograms", () => {
    expect(weightRecipeScale(500, "G")).toBe(0.5);
    expect(weightRecipeScale(2, "KG")).toBe(2);
  });

  it("normalizes recipe yield percentages", () => {
    expect(recipeYieldFactor("80")).toBe(0.8);
    expect(recipeYieldFactor(null)).toBe(1);
  });

  it("aggregates repeated raw inventory needs before stock checks", () => {
    const needs = [
      {
        inventoryItemId: "flour",
        name: "Flour",
        currentStock: 3,
        unit: "KG" as const,
        neededQuantity: 1.25,
        costPerUnit: 2,
      },
      {
        inventoryItemId: "flour",
        name: "Flour",
        currentStock: 3,
        unit: "KG" as const,
        neededQuantity: 1.5,
        costPerUnit: 2,
      },
    ];
    expect(aggregateRawNeeds(needs)[0]?.neededQuantity).toBe(2.75);
    expect(canSatisfyNeeds(needs)).toBe(true);
    expect(canSatisfyNeeds([...needs, { ...needs[0]!, neededQuantity: 1 }])).toBe(false);
  });
});
