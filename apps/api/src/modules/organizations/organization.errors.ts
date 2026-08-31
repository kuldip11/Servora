import { NotFoundError } from "@/core/errors";

export const organizationNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Organization", id);
};
