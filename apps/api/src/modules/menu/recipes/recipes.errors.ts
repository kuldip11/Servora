/**
 * Menu recipes error factories.
 *
 * The legacy repository threw bare `Error('ITEM_NOT_FOUND')` /
 * `Error('INVENTORY_ITEM_NOT_FOUND: <ids>')` and the controller
 * pattern-matched the message. Both collapse to `NotFoundError` here — no
 * frontend client checks these code strings (verified — same check as the
 * other menu sub-domains before folding their ad-hoc codes; see
 * docs/NEXT_STEPS.md).
 */
import { NotFoundError } from "../../../core/errors";

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu item", id);
}

export function inventoryItemNotFound(ids: string[]): NotFoundError {
  return new NotFoundError("Inventory item", undefined, { missingIds: ids });
}
