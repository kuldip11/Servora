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
  recordFailedLogin,
  resetLoginFailures,
  revokeRefreshToken,
  createSession,
  touchSession,
  findSession,
  listActiveSessions,
  revokeSession,
} = vi.hoisted(() => ({
  findStandaloneUserByEmail: vi.fn(),
  createUserWithGlobalOwnerRole: vi.fn(),
  findUserById: vi.fn(),
  findUsersByEmail: vi.fn(),
  consumeRefreshToken: vi.fn(),
  saveRefreshToken: vi.fn(),
  findMembershipById: vi.fn(),
  updateUserProfile: vi.fn(),
  recordFailedLogin: vi.fn(),
  resetLoginFailures: vi.fn(),
  revokeRefreshToken: vi.fn(),
  createSession: vi.fn(),
  touchSession: vi.fn(),
  findSession: vi.fn(),
  listActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
}));
vi.mock("../auth.repository", () => ({
  authRepository: {
    findStandaloneUserByEmail, createUserWithGlobalOwnerRole, findUserById, findUsersByEmail,
    consumeRefreshToken, saveRefreshToken, findMembershipById, updateUserProfile,
    recordFailedLogin, resetLoginFailures, revokeRefreshToken, createSession, touchSession,
    findSession, listActiveSessions, revokeSession,
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
  createSession.mockResolvedValue({ id: "session-1" });
  touchSession.mockResolvedValue(undefined);
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
  it("locks an account after five failed password attempts", async () => {
    findUsersByEmail.mockResolvedValue([{ ...user, failedLoginAttempts: 4, lockedUntil: null }]);
    await expect(authService.login({ email: "a@example.com", password: "wrong" } as any)).rejects.toThrow(
      "Too many failed login attempts",
    );
    expect(recordFailedLogin).toHaveBeenCalledWith(
      "u1",
      5,
      expect.any(Date),
    );
  });

  it("rejects an already locked account before checking the password", async () => {
    findUsersByEmail.mockResolvedValue([{ ...user, failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 60_000) }]);
    await expect(authService.login({ email: "a@example.com", password: "secret" } as any)).rejects.toThrow(
      "Too many failed login attempts",
    );
  });

  it("clears login failures after successful authentication", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("secret", 1);
    findUsersByEmail.mockResolvedValue([{ ...user, passwordHash: hash, failedLoginAttempts: 2, lockedUntil: null }]);
    saveRefreshToken.mockResolvedValue({});
    await expect(authService.login({ email: "a@example.com", password: "secret" } as any)).resolves.toMatchObject({ accessToken: "access" });
    expect(resetLoginFailures).toHaveBeenCalledWith("u1");
  });

  it("revokes the refresh token on logout", async () => {
    revokeRefreshToken.mockResolvedValue({ id: "rt1", userId: "u1", sessionId: "session-1" });
    revokeSession.mockResolvedValue({ id: "session-1" });
    await expect(authService.logout("refresh-token")).resolves.toEqual({ loggedOut: true });
    expect(revokeRefreshToken).toHaveBeenCalledWith(expect.any(String));
  });

  it("consumes refresh tokens atomically and rejects invalid users/tokens", async () => {
    consumeRefreshToken.mockResolvedValue(undefined);
    await expect(authService.refresh("token")).rejects.toThrow(
      "Invalid refresh token",
    );
    consumeRefreshToken.mockResolvedValue({ userId: "u1", sessionId: "session-1" });
    findSession.mockResolvedValue({ id: "session-1", revokedAt: null, expiresAt: new Date(Date.now() + 60_000) });
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
