import type { AuthContext } from "../../core/auth";
import { ForbiddenError } from "../../core/errors";

export function requireBillingPermission(
  auth: AuthContext,
  permission: string,
): void {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
}

/** Billing records belong to an order, and therefore inherit the order's branch scope. */
export function assertBillingResourceAccess(
  auth: AuthContext,
  resourceBranchId: string,
): void {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== resourceBranchId) {
      throw new ForbiddenError("Billing branch access denied");
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Billing branch access denied");
  }
}
