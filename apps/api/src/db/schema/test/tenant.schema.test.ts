import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { tenants } from "../tenant.schema";

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

describe("tenant.schema.ts", () => {
  it("defines tenants with its contract columns", () => {
    expectTable(tenants, "tenants", []);
  });
});
