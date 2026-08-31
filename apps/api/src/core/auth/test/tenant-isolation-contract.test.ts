import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const migrationsDir = resolve(process.cwd(), "src/db/migrations");

const readTableMigration = (table: string): string => {
  const suffix = `_create_${table}.sql`;
  const name = readdirSync(migrationsDir).find((entry) =>
    entry.endsWith(suffix),
  );
  if (!name)
    throw new Error(`Canonical migration not found for table: ${table}`);
  return readFileSync(resolve(migrationsDir, name), "utf8");
};

describe("tenant isolation database contract", () => {
  it("guards tenant-owned role assignment", () => {
    const migration = readTableMigration("membership_roles");
    expect(migration).toContain("cross-tenant role assignment is forbidden");
    expect(migration).toContain("membership_roles_tenant_guard");
  });

  it("uses composite branch/tenant foreign keys for operational tables", () => {
    for (const table of [
      "membership_branches",
      "restaurant_tables",
      "inventory_items",
      "orders",
      "kitchen_tickets",
    ]) {
      const migration = readTableMigration(table);
      expect(migration).toContain(`CONSTRAINT "${table}_branch_tenant_fk"`);
      expect(migration).toContain('FOREIGN KEY ("branch_id", "tenant_id")');
      expect(migration).toContain('REFERENCES "branches"("id", "tenant_id")');
    }
  });
});
