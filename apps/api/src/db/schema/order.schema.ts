import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { users } from "./auth.schema";
import { restaurantTables } from "./restaurant-table.schema";

// A tab's lifecycle — billing state only. Kitchen prep state now lives on
// kitchen_tickets (see below), not here.
export const orderStatusEnum = pgEnum("order_status", [
  "OPEN",
  "BILL_REQUESTED",
  "PAID",
  "CLOSED",
  "CANCELLED",
]);

export const orderTypeEnum = pgEnum("order_type", [
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "ONLINE",
]);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    tableId: uuid("table_id").references(() => restaurantTables.id),
    customerId: uuid("customer_id"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum("status").notNull().default("OPEN"),
    type: orderTypeEnum("type").notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantBranchIdx: index("orders_tenant_branch_idx").on(
      t.tenantId,
      t.branchId,
    ),
    statusIdx: index("orders_status_idx").on(t.status),
    createdAtIdx: index("orders_created_at_idx").on(t.createdAt),
  }),
);
