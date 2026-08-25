/**
 * Inventory-specific error factories.
 *
 * The pre-refactor controller/service used ad-hoc thrown-string codes
 * (`INVENTORY_ITEM_NOT_FOUND`, `INVENTORY_INSUFFICIENT_STOCK`) plus a
 * hand-rolled `MISSING_BRANCH` case in the controller. No frontend client
 * checks those specific strings (verified — see docs/NEXT_STEPS.md), so
 * this migration folds them into the shared `AppError` taxonomy
 * (`NotFoundError`, `DomainRuleError`, `MissingBranchError`) and keeps the
 * original wording as `message` and the original code as `details.reason`
 * for anyone currently grepping logs for it. Status codes are unchanged:
 * insufficient stock was a 422 in the old controller (`err.message ===
 * 'INVENTORY_INSUFFICIENT_STOCK'` branch), which is exactly what
 * `DomainRuleError` maps to.
 */
import {
  NotFoundError,
  DomainRuleError,
  MissingBranchError,
} from "../../core/errors";

export function inventoryItemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Inventory item", id);
}

export function insufficientStock(): DomainRuleError {
  return new DomainRuleError("Insufficient stock", {
    reason: "INVENTORY_INSUFFICIENT_STOCK",
  });
}

export function branchRequiredForInventoryItem(): MissingBranchError {
  return new MissingBranchError(
    "Please select a specific branch before adding inventory.",
  );
}
