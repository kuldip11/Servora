/**
 * Auth service — signup/login/refresh business logic and token issuing.
 * Data access lives in `auth.repository.ts`.
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authRepository } from "./auth.repository";
import { listUserMemberships } from "../../lib/authorization/membership-context";
import { db } from "../../db";
import {
  ConflictError,
  ForbiddenError,
  ServiceUnavailableError,
} from "../../core/errors";
import { signAccessToken } from "../../lib/jwt";
import type { SignupInput, LoginInput } from "@pos/validation";
import {
  invalidCredentials,
  userInactive,
  invalidRefreshToken,
  authUserNotFound,
} from "./auth.errors";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authService = {
  async signup(input: SignupInput) {
    // Signup creates only the authentication identity. Tenant ownership is
    // established later through the tenant/membership flow; tenantName is
    // accepted temporarily for older clients but is deliberately ignored.
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing =
      await authRepository.findStandaloneUserByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError("Account already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create the identity and bootstrap its GLOBAL OWNER role in one database
    // transaction. If RBAC is missing, no half-created account is left behind.
    let user: Awaited<
      ReturnType<typeof authRepository.createUserWithGlobalOwnerRole>
    >["user"];
    try {
      ({ user } = await authRepository.createUserWithGlobalOwnerRole({
        firstName: input.firstName,
        lastName: input.lastName,
        email: normalizedEmail,
        passwordHash,
      }));
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("RBAC reference data is not installed")
      ) {
        throw new ServiceUnavailableError(
          "RBAC reference data is not available. Run the database migrations before signing up.",
        );
      }
      throw error;
    }

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
        roles: fullUser.globalUserRoles.map((ur: any) => ({
          id: ur.roleId,
          name: ur.role.name,
          description: ur.role.description ?? "",
          permissions: ur.role.rolePermissions.map((rp: any) => rp.permission),
        })),
      },
    };
  },

  async login(input: LoginInput) {
    const users = await authRepository.findUsersByEmail(input.email);
    const matches = [];
    for (const candidate of users) {
      if (
        candidate.status === "ACTIVE" &&
        (await bcrypt.compare(input.password, candidate.passwordHash))
      ) {
        matches.push(candidate);
      }
    }
    if (matches.length !== 1) throw invalidCredentials();

    const user = matches[0]!;
    return authService._issueTokens(user);
  },

  async refresh(tokenValue: string) {
    const tokenHash = hashToken(tokenValue);
    // Consume first, atomically. This closes the TOCTOU window where two
    // simultaneous refresh requests could both observe an unrevoked token.
    const stored = await authRepository.consumeRefreshToken(tokenHash);
    if (!stored) throw invalidRefreshToken();

    const user = await authRepository.findUserById(stored.userId);
    if (!user) throw invalidRefreshToken();

    // Refresh restores authentication identity only. The active franchise and
    // branch are intentionally not persisted in refresh tokens; the client
    // sends them as request context and the server re-authorizes them.
    return authService._issueTokens(user);
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

  async _issueTokens(
    user: Awaited<ReturnType<typeof authRepository.findUserById>>,
  ) {
    if (!user) throw new Error("User not found");

    const globalRoles = user.globalUserRoles.map((ur: any) => ({
      id: ur.roleId,
      name: ur.role.name,
      description: ur.role.description ?? "",
      permissions: ur.role.rolePermissions.map((rp: any) => rp.permission),
    }));

    const accessToken = signAccessToken({
      id: user.id,
      email: user.email,
      roles: globalRoles,
    });

    const refreshTokenValue = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken({
      userId: user.id,
      // Existing schema supports this nullable column. It is intentionally
      // left empty so a refresh token cannot pin a session to one franchise.
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900,
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
