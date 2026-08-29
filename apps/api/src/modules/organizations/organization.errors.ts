import { NotFoundError } from "../../core/errors";

export function organizationNotFound(id?: string): NotFoundError {
  return new NotFoundError("Organization", id);
}
