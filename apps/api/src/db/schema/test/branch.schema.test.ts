import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { branches } from "../branch.schema";

function expectTable(
  table: Parameters<typeof getTableConfig>[0],
  name: string,
  columns: string[],
) {
  const config = getTableConfig(table);
  expect(config.name).toBe(name);
  expect(Object.keys((table as any)[Symbol.for("drizzle:Columns")])).toEqual(
    expect.arrayContaining(columns),
  );
}

describe("branch.schema.ts", () => {
  it("defines branches with its contract columns", () => {
    expectTable(branches, "branches", [
      "id",
      "tenantId",
      "name",
      "address",
      "phone",
      "isActive",
      "dineInEnabled",
      "takeawayEnabled",
      "deliveryEnabled",
      "onlineEnabled",
      "tablesEnabled",
      "createdAt",
      "updatedAt",
    ]);
  });
});
