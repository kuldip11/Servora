/** Menu-template error factories using the shared application error taxonomy. */
import { NotFoundError } from "../../../core/errors";

export function templateNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu template", id);
}

export function templateCategoryNotFound(id?: string): NotFoundError {
  return new NotFoundError("Category", id);
}
