import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    code: varchar("code", { length: 24 }).notNull(),
    timezone: varchar("timezone", { length: 64 })
      .notNull()
      .default("Asia/Kolkata"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    address: text("address").notNull(),
    addressLine1: varchar("address_line_1", { length: 300 }),
    addressLine2: varchar("address_line_2", { length: 300 }),
    city: varchar("city", { length: 120 }),
    stateProvince: varchar("state_province", { length: 120 }),
    postalCode: varchar("postal_code", { length: 24 }),
    country: varchar("country", { length: 2 }),
    phone: varchar("phone", { length: 30 }),
    managerName: varchar("manager_name", { length: 150 }),
    email: varchar("email", { length: 255 }),
    openingTime: varchar("opening_time", { length: 5 }),
    closingTime: varchar("closing_time", { length: 5 }),
    weeklyOperatingDays: jsonb("weekly_operating_days").$type<string[]>(),
    taxOverride: numeric("tax_override", { precision: 5, scale: 2 }),
    serviceChargeOverride: numeric("service_charge_override", {
      precision: 5,
      scale: 2,
    }),
    invoicePrefix: varchar("invoice_prefix", { length: 30 }),
    receiptFooter: text("receipt_footer"),
    inventoryTrackingEnabled: boolean("inventory_tracking_enabled")
      .notNull()
      .default(true),
    negativeStockPolicy: varchar("negative_stock_policy", { length: 20 })
      .notNull()
      .default("BLOCK"),
    isActive: boolean("is_active").notNull().default(true),

    dineInEnabled: boolean("dine_in_enabled").notNull().default(true),
    takeawayEnabled: boolean("takeaway_enabled").notNull().default(true),
    deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
    onlineEnabled: boolean("online_enabled").notNull().default(true),
    tablesEnabled: boolean("tables_enabled").notNull().default(true),
    customerQrEnabled: boolean("customer_qr_enabled").notNull().default(true),
    kdsEnabled: boolean("kds_enabled").notNull().default(true),
    waiterAppEnabled: boolean("waiter_app_enabled").notNull().default(true),
    publicTakeawayQrToken: uuid("public_takeaway_qr_token")
      .notNull()
      .defaultRandom()
      .unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("branches_tenant_idx").on(t.tenantId),
    tenantNameUniq: uniqueIndex("branches_tenant_name_uniq").on(
      t.tenantId,
      t.name,
    ),
    tenantCodeUniq: uniqueIndex("branches_tenant_code_uniq").on(
      t.tenantId,
      t.code,
    ),
    idTenantFkTarget: uniqueIndex("branches_id_tenant_unique_fk_target").on(
      t.id,
      t.tenantId,
    ),
  }),
);
