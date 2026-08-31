/** Recipe-domain error factories using the shared application error taxonomy. */
import { NotFoundError } from "../../../core/errors";

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu item", id);
}

export function inventoryItemNotFound(ids: string[]): NotFoundError {
  return new NotFoundError("Inventory item", undefined, { missingIds: ids });
}
