import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import {
  menuItems,
  menuItemVariants,
  modifierOptions,
} from "./menu.schema";
import { inventoryItems, inventoryUnitEnum } from "./inventory.schema";

/**
 * Prepared components that can be consumed by dish recipes (sauces, dough,
 * stocks, chutneys, etc.).  Yield is expressed in the inventory unit selected
 * by the tenant.  `yieldPercent` is optional:
 * null means 100% usable yield.
 */
export const subRecipes = pgTable(
  "sub_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // Prepared components consume physical stock, which is branch-scoped.
    branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    yieldQuantity: numeric("yield_quantity", { precision: 12, scale: 3 })
      .notNull()
      .default("1"),
    yieldUnit: inventoryUnitEnum("yield_unit").notNull(),
    yieldPercent: numeric("yield_percent", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("sub_recipes_tenant_idx").on(t.tenantId),
    tenantBranchIdx: index("sub_recipes_tenant_branch_idx").on(t.tenantId, t.branchId),
    yieldPercentCheck: check(
      "sub_recipes_yield_percent_check",
      sql`${t.yieldPercent} is null or (${t.yieldPercent} > 0 and ${t.yieldPercent} <= 100)`,
    ),
  }),
);

/**
 * Composition of a prepared component. A row points to exactly one raw
 * inventory item OR another prepared component. The latter enables the
 * depth-limited recursive composition required by E2; cycles are rejected by
 * the service before writes.
 */
export const subRecipeIngredients = pgTable(
  "sub_recipe_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subRecipeId: uuid("sub_recipe_id")
      .notNull()
      .references(() => subRecipes.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id").references(
      () => inventoryItems.id,
      { onDelete: "cascade" },
    ),
    ingredientSubRecipeId: uuid("ingredient_sub_recipe_id").references(
      (): AnyPgColumn => subRecipes.id,
      { onDelete: "cascade" },
    ),
    quantityRequired: numeric("quantity_required", {
      precision: 12,
      scale: 3,
    }).notNull(),
    unit: inventoryUnitEnum("unit").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    subRecipeIdx: index("sub_recipe_ingredients_parent_idx").on(t.subRecipeId),
    inventoryItemIdx: index("sub_recipe_ingredients_inventory_idx").on(
      t.inventoryItemId,
    ),
    nestedSubRecipeIdx: index("sub_recipe_ingredients_nested_idx").on(
      t.ingredientSubRecipeId,
    ),
    sourceCheck: check(
      "sub_recipe_ingredients_source_check",
      sql`((${t.inventoryItemId} is not null)::int + (${t.ingredientSubRecipeId} is not null)::int) = 1`,
    ),
  }),
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    // E2: exactly one of inventoryItemId / subRecipeId is populated.
    inventoryItemId: uuid("inventory_item_id").references(
      () => inventoryItems.id,
      { onDelete: "cascade" },
    ),
    subRecipeId: uuid("sub_recipe_id").references(() => subRecipes.id, {
      onDelete: "cascade",
    }),
    // E1: null means the base item recipe; variant/modifier scopes are optional.
    variantId: uuid("variant_id").references(() => menuItemVariants.id, {
      onDelete: "cascade",
    }),
    modifierOptionId: uuid("modifier_option_id").references(
      () => modifierOptions.id,
      { onDelete: "cascade" },
    ),
    quantityRequired: numeric("quantity_required", {
      precision: 12,
      scale: 3,
    }).notNull(),
    unit: inventoryUnitEnum("unit").notNull(),
    // E3: null means 100% usable yield.
    yieldPercent: numeric("yield_percent", { precision: 5, scale: 2 }),
    // Optional ingredients don't block ordering or auto-deduct.
    isOptional: boolean("is_optional").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    menuItemIdx: index("recipes_menu_item_idx").on(t.menuItemId),
    inventoryItemIdx: index("recipes_inventory_item_idx").on(t.inventoryItemId),
    subRecipeIdx: index("recipes_sub_recipe_idx").on(t.subRecipeId),
    variantIdx: index("recipes_variant_idx").on(t.variantId),
    modifierOptionIdx: index("recipes_modifier_option_idx").on(t.modifierOptionId),
    baseInventoryUnique: uniqueIndex("recipes_base_inventory_unique")
      .on(t.menuItemId, t.inventoryItemId)
      .where(sql`${t.inventoryItemId} is not null and ${t.variantId} is null and ${t.modifierOptionId} is null`),
    baseSubRecipeUnique: uniqueIndex("recipes_base_sub_recipe_unique")
      .on(t.menuItemId, t.subRecipeId)
      .where(sql`${t.subRecipeId} is not null and ${t.variantId} is null and ${t.modifierOptionId} is null`),
    variantInventoryUnique: uniqueIndex("recipes_variant_inventory_unique")
      .on(t.menuItemId, t.variantId, t.inventoryItemId)
      .where(sql`${t.variantId} is not null and ${t.inventoryItemId} is not null`),
    variantSubRecipeUnique: uniqueIndex("recipes_variant_sub_recipe_unique")
      .on(t.menuItemId, t.variantId, t.subRecipeId)
      .where(sql`${t.variantId} is not null and ${t.subRecipeId} is not null`),
    modifierInventoryUnique: uniqueIndex("recipes_modifier_inventory_unique")
      .on(t.menuItemId, t.modifierOptionId, t.inventoryItemId)
      .where(sql`${t.modifierOptionId} is not null and ${t.inventoryItemId} is not null`),
    modifierSubRecipeUnique: uniqueIndex("recipes_modifier_sub_recipe_unique")
      .on(t.menuItemId, t.modifierOptionId, t.subRecipeId)
      .where(sql`${t.modifierOptionId} is not null and ${t.subRecipeId} is not null`),
    sourceCheck: check(
      "recipes_source_check",
      sql`((${t.inventoryItemId} is not null)::int + (${t.subRecipeId} is not null)::int) = 1`,
    ),
    scopeCheck: check(
      "recipes_scope_check",
      sql`not (${t.variantId} is not null and ${t.modifierOptionId} is not null)`,
    ),
    yieldPercentCheck: check(
      "recipes_yield_percent_check",
      sql`${t.yieldPercent} is null or (${t.yieldPercent} > 0 and ${t.yieldPercent} <= 100)`,
    ),
  }),
);
