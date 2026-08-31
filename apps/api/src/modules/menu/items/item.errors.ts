
import { NotFoundError } from "../../../core/errors";

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu item", id);
}
