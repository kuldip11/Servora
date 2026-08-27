import { pgTable, pgEnum, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { restaurantTables } from "./restaurant-table.schema";
import { customerSessions } from "./customer-session.schema";
import { orders } from "./order.schema";
import { users } from "./auth.schema";

export const customerRequestTypeEnum = pgEnum("customer_request_type", [
  "CALL_WAITER",
  "WATER",
  "CUTLERY",
  "BILL",
  "ASSISTANCE",
]);

export const customerRequestStatusEnum = pgEnum("customer_request_status", [
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CANCELLED",
]);

export const customerRequests = pgTable("customer_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  branchId: uuid("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  tableId: uuid("table_id").notNull().references(() => restaurantTables.id, { onDelete: "cascade" }),
  customerSessionId: uuid("customer_session_id").notNull().references(() => customerSessions.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  type: customerRequestTypeEnum("type").notNull(),
  status: customerRequestStatusEnum("status").notNull().default("OPEN"),
  note: text("note"),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  branchStatusIdx: index("customer_requests_branch_status_idx").on(t.branchId, t.status),
  sessionIdx: index("customer_requests_session_idx").on(t.customerSessionId),
}));
