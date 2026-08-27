import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  numeric,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { users } from "./auth.schema";
import { menuItems } from "./menu.schema";
import { orders } from "./order.schema";
import { kitchenTickets } from "./kitchen.schema";

export const inventoryUnitEnum = pgEnum("inventory_unit", [
  "KG",
  "GRAMS",
  "LITERS",
  "ML",
  "PIECES",
  "PACKETS",
]);

export const inventoryTransactionTypeEnum = pgEnum(
  "inventory_transaction_type",
  ["IN", "OUT", "ADJUSTMENT", "WASTE"],
);

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    unit: inventoryUnitEnum("unit").notNull(),
    currentStock: numeric("current_stock", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    minimumStock: numeric("minimum_stock", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    reorderPoint: numeric("reorder_point", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    isActive: boolean("is_active").notNull().default(true),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantBranchIdx: index("inventory_tenant_branch_idx").on(
      t.tenantId,
      t.branchId,
    ),
  }),
);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    transactionType: inventoryTransactionTypeEnum("transaction_type").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    balanceBefore: numeric("balance_before", {
      precision: 12,
      scale: 3,
    }).notNull(),
    balanceAfter: numeric("balance_after", {
      precision: 12,
      scale: 3,
    }).notNull(),
    notes: text("notes"),
    performedBy: uuid("performed_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("inventory_transactions_item_idx").on(t.inventoryItemId),
  }),
);

// Per-order-item audit trail of what inventory a fired ticket actually
// consumed — lets "why did stock X drop" be traced back to specific orders,
// and survives the recipe itself changing later.
export const orderInventoryDeductions = pgTable(
  "order_inventory_deductions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    kitchenTicketId: uuid("kitchen_ticket_id").references(() => kitchenTickets.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    quantityDeducted: numeric("quantity_deducted", {
      precision: 12,
      scale: 3,
    }).notNull(),
    unit: inventoryUnitEnum("unit").notNull(),
    // True if the order asked for more than was in stock — the deduction
    // still floors at 0 rather than going negative, and this flag is how
    // that shortfall shows up in the item's inventory-impact view.
    wasShort: boolean("was_short").notNull().default(false),
    deductedAt: timestamp("deducted_at").notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_inventory_deductions_order_idx").on(t.orderId),
    menuItemIdx: index("order_inventory_deductions_menu_item_idx").on(
      t.menuItemId,
    ),
    ticketIdx: index("order_inventory_deductions_ticket_idx").on(t.kitchenTicketId),
  }),
);
