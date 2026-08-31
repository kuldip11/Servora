import type { AuthContext } from "@/core/auth";
import { ForbiddenError } from "@/core/errors";

export const requireBillingPermission = (
  auth: AuthContext,
  permission: string,
): void => {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
};

export const assertBillingResourceAccess = (
  auth: AuthContext,
  resourceBranchId: string,
): void => {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== resourceBranchId) {
      throw new ForbiddenError("Billing branch access denied");
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Billing branch access denied");
  }
};
