

import { NotFoundError, MissingBranchError } from "../../core/errors";

export function ticketNotFound(ticketId: string): NotFoundError {
  return new NotFoundError("Kitchen ticket", ticketId);
}

export function branchRequired(): MissingBranchError {
  return new MissingBranchError(
    "Please select a specific branch to view its kitchen queue.",
  );
}
