import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../core/errors";

export const invalidCustomerSession = () =>
  new UnauthorizedError("Customer session is invalid or expired");
export const customerTableNotFound = () => new NotFoundError("Customer table");
export const customerBranchUnavailable = () =>
  new ValidationError(
    "This restaurant is not accepting dine-in orders right now",
  );
