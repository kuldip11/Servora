import {
  NotFoundError,
  ConflictError,
  ValidationError,
  DomainRuleError,
  MissingBranchError,
} from "@/core/errors";

export const orderNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Order", id);
};

export const branchRequiredForOrder = (): MissingBranchError => {
  return new MissingBranchError(
    "Please select a specific branch from the top navigation before creating an order.",
  );
};

export const orderBranchNotFound = (): NotFoundError => {
  return new NotFoundError("Branch");
};

export const orderTypeDisabled = (): ConflictError => {
  return new ConflictError(
    "This order type is not enabled for the selected branch",
    {
      reason: "ORDER_TYPE_DISABLED",
    },
  );
};

export const tableRequiredForDineIn = (): ValidationError => {
  return new ValidationError("Please select a table for dine-in orders", {
    reason: "TABLE_REQUIRED",
  });
};

export const orderTableNotFound = (): NotFoundError => {
  return new NotFoundError("Table");
};

export const tableOccupied = (): ConflictError => {
  return new ConflictError("This table already has an open order", {
    reason: "TABLE_OCCUPIED",
  });
};

export const ticketsNotServed = (): ConflictError => {
  return new ConflictError(
    "All kitchen tickets must be served before requesting the bill",
    {
      reason: "TICKETS_NOT_SERVED",
    },
  );
};

export const orderNotOpen = (currentStatus: string): DomainRuleError => {
  return new DomainRuleError(
    `Cannot fire a new ticket while the tab is ${currentStatus}`,
    {
      reason: "ORDER_INVALID_STATE",
      currentStatus,
    },
  );
};

export const orderItemNotFound = (id: string): NotFoundError => {
  return new NotFoundError("Order item", id);
};

export const orderItemCannotBeVoided = (reason: string): ConflictError => {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_VOIDABLE" });
};

export const orderItemCannotBeComped = (reason: string): ConflictError => {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_COMPABLE" });
};

export const orderItemCannotBeRefired = (reason: string): ConflictError => {
  return new ConflictError(reason, { reason: "ORDER_ITEM_NOT_REFIREABLE" });
};

export const orderCannotTransferTable = (reason: string): ConflictError => {
  return new ConflictError(reason, { reason: "ORDER_TABLE_TRANSFER_FAILED" });
};

export const orderCannotMerge = (reason: string): ConflictError => {
  return new ConflictError(reason, { reason: "ORDER_MERGE_FAILED" });
};
