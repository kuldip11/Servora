import { NotFoundError } from "@/core/errors";

export const templateNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Menu template", id);
};

export const templateCategoryNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Category", id);
};
