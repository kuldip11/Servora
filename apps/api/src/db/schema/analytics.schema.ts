import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";
import { users } from "./auth.schema";

// ─── Analytics ────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
    requestId: varchar("request_id", { length: 64 }),
    action: varchar("action", { length: 100 }).notNull(),
    entity: varchar("entity", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: text("metadata").default("{}"),
    ipAddress: varchar("ip_address", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("audit_logs_tenant_idx").on(t.tenantId),
    tenantCreatedIdx: index("audit_logs_tenant_created_idx").on(t.tenantId, t.createdAt),
    tenantBranchCreatedIdx: index("audit_logs_tenant_branch_created_idx").on(t.tenantId, t.branchId, t.createdAt),
    tenantActionCreatedIdx: index("audit_logs_tenant_action_created_idx").on(t.tenantId, t.action, t.createdAt),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  }),
);
