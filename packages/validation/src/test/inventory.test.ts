import { describe, expect, it } from "vitest";
import {
  createInventoryItemSchema,
  updateInventoryStockSchema,
} from "../inventory";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const valid = {
  name: "Rice",
  unit: "KG" as const,
  currentStock: 10,
  minimumStock: 2,
  reorderPoint: 5,
  costPerUnit: 40,
};

describe("createInventoryItemSchema", () => {
  it("accepts a valid inventory item and optional branch", () => {
    expect(
      createInventoryItemSchema.parse({ ...valid, branchId: uuid }).branchId,
    ).toBe(uuid);
  });
  it("rejects unsupported units and negative numeric values", () => {
    expect(
      createInventoryItemSchema.safeParse({ ...valid, unit: "BOX" }).success,
    ).toBe(false);
    for (const field of [
      "currentStock",
      "minimumStock",
      "reorderPoint",
      "costPerUnit",
    ]) {
      expect(
        createInventoryItemSchema.safeParse({ ...valid, [field]: -1 }).success,
      ).toBe(false);
    }
  });
});

describe("updateInventoryStockSchema", () => {
  it("accepts positive quantities and supported transaction types", () => {
    for (const transactionType of [
      "IN",
      "OUT",
      "ADJUSTMENT",
      "WASTE",
    ] as const) {
      expect(
        updateInventoryStockSchema.safeParse({ quantity: 1, transactionType })
          .success,
      ).toBe(true);
    }
  });
  it("rejects zero/negative quantities and oversized notes", () => {
    expect(
      updateInventoryStockSchema.safeParse({
        quantity: 0,
        transactionType: "IN",
      }).success,
    ).toBe(false);
    expect(
      updateInventoryStockSchema.safeParse({
        quantity: -1,
        transactionType: "IN",
      }).success,
    ).toBe(false);
    expect(
      updateInventoryStockSchema.safeParse({
        quantity: 1,
        transactionType: "IN",
        notes: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});
