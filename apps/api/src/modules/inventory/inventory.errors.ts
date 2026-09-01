import {
  NotFoundError,
  DomainRuleError,
  MissingBranchError,
} from "@/core/errors";

export const inventoryItemNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Inventory item", id);
};

export const insufficientStock = (): DomainRuleError => {
  return new DomainRuleError("Insufficient stock", {
    reason: "INVENTORY_INSUFFICIENT_STOCK",
  });
};

export const branchRequiredForInventoryItem = (): MissingBranchError => {
  return new MissingBranchError(
    "Please select a specific branch before adding inventory.",
  );
};
