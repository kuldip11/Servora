import {
  pgTable,
  uuid,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { menuItems } from "./menu.schema";
import { inventoryItems, inventoryUnitEnum } from "./inventory.schema";

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    quantityRequired: numeric("quantity_required", {
      precision: 12,
      scale: 3,
    }).notNull(),
    unit: inventoryUnitEnum("unit").notNull(),
    // Optional ingredients (e.g. "extra chutney on the side") don't block
    // ordering or get auto-deducted when out of stock — only block/deduct
    // for the required ones.
    isOptional: boolean("is_optional").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    menuItemIdx: index("recipes_menu_item_idx").on(t.menuItemId),
    inventoryItemIdx: index("recipes_inventory_item_idx").on(t.inventoryItemId),
    unique: uniqueIndex("recipes_menu_item_inventory_item_unique").on(
      t.menuItemId,
      t.inventoryItemId,
    ),
  }),
);
