import type { AuthContext } from "@/core/auth";
import { requireBranch, requirePermission } from "@/core/auth";
import { ForbiddenError } from "@/core/errors";

export type TablesPermission =
  "tables:read" | "tables:create" | "tables:update" | "tables:delete";

export const requireTablesPermission = (
  auth: AuthContext,
  permission: TablesPermission,
): void => {
  requirePermission(auth, permission);
};

export const resolveTableBranch = (
  auth: AuthContext,
  requestedBranchId?: string | null,
): string => {
  const requested = requestedBranchId ?? auth.branchId ?? undefined;
  if (!requested) {
    return requireBranch(
      auth,
      "Please select a specific branch before accessing tables.",
    );
  }

  if (auth.tenantWide) return requested;

  const active = requireBranch(
    auth,
    "Please select a specific branch before accessing tables.",
  );
  if (
    requested !== active ||
    !(auth.authorizedBranchIds ?? []).includes(requested)
  ) {
    throw new ForbiddenError("Branch access denied");
  }
  return requested;
};

export const assertTableResourceAccess = (
  auth: AuthContext,
  resourceBranchId: string | null | undefined,
): void => {
  if (!resourceBranchId) throw new ForbiddenError("Branch access denied");
  if (auth.tenantWide) return;
  if (!(auth.authorizedBranchIds ?? []).includes(resourceBranchId)) {
    throw new ForbiddenError("Branch access denied");
  }
  if (auth.branchId && auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Branch access denied");
  }
};

export const assertTableListScope = (auth: AuthContext): void => {
  if (!auth.branchId && !auth.tenantWide) {
    throw new ForbiddenError("Branch access denied");
  }
};
