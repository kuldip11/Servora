/** Inventory-domain error factories using the shared application error taxonomy. */
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
