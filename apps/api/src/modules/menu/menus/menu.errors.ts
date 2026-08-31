import { ConflictError, NotFoundError } from "../../../core/errors";

export const menuNotFound = (id: string) =>
  new NotFoundError(`Menu with id ${id} not found`);

export const defaultMenuProtected = () =>
  new ConflictError("The Default Menu cannot be deleted");
