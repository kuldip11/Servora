import type { AuthContext } from "../../core/auth";
import { ForbiddenError } from "../../core/errors";

export type KitchenPermission = "kitchen:read" | "kitchen:update";

export function requireKitchenPermission(
  auth: AuthContext,
  permission: KitchenPermission,
): void {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
}

/** Kitchen tickets are branch-owned through the order/branch that fired them. */
export function assertKitchenTicketAccess(
  auth: AuthContext,
  resourceBranchId: string,
): void {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== resourceBranchId) {
      throw new ForbiddenError("Kitchen ticket branch access denied");
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Kitchen ticket branch access denied");
  }
}
