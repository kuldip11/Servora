import { describe, expect, it, vi } from "vitest";
const { signup, memberships, me } = vi.hoisted(() => ({
  signup: vi.fn(),
  memberships: vi.fn(),
  me: vi.fn(),
}));
vi.mock("../auth.service", () => ({
  authService: { signup, memberships, me },
}));
import { authController } from "@/modules/auth/auth.controller";
const auth: any = {
  userId: "u1",
  tenantId: "t1",
  membershipId: "m1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: ["x"],
};
describe("auth controller", () => {
  it("delegates signup and wraps the result", async () => {
    signup.mockResolvedValue({ user: { id: "u1" } });
    await expect(authController.signup({} as any)).resolves.toEqual({
      success: true,
      data: { user: { id: "u1" } },
    });
  });
  it("delegates memberships and builds me roles/permissions", async () => {
    memberships.mockResolvedValue([{ id: "m1" }]);
    me.mockResolvedValue({
      user: {
        id: "u1",
        firstName: "A",
        lastName: "B",
        email: "u@example.com",
        status: "ACTIVE",
        globalUserRoles: [
          {
            roleId: "r1",
            role: {
              name: "OWNER",
              rolePermissions: [{ permission: { key: "p" } }],
            },
          },
        ],
      },
      membership: {
        roles: [
          {
            roleId: "r2",
            role: {
              name: "MANAGER",
              rolePermissions: [{ permission: { key: "q" } }],
            },
          },
        ],
      },
    });
    await expect(authController.memberships(auth)).resolves.toEqual({
      success: true,
      data: [{ id: "m1" }],
    });
    const result: any = await authController.me(auth);
    expect(result.data.roles).toEqual([
      expect.objectContaining({ id: "r2", name: "MANAGER" }),
    ]);
    expect(
      result.data.roles.map((role: { name: string }) => role.name),
    ).not.toContain("OWNER");
    expect(result.data.permissions).toEqual(["x"]);
    expect(result.data.tenantId).toBe("t1");
  });
});
