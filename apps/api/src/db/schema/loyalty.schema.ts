import {
  check,
  index,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenant.schema";
import { organizations } from "./organization.schema";

export const customerLoyaltyTiers = pgTable(
  "customer_loyalty_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 120 }).notNull(),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
    discountFixed: numeric("discount_fixed", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantNameUnique: uniqueIndex(
      "customer_loyalty_tiers_tenant_name_unique",
    ).on(t.tenantId, t.name),
    organizationNameUnique: uniqueIndex(
      "customer_loyalty_tiers_organization_name_unique",
    )
      .on(t.organizationId, t.name)
      .where(sql`${t.organizationId} IS NOT NULL`),
    scopeExactlyOne: check(
      "customer_loyalty_tiers_scope_exactly_one",
      sql`(${t.tenantId} IS NULL) <> (${t.organizationId} IS NULL)`,
    ),
    discountExactlyOne: check(
      "customer_loyalty_tiers_discount_exactly_one",
      sql`(${t.discountPercent} IS NOT NULL AND ${t.discountFixed} IS NULL AND ${t.discountPercent} > 0 AND ${t.discountPercent} <= 100) OR (${t.discountPercent} IS NULL AND ${t.discountFixed} IS NOT NULL AND ${t.discountFixed} > 0)`,
    ),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    organizationCustomerId: uuid("organization_customer_id"),
    loyaltyTierId: uuid("loyalty_tier_id").references(
      () => customerLoyaltyTiers.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("customers_tenant_idx").on(t.tenantId),
    organizationCustomerIdx: index("customers_organization_customer_idx")
      .on(t.organizationCustomerId)
      .where(sql`${t.organizationCustomerId} IS NOT NULL`),
  }),
);
