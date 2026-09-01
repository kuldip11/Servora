import type { AuthContext } from "@/core/auth";
import { ForbiddenError } from "@/core/errors";

export type KitchenPermission = "kitchen:read" | "kitchen:update";

export type KitchenTicketStatusPermission =
  "kitchen:update" | "orders:update" | "orders:update_status";

export const requireKitchenPermission = (
  auth: AuthContext,
  permission: KitchenPermission,
): void => {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions", {
      required: permission,
    });
  }
};

export const assertKitchenTicketAccess = (
  auth: AuthContext,
  resourceBranchId: string,
): void => {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== resourceBranchId) {
      throw new ForbiddenError("Kitchen ticket branch access denied");
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== resourceBranchId) {
    throw new ForbiddenError("Kitchen ticket branch access denied");
  }
};

export const requireKitchenStatusPermission = (
  auth: AuthContext,
  newStatus: string,
): void => {
  const management = auth.roles.some((role) =>
    ["OWNER", "FRANCHISE_ADMIN", "MANAGER"].includes(role),
  );
  const waiter = auth.roles.includes("WAITER");
  const kitchen = auth.permissions.includes("kitchen:update");
  const canFire =
    newStatus === "FIRED" && auth.permissions.includes("orders:update");
  const allowed =
    kitchen ||
    (canFire && management) ||
    (newStatus === "SERVED" &&
      auth.permissions.includes("orders:update_status") &&
      (waiter || management)) ||
    (["PREPARING", "READY"].includes(newStatus) &&
      auth.permissions.includes("orders:update_status") &&
      management);

  if (!allowed) {
    throw new ForbiddenError("Insufficient permissions", {
      required:
        newStatus === "SERVED"
          ? ["kitchen:update", "orders:update_status"]
          : newStatus === "FIRED"
            ? ["kitchen:update", "orders:update"]
            : ["kitchen:update"],
    });
  }
};
