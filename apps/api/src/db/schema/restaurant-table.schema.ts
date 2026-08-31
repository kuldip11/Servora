import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";

export const tableStatusEnum = pgEnum("table_status", [
  "AVAILABLE",
  "OCCUPIED",
  "CLEANING",
  "RESERVED",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const restaurantTables = pgTable(
  "restaurant_tables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    publicQrToken: uuid("public_qr_token").notNull().defaultRandom(),
    capacity: integer("capacity").notNull().default(4),
    status: tableStatusEnum("status").notNull().default("AVAILABLE"),
    section: varchar("section", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantBranchIdx: index("tables_tenant_branch_idx").on(
      t.tenantId,
      t.branchId,
    ),
    publicQrTokenUniq: uniqueIndex("tables_public_qr_token_uniq").on(
      t.publicQrToken,
    ),
    branchTenantFk: foreignKey({
      name: "restaurant_tables_branch_tenant_fk",
      columns: [t.branchId, t.tenantId],
      foreignColumns: [branches.id, branches.tenantId],
    }).onDelete("cascade"),
  }),
);
