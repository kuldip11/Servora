/**
 * Menu templates error factories.
 *
 * The legacy `templates.service.ts` threw bare `Error('TEMPLATE_NOT_FOUND')`
 * / `Error('CATEGORY_NOT_FOUND')`, pattern-matched in the controller. Both
 * collapse to `NotFoundError` here — no frontend client checks these code
 * strings (verified — same check as the other menu sub-domains; see
 * docs/NEXT_STEPS.md).
 */
import { NotFoundError } from "../../../core/errors";

export function templateNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu template", id);
}

export function templateCategoryNotFound(id?: string): NotFoundError {
  return new NotFoundError("Category", id);
}
