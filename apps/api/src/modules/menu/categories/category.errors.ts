/**
 * Menu category error factories.
 *
 * No frontend client checks the pre-refactor `CATEGORY_HAS_ITEMS` code
 * string (verified — see docs/NEXT_STEPS.md), so this migration folds it
 * into the shared `ConflictError`. Status code unchanged (409).
 */
import { NotFoundError, ConflictError } from '../../../core/errors';

export function categoryNotFound(id?: string): NotFoundError {
  return new NotFoundError('Category', id);
}

export function categoryHasItems(itemCount: number): ConflictError {
  return new ConflictError(
    `This category still has ${itemCount} item(s) in it. Move or remove them first.`,
    { reason: 'CATEGORY_HAS_ITEMS', itemCount },
  );
}
