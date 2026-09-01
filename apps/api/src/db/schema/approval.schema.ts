import {
  index,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { users } from "./auth.schema";

export const voidCompActionEnum = pgEnum("void_comp_action", ["VOID", "COMP"]);

export const voidCompApprovalThresholds = pgTable(
  "void_comp_approval_thresholds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actionType: voidCompActionEnum("action_type").notNull(),
    thresholdAmount: numeric("threshold_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    requiresRole: varchar("requires_role", { length: 50 })
      .notNull()
      .default("Manager"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantActionUnique: uniqueIndex(
      "void_comp_threshold_tenant_action_unique",
    ).on(t.tenantId, t.actionType),
  }),
);

export const managerApprovalTokens = pgTable(
  "manager_approval_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    approvedBy: uuid("approved_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: voidCompActionEnum("action_type").notNull(),
    orderId: uuid("order_id").notNull(),
    orderItemId: uuid("order_item_id").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    lookupIdx: index("manager_approval_tokens_lookup_idx").on(
      t.tenantId,
      t.orderId,
      t.orderItemId,
      t.actionType,
    ),
  }),
);
