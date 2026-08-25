/**
 * Auth controller — thin handlers only. `signup`/`login`/`refresh` are
 * public (no `auth` on context); `me` runs behind `requireAuthPlugin()`
 * (applied in `auth.route.ts`), so `auth` is already resolved and typed.
 * Any thrown `AppError` flows through the global handler in `src/index.ts`.
 */
import type { AuthContext } from "../../core/auth";
import { successResponse } from "../../core/response";
import { authService } from "./auth.service";
import type { SignupInput, LoginInput } from "@pos/validation";

export const authController = {
  async signup(input: SignupInput) {
    const result = await authService.signup(input);
    return successResponse(result);
  },

  async login(input: LoginInput) {
    const result = await authService.login(input);
    return successResponse(result);
  },

  async refresh(refreshToken: string) {
    const result = await authService.refresh(refreshToken);
    return successResponse(result);
  },

  async memberships(auth: AuthContext) {
    return successResponse(await authService.memberships(auth.userId));
  },

  async me(auth: AuthContext) {
    const { user, membership } = await authService.me(
      auth.userId,
      auth.membershipId,
    );
    const membershipRoles = membership
      ? membership.roles.map((mr: any) => ({
          id: mr.roleId,
          name: mr.role.name,
          permissions: mr.role.rolePermissions.map((rp: any) => rp.permission),
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
