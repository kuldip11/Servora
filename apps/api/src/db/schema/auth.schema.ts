import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenant.schema";
import { branches } from "./branch.schema";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);
export const roleScopeEnum = pgEnum("role_scope", [
  "GLOBAL",
  "TENANT",
  "BRANCH",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailLowerUnique: uniqueIndex("users_email_lower_unique")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.deletedAt} IS NULL`),
  }),
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 80 }).notNull(),
    scope: roleScopeEnum("scope").notNull().default("BRANCH"),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantActiveIdx: index("roles_tenant_active_idx").on(
      t.tenantId,
      t.isActive,
    ),
  }),
);

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  module: varchar("module", { length: 50 }).notNull(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => ({
    rolePermissionUniq: uniqueIndex("role_permissions_role_permission_uniq").on(
      t.roleId,
      t.permissionId,
    ),
  }),
);

export const globalUserRoles = pgTable(
  "global_user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => ({
    globalUserRoleUniq: uniqueIndex("global_user_roles_user_role_uniq").on(
      t.userId,
      t.roleId,
    ),
  }),
);

// ─── Multi-tenant memberships ─────────────────────────────────────────────────
//
// A user can belong to multiple tenants. Roles and branch scope are attached
// to the membership rather than directly to the user.

export const tenantMemberships = pgTable(
  "tenant_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userTenantUniq: uniqueIndex("tenant_memberships_user_tenant_uniq").on(
      t.userId,
      t.tenantId,
    ),
    userIdx: index("tenant_memberships_user_idx").on(t.userId),
    tenantIdx: index("tenant_memberships_tenant_idx").on(t.tenantId),
    idUserFkTarget: uniqueIndex(
      "tenant_memberships_id_user_unique_fk_target",
    ).on(t.id, t.userId),
    idTenantFkTarget: uniqueIndex(
      "tenant_memberships_id_tenant_unique_fk_target",
    ).on(t.id, t.tenantId),
  }),
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => tenantMemberships.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => ({
    membershipRoleUniq: uniqueIndex("membership_roles_membership_role_uniq").on(
      t.membershipId,
      t.roleId,
    ),
    membershipIdx: index("membership_roles_membership_idx").on(t.membershipId),
    roleIdx: index("membership_roles_role_idx").on(t.roleId),
  }),
);

export const membershipBranches = pgTable(
  "membership_branches",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => tenantMemberships.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => ({
    membershipBranchUniq: uniqueIndex(
      "membership_branches_membership_branch_uniq",
    ).on(t.membershipId, t.branchId),
    membershipIdx: index("membership_branches_membership_idx").on(
      t.membershipId,
    ),
    branchIdx: index("membership_branches_branch_idx").on(t.branchId),
    tenantIdx: index("membership_branches_tenant_idx").on(t.tenantId),
  }),
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    userAgent: varchar("user_agent", { length: 500 }),
    ipAddress: varchar("ip_address", { length: 64 }),
  },
  (t) => ({
    userActiveIdx: index("user_sessions_user_active_idx").on(
      t.userId,
      t.revokedAt,
      t.expiresAt,
    ),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id").references(() => tenantMemberships.id, {
      onDelete: "cascade",
    }),
    sessionId: uuid("session_id").references(() => userSessions.id, {
      onDelete: "cascade",
    }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("refresh_tokens_user_idx").on(t.userId),
    sessionIdx: index("refresh_tokens_session_idx").on(t.sessionId),
    tokenHashUnique: uniqueIndex("refresh_tokens_token_hash_unique").on(
      t.tokenHash,
    ),
  }),
);
