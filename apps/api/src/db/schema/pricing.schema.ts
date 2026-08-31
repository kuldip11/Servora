import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  pgEnum,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { branches } from "./branch.schema";
import { menuItems, menuItemVariants } from "./menu.schema";
import { organizations } from "./organization.schema";
import { customerGroups } from "./customer-group.schema";
import { orderSourceEnum, orderTypeEnum } from "./order-enums.schema";
import { tenants } from "./tenant.schema";

export const coverTierEnum = pgEnum("cover_tier", ["ADULT", "CHILD"]);

export const priceRules = pgTable(
  "price_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    menuItemId: uuid("menu_item_id").references(() => menuItems.id, {
      onDelete: "cascade",
    }),
    menuItemSku: varchar("menu_item_sku", { length: 50 }),
    variantId: uuid("variant_id").references(() => menuItemVariants.id, {
      onDelete: "cascade",
    }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    channel: orderSourceEnum("channel"),
    fulfillmentType: orderTypeEnum("fulfillment_type"),
    customerGroupId: uuid("customer_group_id").references(
      () => customerGroups.id,
      { onDelete: "cascade" },
    ),
    coverTier: coverTierEnum("cover_tier"),
    isPerCover: boolean("is_per_cover").notNull().default(false),
    startDate: date("start_date"),
    endDate: date("end_date"),
    startTime: time("start_time"),
    endTime: time("end_time"),
    price: numeric("price", { precision: 10, scale: 2 }),
    percentOff: numeric("percent_off", { precision: 5, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
    priority: integer("priority").notNull().default(0),
    effectiveFrom: timestamp("effective_from"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    lookupIdx: index("price_rules_lookup_idx").on(
      t.tenantId,
      t.menuItemId,
      t.branchId,
      t.channel,
    ),
    organizationSkuIdx: index("price_rules_organization_sku_idx").on(
      t.organizationId,
      t.menuItemSku,
    ),
    customerGroupIdx: index("price_rules_customer_group_idx").on(
      t.customerGroupId,
    ),
    exactlyOneOwnerScope: check(
      "price_rules_exactly_one_owner_scope",
      sql`(${t.tenantId} IS NOT NULL) <> (${t.organizationId} IS NOT NULL)`,
    ),
    scopedRule: check(
      "price_rules_scope_required",
      sql`${t.variantId} IS NOT NULL OR ${t.branchId} IS NOT NULL OR ${t.channel} IS NOT NULL OR ${t.fulfillmentType} IS NOT NULL OR ${t.startDate} IS NOT NULL OR ${t.endDate} IS NOT NULL OR ${t.startTime} IS NOT NULL OR ${t.endTime} IS NOT NULL OR ${t.customerGroupId} IS NOT NULL OR ${t.coverTier} IS NOT NULL OR ${t.organizationId} IS NOT NULL OR ${t.isPerCover} = true`,
    ),
    dateRange: check(
      "price_rules_date_range_valid",
      sql`${t.startDate} IS NULL OR ${t.endDate} IS NULL OR ${t.startDate} <= ${t.endDate}`,
    ),
    valueExactlyOne: check(
      "price_rules_value_exactly_one",
      sql`(${t.price} IS NOT NULL AND ${t.percentOff} IS NULL) OR (${t.price} IS NULL AND ${t.percentOff} IS NOT NULL AND ${t.percentOff} > 0 AND ${t.percentOff} <= 100)`,
    ),
    targetValid: check(
      "price_rules_target_valid",
      sql`(${t.isPerCover} = true AND ${t.menuItemId} IS NULL AND ${t.menuItemSku} IS NULL AND ${t.price} IS NOT NULL AND ${t.percentOff} IS NULL) OR (${t.isPerCover} = false AND ((${t.tenantId} IS NOT NULL AND ${t.menuItemId} IS NOT NULL) OR (${t.organizationId} IS NOT NULL AND ${t.menuItemSku} IS NOT NULL)))`,
    ),
  }),
);
