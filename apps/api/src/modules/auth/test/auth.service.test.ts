import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  findStandaloneUserByEmail,
  createUserWithGlobalOwnerRole,
  findUserById,
  findUsersByEmail,
  consumeRefreshToken,
  saveRefreshToken,
  findMembershipById,
  updateUserProfile,
} = vi.hoisted(() => ({
  findStandaloneUserByEmail: vi.fn(),
  createUserWithGlobalOwnerRole: vi.fn(),
  findUserById: vi.fn(),
  findUsersByEmail: vi.fn(),
  consumeRefreshToken: vi.fn(),
  saveRefreshToken: vi.fn(),
  findMembershipById: vi.fn(),
  updateUserProfile: vi.fn(),
}));
vi.mock("../auth.repository", () => ({
  authRepository: {
    findStandaloneUserByEmail,
    createUserWithGlobalOwnerRole,
    findUserById,
    findUsersByEmail,
    consumeRefreshToken,
    saveRefreshToken,
    findMembershipById,
    updateUserProfile,
  },
}));
const { listUserMemberships } = vi.hoisted(() => ({
  listUserMemberships: vi.fn(),
}));
vi.mock("../../../lib/authorization/membership-context", () => ({
  listUserMemberships,
}));
const { signAccessToken } = vi.hoisted(() => ({
  signAccessToken: vi.fn().mockReturnValue("access"),
}));
vi.mock("../../../lib/jwt", () => ({ signAccessToken }));
vi.mock("../../../db", () => ({ db: {} }));
import { authService } from "../auth.service";
const user: any = {
  id: "u1",
  firstName: "A",
  lastName: "B",
  email: "a@example.com",
  passwordHash: "hash",
  status: "ACTIVE",
  globalUserRoles: [
    {
      roleId: "r1",
      role: { name: "OWNER", description: "", rolePermissions: [] },
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe("auth service", () => {
  it("updates profile fields and returns the refreshed user", async () => {
    updateUserProfile.mockResolvedValue({ ...user, firstName: "New", lastName: "Name" });
    findUserById.mockResolvedValue({ ...user, firstName: "New", lastName: "Name" });
    await expect(authService.updateProfile("u1", { firstName: "New", lastName: "Name" })).resolves.toMatchObject({ firstName: "New", lastName: "Name" });
    expect(updateUserProfile).toHaveBeenCalledWith("u1", { firstName: "New", lastName: "Name" });
  });

  it("rejects duplicate signup and bootstraps a new user", async () => {
    findStandaloneUserByEmail.mockResolvedValueOnce(user);
    await expect(
      authService.signup({
        email: "A@EXAMPLE.COM",
        password: "password123",
        firstName: "A",
        lastName: "B",
      } as any),
    ).rejects.toThrow("Account already exists");
    findStandaloneUserByEmail.mockResolvedValueOnce(undefined);
    createUserWithGlobalOwnerRole.mockResolvedValue({ user: { id: "u1" } });
    findUserById.mockResolvedValue(user);
    await expect(
      authService.signup({
        email: "A@EXAMPLE.COM",
        password: "password123",
        firstName: "A",
        lastName: "B",
      } as any),
    ).resolves.toMatchObject({
      user: { id: "u1", tenantId: "", branchId: null },
    });
    expect(createUserWithGlobalOwnerRole).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@example.com", firstName: "A" }),
    );
  });
  it("requires exactly one active password match for login", async () => {
    findUsersByEmail.mockResolvedValue([user]);
    await expect(
      authService.login({ email: "a@example.com", password: "wrong" } as any),
    ).rejects.toThrow("Invalid credentials");
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("secret", 1);
    findUsersByEmail.mockResolvedValue([{ ...user, passwordHash: hash }]);
    saveRefreshToken.mockResolvedValue({});
    await expect(
      authService.login({ email: "a@example.com", password: "secret" } as any),
    ).resolves.toMatchObject({ accessToken: "access", user: { id: "u1" } });
  });
  it("consumes refresh tokens atomically and rejects invalid users/tokens", async () => {
    consumeRefreshToken.mockResolvedValue(undefined);
    await expect(authService.refresh("token")).rejects.toThrow(
      "Invalid refresh token",
    );
    consumeRefreshToken.mockResolvedValue({ userId: "u1" });
    findUserById.mockResolvedValue(undefined);
    await expect(authService.refresh("token")).rejects.toThrow(
      "Invalid refresh token",
    );
  });
  it("enforces membership ownership/status and lists memberships", async () => {
    findUserById.mockResolvedValue(user);
    findMembershipById.mockResolvedValue({
      id: "m1",
      userId: "u2",
      status: "ACTIVE",
    });
    await expect(authService.me("u1", "m1")).rejects.toThrow(
      "Membership access denied",
    );
    findMembershipById.mockResolvedValue({
      id: "m1",
      userId: "u1",
      status: "ACTIVE",
    });
    await expect(authService.me("u1", "m1")).resolves.toMatchObject({
      membership: { id: "m1" },
    });
    listUserMemberships.mockResolvedValue([{ id: "m1" }]);
    await expect(authService.memberships("u1")).resolves.toEqual([
      { id: "m1" },
    ]);
  });
});
