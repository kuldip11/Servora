
import { NotFoundError, ConflictError } from "../../../core/errors";

export function categoryNotFound(id?: string): NotFoundError {
  return new NotFoundError("Category", id);
}

export function categoryHasItems(itemCount: number): ConflictError {
  return new ConflictError(
    `This category still has ${itemCount} item(s) in it. Move or remove them first.`,
    { reason: "CATEGORY_HAS_ITEMS", itemCount },
  );
}
