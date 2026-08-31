import { NotFoundError, MissingBranchError } from "@/core/errors";

export const staffNotFound = (id: string): NotFoundError => {
  return new NotFoundError("Staff member", id);
};

export const branchRequiredForStaff = (): MissingBranchError => {
  return new MissingBranchError(
    "Please select a specific branch before adding staff.",
  );
};
