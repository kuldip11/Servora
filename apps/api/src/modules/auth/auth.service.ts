/**
 * Auth service — signup/login/refresh business logic and token issuing.
 * Data access lives in `auth.repository.ts`.
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authRepository } from "./auth.repository";
import { listUserMemberships } from "../../core/auth/membership-context";
import { db } from "../../db";
import {
  ConflictError,
  ForbiddenError,
} from "../../core/errors";
import { signAccessToken } from "../../lib/jwt";
import type { SignupInput, LoginInput } from "@pos/validation";
import {
  invalidCredentials,
  userInactive,
  invalidRefreshToken,
  authUserNotFound,
  accountTemporarilyLocked,
} from "./auth.errors";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authService = {
  async signup(input: SignupInput) {
    // Signup creates only the authentication identity. Tenant ownership is
    // established later through the tenant/membership flow.
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing =
      await authRepository.findStandaloneUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError("Account already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create the identity and bootstrap its GLOBAL OWNER role in one database
    // transaction. If RBAC is missing, no half-created account is left behind.
    const { user } = await authRepository.createUserWithGlobalOwnerRole({
      firstName: input.firstName,
      lastName: input.lastName,
      email: normalizedEmail,
      passwordHash,
    });

    const fullUser = await authRepository.findUserById(user.id);
    if (!fullUser) throw new Error("User creation failed");

    return {
      user: {
        id: fullUser.id,
        tenantId: "",
        branchId: null,
        firstName: fullUser.firstName,
        lastName: fullUser.lastName,
        email: fullUser.email,
        status: fullUser.status,
        roles: fullUser.globalUserRoles.map((ur) => ({
          id: ur.roleId,
          name: ur.role.name,
          description: ur.role.description ?? "",
          permissions: ur.role.rolePermissions.map((rp) => rp.permission),
        })),
      },
    };
  },

  async login(input: LoginInput) {
    const users = await authRepository.findUsersByEmail(input.email);
    if (users.length !== 1) throw invalidCredentials();

    const user = users[0]!;
    if (user.status !== "ACTIVE") throw invalidCredentials();
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw accountTemporarilyLocked();
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      const nextAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = 5;
      const lockMinutes = 15;
      const lockedUntil =
        nextAttempts >= maxAttempts
          ? new Date(Date.now() + lockMinutes * 60 * 1000)
          : null;
      await authRepository.recordFailedLogin(
        user.id,
        nextAttempts,
        lockedUntil,
      );
      if (lockedUntil) throw accountTemporarilyLocked();
      throw invalidCredentials();
    }

    await authRepository.resetLoginFailures(user.id);
    return authService._issueTokens(user);
  },

  async logout(tokenValue: string) {
    const tokenHash = hashToken(tokenValue);
    const token = await authRepository.revokeRefreshToken(tokenHash);
    if (token?.sessionId)
      await authRepository.revokeSession(token.userId, token.sessionId);
    return { loggedOut: true };
  },

  async refresh(tokenValue: string) {
    const tokenHash = hashToken(tokenValue);
    // Consume first, atomically. This closes the TOCTOU window where two
    // simultaneous refresh requests could both observe an unrevoked token.
    const stored = await authRepository.consumeRefreshToken(tokenHash);
    if (!stored) throw invalidRefreshToken();

    const user = await authRepository.findUserById(stored.userId);
    if (!user || !stored.sessionId) throw invalidRefreshToken();
    const session = await authRepository.findSession(
      stored.userId,
      stored.sessionId,
    );
    if (!session || session.revokedAt || session.expiresAt <= new Date())
      throw invalidRefreshToken();

    // Refresh restores authentication identity only. The active franchise and
    // branch are intentionally not persisted in refresh tokens; the client
    // sends them as request context and the server re-authorizes them.
    return authService._issueTokens(user, stored.sessionId);
  },

  async sessions(userId: string) {
    return authRepository.listActiveSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    const session = await authRepository.revokeSession(userId, sessionId);
    if (!session) throw new ForbiddenError("Session not found");
    return { revoked: true };
  },

  async me(userId: string, membershipId?: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw authUserNotFound();
    const membership = membershipId
      ? await authRepository.findMembershipById(membershipId)
      : undefined;
    if (
      membershipId &&
      (!membership ||
        membership.userId !== userId ||
        membership.status !== "ACTIVE")
    ) {
      throw new ForbiddenError("Membership access denied");
    }
    return { user, membership };
  },

  async memberships(userId: string) {
    return listUserMemberships(db, userId);
  },

  async updateProfile(
    userId: string,
    input: { firstName?: string; lastName?: string },
  ) {
    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    if (!Object.keys(changes).length)
      return authRepository.findUserById(userId);
    const updated = await authRepository.updateUserProfile(userId, changes);
    if (!updated) throw authUserNotFound();
    return authRepository.findUserById(userId);
  },

  async _issueTokens(
    user: Awaited<ReturnType<typeof authRepository.findUserById>>,
    existingSessionId?: string,
  ) {
    if (!user) throw new Error("User not found");

    const globalRoles = user.globalUserRoles.map((ur) => ({
      id: ur.roleId,
      name: ur.role.name,
      description: ur.role.description ?? "",
      permissions: ur.role.rolePermissions.map((rp) => rp.permission),
    }));

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      roles: globalRoles,
    });

    const refreshTokenValue = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    let sessionId = existingSessionId;
    if (!sessionId) {
      const session = await authRepository.createSession({
        userId: user.id,
        expiresAt,
      });
      sessionId = session.id;
    } else {
      await authRepository.touchSession(sessionId, expiresAt);
    }
    await authRepository.saveRefreshToken({
      userId: user.id,
      sessionId,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900,
      sessionId,
      user: {
        id: user.id,
        tenantId: null,
        branchId: null,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
        roles: globalRoles,
      },
    };
  },
};
