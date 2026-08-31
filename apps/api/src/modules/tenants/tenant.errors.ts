import { NotFoundError } from "@/core/errors";

export const tenantNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Tenant", id);
};
