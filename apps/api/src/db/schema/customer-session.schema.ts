import { pgTable, uuid, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { restaurantTables } from "./restaurant-table.schema";

export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    tableId: uuid("table_id")
      .notNull()
      .references(() => restaurantTables.id, { onDelete: "cascade" }),
    token: uuid("token").notNull().defaultRandom().unique(),
    active: boolean("active").notNull().default(true),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tokenIdx: index("customer_sessions_token_idx").on(t.token),
    tableActiveIdx: index("customer_sessions_table_active_idx").on(
      t.tableId,
      t.active,
    ),
  }),
);
