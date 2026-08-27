import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("tenant isolation database contract", () => {
  const migration = readFileSync(resolve(process.cwd(), "src/db/migrations/0039_tenant_isolation_guards.sql"), "utf8");
  it("guards tenant-owned role assignment", () => {
    expect(migration).toContain("cross-tenant role assignment is forbidden");
    expect(migration).toContain("membership_roles_tenant_guard");
  });
  it("uses composite branch/tenant foreign keys for operational tables", () => {
    for (const table of ["membership_branches", "restaurant_tables", "inventory_items", "orders", "kitchen_tickets"]) {
      expect(migration).toContain(`ALTER TABLE \"${table}\"`);
      expect(migration).toContain('FOREIGN KEY ("branch_id", "tenant_id")');
    }
  });
});
