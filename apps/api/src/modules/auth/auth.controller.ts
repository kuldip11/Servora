

import type { AuthContext } from "../../core/auth";
import { successResponse } from "../../core/response";
import { authService } from "./auth.service";
import type { SignupInput } from "@pos/validation";

export const authController = {
  async signup(input: SignupInput) {
    const result = await authService.signup(input);
    return successResponse(result);
  },

  async memberships(auth: AuthContext) {
    return successResponse(await authService.memberships(auth.userId));
  },

  async sessions(auth: AuthContext) {
    return successResponse(await authService.sessions(auth.userId));
  },

  async revokeSession(auth: AuthContext, sessionId: string) {
    return successResponse(
      await authService.revokeSession(auth.userId, sessionId),
    );
  },

  async updateProfile(
    auth: AuthContext,
    input: { firstName?: string; lastName?: string },
  ) {
    await authService.updateProfile(auth.userId, input);
    return authController.me(auth);
  },

  async me(auth: AuthContext) {
    const { user, membership } = await authService.me(
      auth.userId,
      auth.membershipId,
    );
    const membershipRoles = membership
      ? membership.roles.map((mr) => ({
          id: mr.roleId,
          name: mr.role.name,
          permissions: mr.role.rolePermissions.map((rp) => rp.permission),
        }))
      : [];
    const globalRoles = user.globalUserRoles.map((ur) => ({
      id: ur.roleId,
      name: ur.role.name,
      permissions: ur.role.rolePermissions.map((rp) => rp.permission),
    }));
    const roles = [
      ...globalRoles,
      ...membershipRoles.filter(
        (role) => !globalRoles.some((globalRole) => globalRole.id === role.id),
      ),
    ];

    return successResponse({
      id: user.id,
      tenantId: auth.tenantId,
      membershipId: auth.membershipId,
      branchId: auth.branchId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      roles,
      permissions: auth.permissions,
    });
  },
};
