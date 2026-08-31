import { NotFoundError } from "@/core/errors";

export const itemNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Menu item", id);
};

export const inventoryItemNotFound = (ids: string[]): NotFoundError => {
  return new NotFoundError("Inventory item", undefined, { missingIds: ids });
};
