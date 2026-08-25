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
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';
import { branches } from './branch.schema';

// Multi-state item availability — replaces the old binary `isAvailable`
// flag (kept as a derived/synced column for backward compat with the
// waiter-app ordering views, which just check `isAvailable`).
export const menuItemStatusEnum = pgEnum('menu_item_status', [
  'ACTIVE',
  'OUT_OF_STOCK',
  'HIDDEN',
  'SEASONAL',
  'DISCONTINUED',
]);

export const foodTypeEnum = pgEnum('food_type', ['VEG', 'NON_VEG', 'EGG']);

export const spiceLevelEnum = pgEnum('spice_level', ['NONE', 'MILD', 'MEDIUM', 'HOT']);

export const modifierSelectionTypeEnum = pgEnum('modifier_selection_type', ['SINGLE', 'MULTIPLE']);

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('menu_categories_tenant_idx').on(t.tenantId) }),
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => menuCategories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 })
      .notNull()
      .default('0'),
    isAvailable: boolean('is_available').notNull().default(true),
    imageUrl: varchar('image_url', { length: 500 }),
    foodType: foodTypeEnum('food_type').notNull().default('VEG'),
    spiceLevel: spiceLevelEnum('spice_level'),
    sku: varchar('sku', { length: 50 }),
    prepTimeMinutes: integer('prep_time_minutes'),
    sortOrder: integer('sort_order').notNull().default(0),
    hsnCode: varchar('hsn_code', { length: 20 }),
    // ─── Availability status (multi-state) ───────────────────────────────
    status: menuItemStatusEnum('status').notNull().default('ACTIVE'),
    availabilityReason: varchar('availability_reason', { length: 500 }),
    statusChangedAt: timestamp('status_changed_at').notNull().defaultNow(),
    // Recipes (see `recipes` table below) auto-deduct inventory and flip
    // status to OUT_OF_STOCK when depleted — items with no meaningful
    // ingredient tracking (e.g. a soft drink counted as its own inventory
    // unit) can opt out and keep status fully manual.
    enableRecipeDeduction: boolean('enable_recipe_deduction').notNull().default(true),
    // ─── Draft / Publish workflow ─────────────────────────────────────────
    // Separate from `status` above: status governs whether a *live* item is
    // currently orderable (ACTIVE/OUT_OF_STOCK/etc); isPublished governs
    // whether the item exists on the live menu at all. A draft item is
    // invisible to ordering flows and non-manager roles regardless of its
    // status, so a half-finished item (no price set, recipe not built yet)
    // can be worked on without appearing to waiters or customers. Defaults
    // to true so every item that existed before this feature stays visible.
    isPublished: boolean('is_published').notNull().default(true),
    publishedAt: timestamp('published_at'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('menu_items_tenant_idx').on(t.tenantId),
    categoryIdx: index('menu_items_category_idx').on(t.categoryId),
    statusIdx: index('menu_items_status_idx').on(t.tenantId, t.branchId, t.status),
  }),
);

// Variants (e.g. "Half" / "Full") are independently-priced options, not
// add-ons — `price` is the absolute price for the item when this variant is
// selected, replacing basePrice rather than adding to it. Modifiers
// (modifier_options below) are the additive kind, e.g. "Extra Cheese +₹30".
export const menuItemVariants = pgTable('menu_item_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menuItems.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
});

// ─── Modifier Groups ──────────────────────────────────────────────────────────
// Reusable "questions" (e.g. "Choose your sides") with selection rules,
// attached to whichever items need them via menu_item_modifier_groups —
// replaces the old flat menu_item_modifiers table, which had no grouping
// or selection-rule concept and required duplicating an option like "Extra
// Cheese" on every item it applied to.

export const modifierGroups = pgTable(
  'modifier_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    selectionType: modifierSelectionTypeEnum('selection_type').notNull().default('SINGLE'),
    minSelections: integer('min_selections').notNull().default(0),
    maxSelections: integer('max_selections'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('modifier_groups_tenant_idx').on(t.tenantId) }),
);

export const modifierOptions = pgTable('modifier_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  modifierGroupId: uuid('modifier_group_id')
    .notNull()
    .references(() => modifierGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  additionalPrice: numeric('additional_price', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  isAvailable: boolean('is_available').notNull().default(true),
  maxQuantity: integer('max_quantity').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const menuItemModifierGroups = pgTable(
  'menu_item_modifier_groups',
  {
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    modifierGroupId: uuid('modifier_group_id')
      .notNull()
      .references(() => modifierGroups.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.modifierGroupId] }) }),
);

// ─── Tags & Allergens ─────────────────────────────────────────────────────────

export const menuTags = pgTable('menu_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const menuItemTags = pgTable(
  'menu_item_tags',
  {
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => menuTags.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.tagId] }) }),
);

// Fixed, platform-seeded list — not tenant-editable, so allergen labeling
// stays consistent across every restaurant on the platform.
export const menuAllergens = pgTable('menu_allergens', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

export const menuItemAllergens = pgTable(
  'menu_item_allergens',
  {
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    allergenId: uuid('allergen_id')
      .notNull()
      .references(() => menuAllergens.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.menuItemId, t.allergenId] }) }),
);

// Simple URL gallery, not a real upload pipeline — this environment has no
// object storage (S3/R2/etc.) wired up, so this stores externally-hosted
// image URLs rather than accepting file uploads directly.
export const menuItemImages = pgTable('menu_item_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menuItems.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

// ─── Menu Scheduling ────────────────────────────────────────────────────────

export const menuItemScheduleTypeEnum = pgEnum('menu_item_schedule_type', [
  'DAILY', // recurring time window every day
  'WEEKLY', // recurring time window on one day of the week
  'SPECIFIC_DATE', // a fixed date range (e.g. a festival menu)
  'HOLIDAY', // ties to a row in `holidays` by name
]);

export const menuItemSchedules = pgTable(
  'menu_item_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id, { onDelete: 'cascade' }),
    // NULL = applies at every branch.
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'cascade' }),

    scheduleType: menuItemScheduleTypeEnum('schedule_type').notNull(),

    // DAILY / WEEKLY
    startTime: time('start_time'),
    endTime: time('end_time'),
    dayOfWeek: integer('day_of_week'), // 0=Sunday .. 6=Saturday, WEEKLY only

    // SPECIFIC_DATE
    startDate: date('start_date'),
    endDate: date('end_date'),

    // HOLIDAY
    holidayName: varchar('holiday_name', { length: 255 }),

    // What the item's status becomes while this schedule is in effect.
    statusDuringPeriod: menuItemStatusEnum('status_during_period').notNull().default('ACTIVE'),

    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    menuItemIdx: index('menu_schedules_menu_item_idx').on(t.menuItemId),
    branchIdx: index('menu_schedules_branch_idx').on(t.branchId),
    activeIdx: index('menu_schedules_active_idx').on(t.isActive),
  }),
);

export const holidays = pgTable(
  'holidays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    holidayDate: date('holiday_date').notNull(),
    // Optional — lets a multi-region tenant have different holiday
    // calendars per region without needing separate tenants.
    region: varchar('region', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    unique: uniqueIndex('holidays_tenant_date_region_unique').on(t.tenantId, t.holidayDate, t.region),
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
  'menu_item_branch_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    // NULL on any of these = "not overridden, use the base item's value".
    price: numeric('price', { precision: 10, scale: 2 }),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }),
    prepTimeMinutes: integer('prep_time_minutes'),
    status: menuItemStatusEnum('status'),
    isHidden: boolean('is_hidden').notNull().default(false),
    availabilityReason: varchar('availability_reason', { length: 500 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    branchIdx: index('menu_item_branch_overrides_branch_idx').on(t.tenantId, t.branchId),
    unique: uniqueIndex('menu_item_branch_overrides_item_branch_unique').on(t.menuItemId, t.branchId),
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
  'menu_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    // Name of the category this was snapshotted from, kept for display only
    // — not a foreign key, since the source category may since be renamed,
    // moved, or deleted without invalidating the template.
    sourceCategoryName: varchar('source_category_name', { length: 200 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({ tenantIdx: index('menu_templates_tenant_idx').on(t.tenantId) }),
);

export const menuTemplateItems = pgTable(
  'menu_template_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => menuTemplates.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull().default('0'),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('0'),
    foodType: foodTypeEnum('food_type').notNull().default('VEG'),
    spiceLevel: spiceLevelEnum('spice_level'),
    prepTimeMinutes: integer('prep_time_minutes'),
    hsnCode: varchar('hsn_code', { length: 20 }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (t) => ({ templateIdx: index('menu_template_items_template_idx').on(t.templateId) }),
);
