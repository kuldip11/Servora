import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  restaurantTables,
  tableStatusEnum,
} from "@/db/schema/restaurant-table.schema";
const expectTable = (table: any, name: string, columns: string[]) => {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
};
describe("restaurant-table.schema.ts", () => {
  it("defines restaurant_tables", () =>
    expectTable(restaurantTables, "restaurant_tables", [
      "id",
      "tenantId",
      "branchId",
      "name",
      "publicQrToken",
      "capacity",
      "status",
      "section",
      "isActive",
      "createdAt",
      "updatedAt",
    ]));
  it("keeps table status enum stable", () =>
    expect(tableStatusEnum.enumValues).toEqual([
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "RESERVED",
    ]));
});
