/**
 * Menu availability error factories (schedules, holidays, branch
 * overrides, effective-status resolution).
 *
 * The pre-refactor code signaled these with `throw new
 * Error('ITEM_NOT_FOUND')` / `'BRANCH_NOT_FOUND'` / a hand-rolled
 * `'ITEM_NOT_TENANT_WIDE: ...'` string, pattern-matched in the
 * controller. No frontend client checks the `'NOT_TENANT_WIDE'` code
 * specifically (verified — see docs/NEXT_STEPS.md), so this migration
 * folds it into `ValidationError`. Status codes are unchanged.
 */
import { NotFoundError, ValidationError } from '../../../core/errors';

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError('Menu item', id);
}

export function scheduleNotFound(id?: string): NotFoundError {
  return new NotFoundError('Schedule', id);
}

export function branchNotFoundForOverride(id?: string): NotFoundError {
  return new NotFoundError('Branch', id);
}

export function itemNotTenantWide(): ValidationError {
  return new ValidationError('Only tenant-wide items can have branch overrides', {
    reason: 'ITEM_NOT_TENANT_WIDE',
  });
}

export function invalidScheduleFields(message: string): ValidationError {
  return new ValidationError(message, { reason: 'INVALID_SCHEDULE_FIELDS' });
}
