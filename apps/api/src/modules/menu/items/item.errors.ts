/**
 * Menu item error factories.
 *
 * The pre-refactor controller signaled "not found" two different ways
 * depending on the endpoint: some checked the repository result and
 * returned 404 directly, others had the repository `throw new
 * Error('ITEM_NOT_FOUND')` and pattern-matched it in the controller. Both
 * collapse to the same `NotFoundError` here. No frontend client checks
 * these code strings (verified — see docs/NEXT_STEPS.md).
 */
import { NotFoundError } from "../../../core/errors";

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu item", id);
}
