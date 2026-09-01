import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  users,
  roles,
  permissions,
  rolePermissions,
  globalUserRoles,
  tenantMemberships,
  membershipRoles,
  membershipBranches,
  refreshTokens,
  userStatusEnum,
  roleScopeEnum,
  membershipStatusEnum,
} from "@/db/schema/auth.schema";
const expectTable = (table: any, name: string, columns: string[]) => {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
};
describe("auth.schema.ts", () => {
  it("defines users", () =>
    expectTable(users, "users", [
      "id",
      "firstName",
      "lastName",
      "displayName",
      "phone",
      "profileImageUrl",
      "email",
      "passwordHash",
      "status",
      "failedLoginAttempts",
      "lockedUntil",
      "deletedAt",
      "createdAt",
      "updatedAt",
    ]));
  it("defines roles", () =>
    expectTable(roles, "roles", [
      "id",
      "tenantId",
      "name",
      "scope",
      "description",
      "isSystem",
      "isActive",
      "createdAt",
      "updatedAt",
    ]));
  it("defines permissions", () =>
    expectTable(permissions, "permissions", [
      "id",
      "key",
      "module",
      "description",
    ]));
  it("defines role_permissions", () =>
    expectTable(rolePermissions, "role_permissions", [
      "roleId",
      "permissionId",
    ]));
  it("defines global_user_roles", () =>
    expectTable(globalUserRoles, "global_user_roles", [
      "userId",
      "roleId",
      "assignedAt",
    ]));
  it("defines tenant_memberships", () =>
    expectTable(tenantMemberships, "tenant_memberships", [
      "id",
      "userId",
      "tenantId",
      "status",
      "createdAt",
      "updatedAt",
    ]));
  it("defines membership_roles", () =>
    expectTable(membershipRoles, "membership_roles", [
      "membershipId",
      "roleId",
      "assignedAt",
    ]));
  it("defines membership_branches", () =>
    expectTable(membershipBranches, "membership_branches", [
      "membershipId",
      "tenantId",
      "branchId",
      "assignedAt",
    ]));
  it("defines refresh_tokens", () =>
    expectTable(refreshTokens, "refresh_tokens", [
      "id",
      "userId",
      "membershipId",
      "sessionId",
      "tokenHash",
      "expiresAt",
      "revokedAt",
      "createdAt",
    ]));
  it("keeps auth enums stable", () => {
    expect(userStatusEnum.enumValues).toEqual([
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ]);
    expect(roleScopeEnum.enumValues).toEqual(["GLOBAL", "TENANT", "BRANCH"]);
    expect(membershipStatusEnum.enumValues).toEqual([
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
    ]);
  });
});
