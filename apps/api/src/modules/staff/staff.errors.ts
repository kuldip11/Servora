
import { NotFoundError, MissingBranchError } from "../../core/errors";

export function staffNotFound(id: string): NotFoundError {
  return new NotFoundError("Staff member", id);
}

export function branchRequiredForStaff(): MissingBranchError {
  return new MissingBranchError(
    "Please select a specific branch before adding staff.",
  );
}
