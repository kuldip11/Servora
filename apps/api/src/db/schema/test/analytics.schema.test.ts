import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { auditLogs } from "../analytics.schema";

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

describe("analytics.schema.ts", () => {
  it("defines audit_logs with its contract columns", () => {
    expectTable(auditLogs, "audit_logs", [
      "id",
      "tenantId",
      "userId",
      "action",
      "entity",
      "entityId",
      "metadata",
      "ipAddress",
      "createdAt",
    ]);
  });
});
