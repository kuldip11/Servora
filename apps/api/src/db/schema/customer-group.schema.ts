import { check, index, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenant.schema";

export const customerGroups = pgTable(
  "customer_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
    discountFixed: numeric("discount_fixed", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantNameUnique: uniqueIndex("customer_groups_tenant_name_unique").on(t.tenantId, t.name),
    tenantIdx: index("customer_groups_tenant_idx").on(t.tenantId),
    discountAtMostOne: check("customer_groups_discount_at_most_one", sql`NOT (${t.discountPercent} IS NOT NULL AND ${t.discountFixed} IS NOT NULL)`),
    discountPercentValid: check(
      "customer_groups_discount_percent_valid",
      sql`${t.discountPercent} IS NULL OR (${t.discountPercent} > 0 AND ${t.discountPercent} <= 100)`,
    ),
    discountFixedValid: check(
      "customer_groups_discount_fixed_valid",
      sql`${t.discountFixed} IS NULL OR ${t.discountFixed} >= 0`,
    ),
  }),
);
