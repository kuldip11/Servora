import type { AuthContext } from "@/core/auth";
import { requirePermission } from "@/core/auth";
import { ForbiddenError } from "@/core/errors";

export type AnalyticsPermission = "analytics:read";

export const requireAnalyticsPermission = (
  auth: AuthContext,
  permission: AnalyticsPermission,
): void => {
  requirePermission(auth, permission);
};

export const assertAnalyticsScope = (auth: AuthContext): void => {
  if (!auth.tenantWide && !auth.branchId) {
    throw new ForbiddenError("Insufficient permissions");
  }
};
