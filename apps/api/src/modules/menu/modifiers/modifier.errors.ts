
import { NotFoundError } from "../../../core/errors";

export function modifierGroupNotFound(id?: string): NotFoundError {
  return new NotFoundError("Modifier group", id);
}

export function modifierOptionNotFound(id?: string): NotFoundError {
  return new NotFoundError("Modifier option", id);
}
