import { NotFoundError } from "@/core/errors";

export const modifierGroupNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Modifier group", id);
};

export const modifierOptionNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Modifier option", id);
};
