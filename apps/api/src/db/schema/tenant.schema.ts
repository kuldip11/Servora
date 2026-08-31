import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";
import { taxModeEnum } from "./tax.schema";

export const roundingPolicyEnum = pgEnum("rounding_policy", ["NONE", "NEAREST_1", "NEAREST_5", "NEAREST_10"]);

// Tenant is the business/franchise isolation boundary. Identity is the
// generated UUID; name is display-only and is intentionally not unique.
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    createdBy: uuid("created_by").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    plan: varchar("plan", { length: 50 }).notNull().default("starter"),
    isActive: boolean("is_active").notNull().default(true),
    serviceChargePercent: numeric("service_charge_percent", { precision: 5, scale: 2 }),
    serviceChargeTaxable: boolean("service_charge_taxable").notNull().default(false),
    roundingPolicy: roundingPolicyEnum("rounding_policy").notNull().default("NONE"),
    defaultTaxMode: taxModeEnum("default_tax_mode").notNull().default("EXCLUSIVE"),
    courseSequencingEnabled: boolean("course_sequencing_enabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    organizationIdx: index("tenants_organization_idx").on(t.organizationId),
  }),
);
