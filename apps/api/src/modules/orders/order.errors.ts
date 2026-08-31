
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  DomainRuleError,
  MissingBranchError,
} from "../../core/errors";

export function orderNotFound(id?: string): NotFoundError {
  return new NotFoundError("Order", id);
}

export function branchRequiredForOrder(): MissingBranchError {
  return new MissingBranchError(
    "Please select a specific branch from the top navigation before creating an order.",
  );
}

export function orderBranchNotFound(): NotFoundError {
  return new NotFoundError("Branch");
}

export function orderTypeDisabled(): ConflictError {
  return new ConflictError(
    "This order type is not enabled for the selected branch",
    {
      reason: "ORDER_TYPE_DISABLED",
    },
  );
}

export function tableRequiredForDineIn(): ValidationError {
  return new ValidationError("Please select a table for dine-in orders", {
    reason: "TABLE_REQUIRED",
  });
}

export function orderTableNotFound(): NotFoundError {
  return new NotFoundError("Table");
}

export function tableOccupied(): ConflictError {
  return new ConflictError("This table already has an open order", {
    reason: "TABLE_OCCUPIED",
  });
}

export function ticketsNotServed(): ConflictError {
  return new ConflictError(
    "All kitchen tickets must be served before requesting the bill",
    {
      reason: "TICKETS_NOT_SERVED",
    },
  );
}

export function orderNotOpen(currentStatus: string): DomainRuleError {
  return new DomainRuleError(
    `Cannot fire a new ticket while the tab is ${currentStatus}`,
    {
      reason: "ORDER_INVALID_STATE",
      currentStatus,
    },
  );
}

export function orderItemNotFound(id: string): NotFoundError {
  return new NotFoundError("Order item", id);
}

export function orderItemCannotBeVoided(reason: string): ConflictError {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_VOIDABLE" });
}

export function orderItemCannotBeComped(reason: string): ConflictError {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_COMPABLE" });
}

export function orderItemCannotBeRefired(reason: string): ConflictError {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_REFIREABLE" });
}

export function orderCannotTransferTable(reason: string): ConflictError {
  return new ConflictError(reason, { reason: "ORDER_TABLE_TRANSFER_FAILED" });
}

export function orderCannotMerge(reason: string): ConflictError {
  return new ConflictError(reason, { reason: "ORDER_MERGE_FAILED" });
}
