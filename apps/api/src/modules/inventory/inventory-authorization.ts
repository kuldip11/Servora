import type { AuthContext } from "../../core/auth";
import { requireBranch, requirePermission } from "../../core/auth";
import { ForbiddenError } from "../../core/errors";

export type InventoryPermission =
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:adjust"
  | "inventory:waste";

export function requireInventoryPermission(
  auth: AuthContext,
  permission: InventoryPermission,
): void {
  requirePermission(auth, permission);
}

export function resolveInventoryBranch(
  auth: AuthContext,
  requestedBranchId?: string | null,
): string {
  const requested = requestedBranchId ?? auth.branchId ?? undefined;
  if (!requested)
    return requireBranch(
      auth,
      "Please select a specific branch before accessing inventory.",
    );

  if (auth.tenantWide) return requested;

  const active = requireBranch(
    auth,
    "Please select a specific branch before accessing inventory.",
  );
  if (
    requested !== active ||
    !(auth.authorizedBranchIds ?? []).includes(requested)
  ) {
    throw new ForbiddenError("Branch access denied");
  }
  return requested;
}

export function assertInventoryResourceBranch(
  auth: AuthContext,
  resourceBranchId: string | null | undefined,
): void {
  if (!resourceBranchId) throw new ForbiddenError("Branch access denied");
  if (auth.tenantWide) return;
  if (!(auth.authorizedBranchIds ?? []).includes(resourceBranchId)) {
    throw new ForbiddenError("Branch access denied");
  }
  if (auth.branchId && auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Branch access denied");
  }
}

export function requireInventoryTransactionPermission(
  auth: AuthContext,
  transactionType: "IN" | "OUT" | "ADJUSTMENT" | "WASTE",
): void {
  if (transactionType === "ADJUSTMENT") {
    requirePermission(auth, "inventory:adjust");
    return;
  }
  if (transactionType === "WASTE") {
    requirePermission(auth, "inventory:waste");
    return;
  }
  requirePermission(auth, "inventory:update");
}
