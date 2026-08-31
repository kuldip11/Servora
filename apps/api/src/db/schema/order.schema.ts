import {
  pgTable,
  uuid,
  numeric,
  text,
  timestamp,
  pgEnum,
  index,
  integer,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { users } from "./auth.schema";
import { restaurantTables } from "./restaurant-table.schema";
import { customerSessions } from "./customer-session.schema";
import { customerGroups } from "./customer-group.schema";

// A tab's lifecycle — billing state only. Kitchen prep state now lives on
// kitchen_tickets (see below), not here.
export const orderStatusEnum = pgEnum("order_status", [
  "OPEN",
  "BILL_REQUESTED",
  "PAID",
  "CLOSED",
  "CANCELLED",
]);

export const orderSourceEnum = pgEnum("order_source", ["STAFF", "CUSTOMER_QR"]);

export const orderTypeEnum = pgEnum("order_type", [
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "ONLINE",
]);
export const billingModeEnum = pgEnum("billing_mode", ["LINE_ITEMS", "PER_COVER"]);

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
    customerGroupId: uuid("customer_group_id").references(() => customerGroups.id, { onDelete: "set null" }),
    mergedIntoOrderId: uuid("merged_into_order_id").references(
      (): AnyPgColumn => orders.id,
      { onDelete: "set null" },
    ),
    createdBy: uuid("created_by").references(() => users.id),
    source: orderSourceEnum("source").notNull().default("STAFF"),
    customerSessionId: uuid("customer_session_id").references(
      () => customerSessions.id,
    ),
    status: orderStatusEnum("status").notNull().default("OPEN"),
    type: orderTypeEnum("type").notNull(),
    billingMode: billingModeEnum("billing_mode").notNull().default("LINE_ITEMS"),
    coverCount: integer("cover_count"),
    perCoverPriceRuleId: uuid("per_cover_price_rule_id"),
    perCoverRate: numeric("per_cover_rate", { precision: 10, scale: 2 }),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    serviceChargeAmount: numeric("service_charge_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    roundingAdjustment: numeric("rounding_adjustment", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    // Exact API-boundary timestamp used by AvailabilityResolver/PricingPipeline.
    // Nullable only for grouping/incomplete replay rows; new real order lines snapshot the exact resolution time.
    resolutionAsOf: timestamp("resolution_as_of"),
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
    mergedIntoIdx: index("orders_merged_into_idx").on(t.mergedIntoOrderId),
  }),
);
