import { describe, expect, it } from "vitest";
import {
  branchRequiredForInventoryItem,
  insufficientStock,
  inventoryItemNotFound,
} from "../inventory.errors";
describe("inventory errors", () => {
  it("creates a not-found error with the item identity", () => {
    expect(inventoryItemNotFound("i1").toJSON()).toMatchObject({
      code: "NOT_FOUND",
      message: expect.stringContaining("Inventory item"),
    });
    expect(inventoryItemNotFound("i1").message).toContain("i1");
  });
  it("preserves insufficient-stock reason and missing-branch semantics", () => {
    expect(insufficientStock().toJSON()).toMatchObject({
      code: "DOMAIN_RULE_VIOLATION",
    });
    expect(insufficientStock().details).toMatchObject({
      reason: "INVENTORY_INSUFFICIENT_STOCK",
    });
    expect(branchRequiredForInventoryItem()).toMatchObject({
      code: "MISSING_BRANCH",
    });
  });
});
