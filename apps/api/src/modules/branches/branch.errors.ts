/**
 * Branch-specific error factories.
 *
 * The pre-refactor controller used ad-hoc code strings for these
 * (`ALL_ORDER_TYPES_DISABLED`, `BRANCH_HAS_OPEN_DINE_IN_ORDERS`,
 * `LAST_BRANCH`, `BRANCH_HAS_OPEN_ORDERS`). No frontend client checks
 * those specific strings (verified — see docs/NEXT_STEPS.md), so this
 * migration folds them into the shared `ConflictError`/`NotFoundError`
 * taxonomy, keeping the original wording as `message` and the original
 * code as `details.reason`. Status codes are unchanged (all were 409,
 * except NOT_FOUND which stays 404).
 */
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
