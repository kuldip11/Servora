import type { AuthContext } from "../../core/auth";
import { requirePermission, requireBranch } from "../../core/auth";
import { ForbiddenError } from "../../core/errors";

export type MenuPermission =
  "menu:read" | "menu:create" | "menu:update" | "menu:delete" | "menu:publish" | "menu:pricing:write";

export function requireMenuPermission(
  auth: AuthContext,
  permission: MenuPermission,
): void {
  requirePermission(auth, permission);
}

export function resolveMenuBranch(
  auth: AuthContext,
  requestedBranchId?: string | null,
): string | undefined {
  const branchId = requestedBranchId ?? auth.branchId ?? undefined;
  if (auth.tenantWide) return branchId;
  const resolved = requireBranch(auth, "Please select a specific branch.");
  if (branchId !== resolved) {
    throw new ForbiddenError("Branch access denied");
  }
  return resolved;
}

export function assertMenuResourceBranch(
  auth: AuthContext,
  resourceBranchId: string | null | undefined,
  options: { allowShared?: boolean } = {},
): void {
  if (auth.tenantWide) return;
  if (!resourceBranchId) {
    if (options.allowShared) return;
    throw new ForbiddenError("Branch access denied");
  }
  if (!auth.authorizedBranchIds?.includes(resourceBranchId)) {
    throw new ForbiddenError("Branch access denied");
  }
  if (auth.branchId && auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Branch access denied");
  }
}

export function assertMenuQueryBranch(
  auth: AuthContext,
  requestedBranchId?: string | null,
): string | undefined {
  return resolveMenuBranch(auth, requestedBranchId);
}
