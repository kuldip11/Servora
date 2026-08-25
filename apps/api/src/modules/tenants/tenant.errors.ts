import { NotFoundError } from '../../core/errors';

export function tenantNotFound(id?: string): NotFoundError {
  return new NotFoundError('Tenant', id);
}

