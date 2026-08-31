import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  time,
  date,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
  unique,
  jsonb,
  check,
  foreignKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { users } from "./user.schema";
import { taxModeEnum } from "./tax.schema";
import { organizations } from "./organization.schema";

// Multi-state item availability is the persisted source of truth. API read
// models may derive a convenient `isAvailable` boolean from these signals.
export const menuItemStatusEnum = pgEnum("menu_item_status", [
  "ACTIVE",
  "OUT_OF_STOCK",
  "HIDDEN",
  "SEASONAL",
  "DISCONTINUED",
]);

export const foodTypeEnum = pgEnum("food_type", ["VEG", "NON_VEG", "EGG"]);
export const menuItemDisplayModeEnum = pgEnum("menu_item_display_mode", ["STANDARD", "GUIDED_BUILDER"]);

export const spiceLevelEnum = pgEnum("spice_level", [
  "NONE",
  "MILD",
  "MEDIUM",
  "HOT",
]);

export const modifierSelectionTypeEnum = pgEnum("modifier_selection_type", [
  "SINGLE",
  "MULTIPLE",
]);
export const modifierGroupTypeEnum = pgEnum("modifier_group_type", ["ADDON", "SUBSTITUTION"]);
export const comboPricePolicyEnum = pgEnum("combo_price_policy", ["FIXED", "PERCENT_OFF_SUM"]);
export const zonePricingRuleEnum = pgEnum("zone_pricing_rule", ["AVERAGE", "HIGHER", "SUM_HALF"]);
export const pricingModeEnum = pgEnum("pricing_mode", ["FIXED", "WEIGHT_BASED", "OPEN"]);
export const weightUnitEnum = pgEnum("weight_unit", ["G", "KG", "LB", "OZ"]);

export const menuStatusEnum = pgEnum("menu_status", ["DRAFT", "PUBLISHED"]);
export const menuChangeEntityTypeEnum = pgEnum("menu_change_entity_type", [
  "MENU_ITEM",
  "VARIANT",
  "MODIFIER_GROUP",
  "MODIFIER_OPTION",
  "CATEGORY",
  "MENU",
  "MENU_MEMBERSHIP",
  "PRICE_RULE",
  "PROMOTION",
  "RECIPE",
  "SUB_RECIPE",
  "TEMPLATE",
  "AVAILABILITY",
  "TAG",
]);
export const menuChangeTypeEnum = pgEnum("menu_change_type", [
  "CREATED",
  "UPDATED",
  "PUBLISHED",
  "ARCHIVED",
  "DELETED",
]);

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    status: menuStatusEnum("status").notNull().default("DRAFT"),
    isDefault: boolean("is_default").notNull().default(false),
    availableChannels: text("available_channels").array(),
    availableFulfillmentTypes: text("available_fulfillment_types").array(),
    availableBranchIds: uuid("available_branch_ids").array(),
    effectiveFrom: timestamp("effective_from"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantStatusIdx: index("menus_tenant_status_idx").on(t.tenantId, t.status),
    organizationStatusIdx: index("menus_organization_status_idx")
      .on(t.organizationId, t.status)
      .where(sql`${t.organizationId} IS NOT NULL`),
    tenantName: uniqueIndex("menus_tenant_name_unique").on(t.tenantId, t.name).where(sql`${t.tenantId} IS NOT NULL`),
    organizationName: uniqueIndex("menus_organization_name_unique").on(t.organizationId, t.name).where(sql`${t.organizationId} IS NOT NULL`),
    oneDefault: uniqueIndex("menus_one_default_per_tenant")
      .on(t.tenantId)
      .where(sql`${t.isDefault} = true AND ${t.tenantId} IS NOT NULL`),
    oneOrgDefault: uniqueIndex("menus_one_default_per_organization")
      .on(t.organizationId)
      .where(sql`${t.isDefault} = true AND ${t.organizationId} IS NOT NULL`),
    exactlyOneOwnerScope: check(
      "menus_exactly_one_owner_scope",
      sql`(${t.tenantId} IS NOT NULL) <> (${t.organizationId} IS NOT NULL)`,
    ),
  }),
);

export const menuCategories = pgTable(
  "menu_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("menu_categories_tenant_idx").on(t.tenantId),
    branchTenantFk: foreignKey({
      name: "menu_categories_branch_tenant_fk",
      columns: [t.branchId, t.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
    }).onDelete("cascade"),
  }),
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    basePrice: numeric("base_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    pricingMode: pricingModeEnum("pricing_mode").notNull().default("FIXED"),
    weightUnit: weightUnitEnum("weight_unit"),
    openPriceMin: numeric("open_price_min", { precision: 10, scale: 2 }),
    openPriceMax: numeric("open_price_max", { precision: 10, scale: 2 }),
    supportsZones: boolean("supports_zones").notNull().default(false),
    zonePricingRule: zonePricingRuleEnum("zone_pricing_rule").notNull().default("HIGHER"),
    manualStockCount: integer("manual_stock_count"),
    manualStockCountUpdatedAt: timestamp("manual_stock_count_updated_at"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxMode: taxModeEnum("tax_mode"),
    imageUrl: varchar("image_url", { length: 500 }),
    foodType: foodTypeEnum("food_type").notNull().default("VEG"),
    spiceLevel: spiceLevelEnum("spice_level"),
    sku: varchar("sku", { length: 50 }),
    prepTimeMinutes: integer("prep_time_minutes"),
    sortOrder: integer("sort_order").notNull().default(0),
    hsnCode: varchar("hsn_code", { length: 20 }),
    // ─── Availability status (multi-state) ───────────────────────────────
    status: menuItemStatusEnum("status").notNull().default("ACTIVE"),
    availabilityReason: varchar("availability_reason", { length: 500 }),
    statusChangedAt: timestamp("status_changed_at").notNull().defaultNow(),
    // Human-set availability always outranks computed/scheduled state. Null means
    // no manual override and the normal computed precedence is used.
    manualOverrideStatus: menuItemStatusEnum("manual_override_status"),
    manualOverrideReason: varchar("manual_override_reason", { length: 500 }),
    manualOverrideSetBy: uuid("manual_override_set_by").references(() => users.id, {
      onDelete: "set null",
    }),
    manualOverrideSetAt: timestamp("manual_override_set_at"),
    // Recipes (see `recipes` table below) auto-deduct inventory and flip
    // status to OUT_OF_STOCK when depleted — items with no meaningful
    // ingredient tracking (e.g. a soft drink counted as its own inventory
    // unit) can opt out and keep status fully manual.
    enableRecipeDeduction: boolean("enable_recipe_deduction")
      .notNull()
      .default(true),
    displayMode: menuItemDisplayModeEnum("display_mode").notNull().default("STANDARD"),
    effectiveFrom: timestamp("effective_from"),
    // ─── Draft / Publish workflow ─────────────────────────────────────────
    // Separate from `status` above: status governs whether a *live* item is
    // currently orderable (ACTIVE/OUT_OF_STOCK/etc); isPublished governs
    // whether the item exists on the live menu at all. A draft item is
    // invisible to ordering flows and non-manager roles regardless of its
    // status, so a half-finished item (no price set, recipe not built yet)
    // can be worked on without appearing to waiters or customers. Defaults
    // to true so every item that existed before this feature stays visible.
    isPublished: boolean("is_published").notNull().default(true),
    publishedAt: timestamp("published_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("menu_items_tenant_idx").on(t.tenantId),
    categoryIdx: index("menu_items_category_idx").on(t.categoryId),
    statusIdx: index("menu_items_status_idx").on(
      t.tenantId,
      t.branchId,
      t.status,
    ),
    manualStockCountIdx: index("menu_items_manual_stock_count_idx")
      .on(t.tenantId, t.manualStockCount)
      .where(sql`${t.manualStockCount} IS NOT NULL`),
    openPriceBandValid: check(
      "menu_items_open_price_band_valid",
      sql`${t.openPriceMin} IS NULL OR ${t.openPriceMax} IS NULL OR ${t.openPriceMin} <= ${t.openPriceMax}`,
    ),
    manualStockCountNonnegative: check(
      "menu_items_manual_stock_count_nonnegative",
      sql`${t.manualStockCount} IS NULL OR ${t.manualStockCount} >= 0`,
    ),
  }),
);

export const menuMemberships = pgTable(
  "menu_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => menuCategories.id),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqueMembership: uniqueIndex("menu_memberships_menu_item_unique").on(
      t.menuId,
      t.menuItemId,
    ),
    categoryOrderIdx: index("menu_memberships_category_order_idx").on(
      t.menuId,
      t.categoryId,
      t.sortOrder,
    ),
    itemIdx: index("menu_memberships_item_idx").on(t.menuItemId),
  }),
);

export const organizationMenuItems = pgTable(
  "organization_menu_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuId: uuid("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
    itemSku: varchar("item_sku", { length: 50 }).notNull(),
    categoryName: varchar("category_name", { length: 100 }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ menuSkuUnique: uniqueIndex("organization_menu_items_menu_sku_unique").on(t.menuId, t.itemSku) }),
);

// Append-only menu history. There is deliberately no historical backfill:
// events become authoritative from the migration deployment time onward.
export const menuChangeEvents = pgTable(
  "menu_change_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entityType: menuChangeEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    changeType: menuChangeTypeEnum("change_type").notNull(),
    diff: jsonb("diff").notNull().default({}),
    changedBy: uuid("changed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    changedAt: timestamp("changed_at").notNull().defaultNow(),
  },
  (t) => ({
    entityHistoryIdx: index("menu_change_events_entity_history_idx").on(
      t.tenantId,
      t.entityType,
      t.entityId,
      t.changedAt,
    ),
    tenantTimeIdx: index("menu_change_events_tenant_time_idx").on(
      t.tenantId,
      t.changedAt,
    ),
  }),
);

// Variants (e.g. "Half" / "Full") are independently-priced options, not
// add-ons — `price` is the absolute price for the item when this variant is
// selected, replacing basePrice rather than adding to it. Modifiers
// (modifier_options below) are the additive kind, e.g. "Extra Cheese +₹30".
export const menuItemVariants = pgTable(
  "menu_item_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    status: menuItemStatusEnum("status").notNull().default("ACTIVE"),
    manualOverrideStatus: menuItemStatusEnum("manual_override_status"),
    manualOverrideReason: varchar("manual_override_reason", { length: 500 }),
    manualStockCount: integer("manual_stock_count"),
    manualStockCountUpdatedAt: timestamp("manual_stock_count_updated_at"),
  },
  (t) => ({
    manualStockCountIdx: index("menu_item_variants_manual_stock_count_idx")
      .on(t.manualStockCount)
      .where(sql`${t.manualStockCount} IS NOT NULL`),
    manualStockCountNonnegative: check(
      "menu_item_variants_manual_stock_count_nonnegative",
      sql`${t.manualStockCount} IS NULL OR ${t.manualStockCount} >= 0`,
    ),
  }),
);

// ─── Modifier Groups ──────────────────────────────────────────────────────────
// Reusable "questions" (e.g. "Choose your sides") with selection rules,
// attached to whichever items need them via menu_item_modifier_groups —
// replaces the old flat menu_item_modifiers table, which had no grouping
// or selection-rule concept and required duplicating an option like "Extra
// Cheese" on every item it applied to.

export const modifierGroups = pgTable(
  "modifier_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 100 }).notNull(),
    selectionType: modifierSelectionTypeEnum("selection_type")
      .notNull()
      .default("SINGLE"),
    groupType: modifierGroupTypeEnum("group_type").notNull().default("ADDON"),
    minSelections: integer("min_selections").notNull().default(0),
    maxSelections: integer("max_selections"),
    sortOrder: integer("sort_order").notNull().default(0),
    dependsOnOptionId: uuid("depends_on_option_id").references(
      (): AnyPgColumn => modifierOptions.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("modifier_groups_tenant_idx").on(t.tenantId),
    branchTenantFk: foreignKey({
      name: "modifier_groups_branch_tenant_fk",
      columns: [t.branchId, t.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
    }).onDelete("cascade"),
  }),
);

export const modifierOptions = pgTable("modifier_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  modifierGroupId: uuid("modifier_group_id")
    .notNull()
    .references(() => modifierGroups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  additionalPrice: numeric("additional_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  // Store independent availability signals only. The effective boolean is
  // derived at the API boundary so recipe replenishment can never silently
  // clear a manager hold.
  computedAvailability: boolean("computed_availability").notNull().default(true),
  manualOverrideAvailability: boolean("manual_override_availability"),
  maxQuantity: integer("max_quantity").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  replacesDefaultComponent: varchar("replaces_default_component", { length: 200 }),
});

export const modifierOptionVariantPrices = pgTable(
  "modifier_option_variant_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modifierOptionId: uuid("modifier_option_id").notNull().references(() => modifierOptions.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").notNull().references(() => menuItemVariants.id, { onDelete: "cascade" }),
    additionalPrice: numeric("additional_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    optionVariantUnique: uniqueIndex("modifier_option_variant_prices_option_variant_unique").on(t.modifierOptionId, t.variantId),
    variantIdx: index("modifier_option_variant_prices_variant_idx").on(t.variantId),
  }),
);

export const menuItemModifierGroups = pgTable(
  "menu_item_modifier_groups",
  {
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    modifierGroupId: uuid("modifier_group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.modifierGroupId] }) }),
);

export const combos = pgTable("combos", {
  id: uuid("id").primaryKey().defaultRandom(), tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(), description: text("description"), pricePolicy: comboPricePolicyEnum("price_policy").notNull(),
  fixedPrice: numeric("fixed_price", { precision: 10, scale: 2 }), percentOff: numeric("percent_off", { precision: 5, scale: 2 }),
  status: menuItemStatusEnum("status").notNull().default("ACTIVE"), createdAt: timestamp("created_at").notNull().defaultNow(), updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const comboSlots = pgTable("combo_slots", {
  id: uuid("id").primaryKey().defaultRandom(), comboId: uuid("combo_id").notNull().references(() => combos.id, { onDelete: "cascade" }), name: varchar("name", { length: 150 }).notNull(), minSelections: integer("min_selections").notNull().default(1), maxSelections: integer("max_selections").notNull().default(1), sortOrder: integer("sort_order").notNull().default(0),
});
export const comboSlotOptions = pgTable("combo_slot_options", {
  id: uuid("id").primaryKey().defaultRandom(), slotId: uuid("slot_id").notNull().references(() => comboSlots.id, { onDelete: "cascade" }), menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id), variantId: uuid("variant_id").references(() => menuItemVariants.id), upcharge: numeric("upcharge", { precision: 10, scale: 2 }).notNull().default("0"), isUnlimitedRefill: boolean("is_unlimited_refill").notNull().default(false),
});

// ─── Tags & Allergens ─────────────────────────────────────────────────────────

export const menuTags = pgTable("menu_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuItemTags = pgTable(
  "menu_item_tags",
  {
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => menuTags.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.tagId] }) }),
);

// Fixed, platform-seeded list — not tenant-editable, so allergen labeling
// stays consistent across every restaurant on the platform.
export const menuAllergens = pgTable("menu_allergens", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const menuItemAllergens = pgTable(
  "menu_item_allergens",
  {
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    allergenId: uuid("allergen_id")
      .notNull()
      .references(() => menuAllergens.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.allergenId] }) }),
);

// Simple URL gallery, not a real upload pipeline — this environment has no
// object storage (S3/R2/etc.) wired up, so this stores externally-hosted
// image URLs rather than accepting file uploads directly.
export const menuItemImages = pgTable("menu_item_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 500 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Menu Scheduling ────────────────────────────────────────────────────────

export const menuItemScheduleTypeEnum = pgEnum("menu_item_schedule_type", [
  "DAILY", // recurring time window every day
  "WEEKLY", // recurring time window on one day of the week
  "SPECIFIC_DATE", // a fixed date range (e.g. a festival menu)
  "HOLIDAY", // ties to a row in `holidays` by name
]);

export const menuItemSchedules = pgTable(
  "menu_item_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    // NULL = applies at every branch.
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),

    scheduleType: menuItemScheduleTypeEnum("schedule_type").notNull(),

    // DAILY / WEEKLY
    startTime: time("start_time"),
    endTime: time("end_time"),
    dayOfWeek: integer("day_of_week"), // 0=Sunday .. 6=Saturday, WEEKLY only

    // SPECIFIC_DATE
    startDate: date("start_date"),
    endDate: date("end_date"),

    // HOLIDAY
    holidayName: varchar("holiday_name", { length: 255 }),

    // What the item's status becomes while this schedule is in effect.
    statusDuringPeriod: menuItemStatusEnum("status_during_period")
      .notNull()
      .default("ACTIVE"),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    menuItemIdx: index("menu_schedules_menu_item_idx").on(t.menuItemId),
    branchIdx: index("menu_schedules_branch_idx").on(t.branchId),
    activeIdx: index("menu_schedules_active_idx").on(t.isActive),
    branchTenantFk: foreignKey({
      name: "menu_item_schedules_branch_tenant_fk",
      columns: [t.branchId, t.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
    }).onDelete("cascade"),
  }),
);

export const menuSchedules = pgTable(
  "menu_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id").notNull().references(() => menus.id, { onDelete: "cascade" }),
    scheduleType: menuItemScheduleTypeEnum("schedule_type").notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    dayOfWeek: integer("day_of_week"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    holidayName: varchar("holiday_name", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ menuIdx: index("menu_schedules_menu_idx").on(t.menuId) }),
);

export const holidays = pgTable(
  "holidays",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    holidayDate: date("holiday_date").notNull(),
    // Optional — lets a multi-region tenant have different holiday
    // calendars per region without needing separate tenants.
    region: varchar("region", { length: 100 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex("holidays_tenant_date_region_unique").on(
      t.tenantId,
      t.holidayDate,
      t.region,
    ),
  }),
);

// ─── Branch Menu Overrides ──────────────────────────────────────────────────
// menu_items.branch_id already splits items into "tenant-wide" (NULL) vs
// "exclusive to one branch" (set) — see the query pattern used throughout
// this file: `or(eq(menuItems.branchId, branchId), isNull(menuItems.branchId))`.
// This table adds a third case on top of that: a tenant-wide item that needs
// a *different* price/status/visibility at one specific branch, without
// forking into a separate row. Only valid against tenant-wide items — a
// branch-exclusive item has no other branch to diverge from, so the
// repository layer rejects overrides targeting one (see repository.ts).
export const menuItemBranchOverrides = pgTable(
  "menu_item_branch_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    // NULL on any of these = "not overridden, use the base item's value".
    price: numeric("price", { precision: 10, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
    prepTimeMinutes: integer("prep_time_minutes"),
    status: menuItemStatusEnum("status"),
    isHidden: boolean("is_hidden").notNull().default(false),
    availabilityReason: varchar("availability_reason", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    branchIdx: index("menu_item_branch_overrides_branch_idx").on(
      t.tenantId,
      t.branchId,
    ),
    unique: uniqueIndex("menu_item_branch_overrides_item_branch_unique").on(
      t.menuItemId,
      t.branchId,
    ),
    branchTenantFk: foreignKey({
      name: "menu_item_branch_overrides_branch_tenant_fk",
      columns: [t.branchId, t.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
    }).onDelete("cascade"),
  }),
);

export const menuItemChannelOverrides = pgTable(
  "menu_item_channel_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    fulfillmentType: text("fulfillment_type"),
    status: menuItemStatusEnum("status"),
    isHidden: boolean("is_hidden").notNull().default(false),
    availabilityReason: varchar("availability_reason", { length: 500 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    itemChannelIdx: index("menu_item_channel_overrides_item_channel_idx").on(t.menuItemId, t.channel),
    scopeUnique: uniqueIndex("menu_item_channel_overrides_scope_unique").on(
      sql`${t.menuItemId}`,
      sql`${t.channel}`,
      sql`COALESCE(${t.fulfillmentType}, '')`,
    ),
  }),
);

// ─── Menu Templates ─────────────────────────────────────────────────────────
// A template is a frozen snapshot of one category's items at the moment it
// was saved — not a live link back to that category. Editing the original
// category later never changes the template, and applying a template never
// changes the original; each is independent once captured. Only tenant-wide
// items (branchId IS NULL) can be snapshotted — a branch-exclusive item is
// already tied to one branch, so it doesn't make sense as a portable
// template. Applying a template always creates items as drafts (see
// isPublished on menu_items) so a manager can review prices/details before
// they go live at the target branch.
export const menuTemplates = pgTable(
  "menu_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    // Name of the category this was snapshotted from, kept for display only
    // — not a foreign key, since the source category may since be renamed,
    // moved, or deleted without invalidating the template.
    sourceCategoryName: varchar("source_category_name", { length: 200 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index("menu_templates_tenant_idx").on(t.tenantId) }),
);

export const menuTemplateItems = pgTable(
  "menu_template_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => menuTemplates.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    basePrice: numeric("base_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    pricingMode: pricingModeEnum("pricing_mode").notNull().default("FIXED"),
    weightUnit: weightUnitEnum("weight_unit"),
    openPriceMin: numeric("open_price_min", { precision: 10, scale: 2 }),
    openPriceMax: numeric("open_price_max", { precision: 10, scale: 2 }),
    supportsZones: boolean("supports_zones").notNull().default(false),
    zonePricingRule: zonePricingRuleEnum("zone_pricing_rule").notNull().default("HIGHER"),
    manualStockCount: integer("manual_stock_count"),
    manualStockCountUpdatedAt: timestamp("manual_stock_count_updated_at"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 })
      .notNull()
      .default("0"),
    taxMode: taxModeEnum("tax_mode"),
    foodType: foodTypeEnum("food_type").notNull().default("VEG"),
    spiceLevel: spiceLevelEnum("spice_level"),
    prepTimeMinutes: integer("prep_time_minutes"),
    hsnCode: varchar("hsn_code", { length: 20 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => ({
    templateIdx: index("menu_template_items_template_idx").on(t.templateId),
  }),
);
