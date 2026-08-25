/**
 * Modifier-groups/tags/allergens error factories.
 *
 * The legacy controller had no ad-hoc error-code strings for this
 * sub-domain to fold (unlike categories' `CATEGORY_HAS_ITEMS` or
 * branches'/orders' several) — the only failure paths it distinguished
 * were "not found" (404). Both wrap the shared `NotFoundError`.
 */
import { NotFoundError } from "../../../core/errors";

export function modifierGroupNotFound(id?: string): NotFoundError {
  return new NotFoundError("Modifier group", id);
}

export function modifierOptionNotFound(id?: string): NotFoundError {
  return new NotFoundError("Modifier option", id);
}
