
import { NotFoundError, ConflictError } from "../../core/errors";

export function branchNotFound(id?: string): NotFoundError {
  return new NotFoundError("Branch", id);
}

export function allOrderTypesDisabled(): ConflictError {
  return new ConflictError("A branch needs at least one order type enabled.", {
    reason: "ALL_ORDER_TYPES_DISABLED",
  });
}

export function branchHasOpenDineInOrders(): ConflictError {
  return new ConflictError(
    "This branch has open dine-in orders — settle or close them before disabling dine-in.",
    { reason: "BRANCH_HAS_OPEN_DINE_IN_ORDERS" },
  );
}

export function lastActiveBranch(): ConflictError {
  return new ConflictError(
    "You need at least one active branch — deactivate this one after creating another.",
    { reason: "LAST_BRANCH" },
  );
}

export function branchHasOpenOrders(): ConflictError {
  return new ConflictError(
    "This branch has open orders and cannot be deactivated yet.",
    {
      reason: "BRANCH_HAS_OPEN_ORDERS",
    },
  );
}

export function branchCodeAlreadyExists(code: string): ConflictError {
  return new ConflictError(
    `Branch code "${code}" is already in use in this franchise.`,
    {
      reason: "BRANCH_CODE_EXISTS",
      code,
    },
  );
}

export function tablesRequireDineIn(): ConflictError {
  return new ConflictError(
    "Tables cannot be enabled when dine-in is disabled.",
    {
      reason: "TABLES_REQUIRE_DINE_IN",
    },
  );
}
