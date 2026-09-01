import { NotFoundError } from "@/core/errors";

export const itemNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Menu item", id);
};
