import { describe, expect, it } from "vitest";
import {
  tableNotFound,
  branchNotFound,
  branchRequiredForTable,
  tablesDisabledForBranch,
  tableHasActiveOrder,
  tableHasOpenOrder,
} from "../table.errors";
describe("table errors", () => {
  it("preserves not-found and missing-branch taxonomy", () => {
    expect(tableNotFound("t1").toJSON()).toMatchObject({ code: "NOT_FOUND" });
    expect(tableNotFound("t1").message).toBe("Table with id t1 not found");
    expect(branchNotFound("b1").message).toBe("Branch with id b1 not found");
    expect(branchRequiredForTable().statusCode).toBe(400);
  });
  it("preserves conflict reasons", () => {
    expect(tablesDisabledForBranch().details).toMatchObject({
      reason: "TABLES_DISABLED",
    });
    expect(tableHasActiveOrder().details).toMatchObject({
      reason: "TABLE_HAS_ACTIVE_ORDER",
    });
    expect(tableHasOpenOrder().details).toMatchObject({
      reason: "TABLE_HAS_OPEN_ORDER",
    });
    expect(tableHasOpenOrder().statusCode).toBe(409);
  });
});
