/**
 * Order-specific error factories.
 *
 * The pre-refactor controller signaled these with plain
 * `throw new Error('SOME_CODE')` and pattern-matched `err.message` in a
 * long if-chain per route. No frontend client checks these code strings
 * (verified — see docs/NEXT_STEPS.md), so this migration folds them into
 * the shared `AppError` taxonomy. Status codes are unchanged from what the
 * controller mapped them to; the one behavior change is dropping the
 * redundant `"ORDER_INVALID_STATE: "` prefix that used to appear inside
 * the user-facing `message` (the machine-readable part is `code` now, not
 * a hand-rolled prefix) — original wording kept in `details.reason`.
 */
import { NotFoundError, ConflictError, ValidationError, DomainRuleError, MissingBranchError } from '../../core/errors';

export function orderNotFound(id?: string): NotFoundError {
  return new NotFoundError('Order', id);
}

export function branchRequiredForOrder(): MissingBranchError {
  return new MissingBranchError(
    'Please select a specific branch from the top navigation before creating an order.',
  );
}

export function orderBranchNotFound(): NotFoundError {
  return new NotFoundError('Branch');
}

export function orderTypeDisabled(): ConflictError {
  return new ConflictError('This order type is not enabled for the selected branch', {
    reason: 'ORDER_TYPE_DISABLED',
  });
}

export function tableRequiredForDineIn(): ValidationError {
  return new ValidationError('Please select a table for dine-in orders', {
    reason: 'TABLE_REQUIRED',
  });
}

export function orderTableNotFound(): NotFoundError {
  return new NotFoundError('Table');
}

export function tableOccupied(): ConflictError {
  return new ConflictError('This table already has an open order', {
    reason: 'TABLE_OCCUPIED',
  });
}

export function ticketsNotServed(): ConflictError {
  return new ConflictError('All kitchen tickets must be served before requesting the bill', {
    reason: 'TICKETS_NOT_SERVED',
  });
}

/** For the "must be OPEN to fire a new ticket" guard — not a general state-machine transition, but same original status (422) as one. */
export function orderNotOpen(currentStatus: string): DomainRuleError {
  return new DomainRuleError(`Cannot fire a new ticket while the tab is ${currentStatus}`, {
    reason: 'ORDER_INVALID_STATE',
    currentStatus,
  });
}
