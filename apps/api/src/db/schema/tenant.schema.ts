import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  numeric,
  text,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";
import { taxModeEnum } from "./tax.schema";

export const roundingPolicyEnum = pgEnum("rounding_policy", [
  "NONE",
  "NEAREST_1",
  "NEAREST_5",
  "NEAREST_10",
]);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    displayName: varchar("display_name", { length: 200 }),
    description: text("description"),
    cuisineTypes: jsonb("cuisine_types").$type<string[]>(),
    businessModel: varchar("business_model", { length: 50 }),
    defaultCurrency: varchar("default_currency", { length: 3 }),
    defaultTimezone: varchar("default_timezone", { length: 64 }),
    supportEmail: varchar("support_email", { length: 255 }),
    supportPhone: varchar("support_phone", { length: 30 }),
    website: varchar("website", { length: 500 }),
    logoUrl: varchar("logo_url", { length: 1000 }),
    primaryBrandImageUrl: varchar("primary_brand_image_url", { length: 1000 }),
    createdBy: uuid("created_by").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    plan: varchar("plan", { length: 50 }).notNull().default("starter"),
    isActive: boolean("is_active").notNull().default(true),
    serviceChargePercent: numeric("service_charge_percent", {
      precision: 5,
      scale: 2,
    }),
    serviceChargeTaxable: boolean("service_charge_taxable")
      .notNull()
      .default(false),
    roundingPolicy: roundingPolicyEnum("rounding_policy")
      .notNull()
      .default("NONE"),
    defaultTaxMode: taxModeEnum("default_tax_mode")
      .notNull()
      .default("EXCLUSIVE"),
    defaultTaxRate: numeric("default_tax_rate", { precision: 5, scale: 2 }),
    dineInEnabled: boolean("dine_in_enabled").notNull().default(true),
    takeawayEnabled: boolean("takeaway_enabled").notNull().default(true),
    deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
    customerQrEnabled: boolean("customer_qr_enabled").notNull().default(true),
    tableManagementEnabled: boolean("table_management_enabled")
      .notNull()
      .default(true),
    kdsEnabled: boolean("kds_enabled").notNull().default(true),
    waiterServiceEnabled: boolean("waiter_service_enabled")
      .notNull()
      .default(true),
    courseSequencingEnabled: boolean("course_sequencing_enabled")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    organizationIdx: index("tenants_organization_idx").on(t.organizationId),
  }),
);
