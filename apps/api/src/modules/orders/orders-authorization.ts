import type { AuthContext } from "@/core/auth";
import { ForbiddenError } from "@/core/errors";

export const requireOrdersPermission = (
  auth: AuthContext,
  permission: string,
): void => {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
};

export const assertOrderResourceAccess = (
  auth: AuthContext,
  orderBranchId: string,
): void => {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== orderBranchId) {
      throw new ForbiddenError("Order branch access denied");
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== orderBranchId) {
    throw new ForbiddenError("Order branch access denied");
  }
};

export const assertOrderListScope = (auth: AuthContext): void => {
  if (!auth.tenantWide && !auth.branchId) {
    throw new ForbiddenError("Order branch access denied");
  }
};
