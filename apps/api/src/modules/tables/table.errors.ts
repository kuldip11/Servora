/**
 * Table-specific error factories.
 *
 * The pre-refactor controller used ad-hoc code strings for these
 * (`BRANCH_REQUIRED`, `BRANCH_NOT_FOUND`, `TABLES_DISABLED`,
 * `TABLE_HAS_ACTIVE_ORDER`, `TABLE_HAS_OPEN_ORDER`). No frontend client
 * checks those specific strings (verified — see docs/NEXT_STEPS.md), so
 * this migration folds them into the shared `AppError` taxonomy
 * (`NotFoundError`, `ConflictError`, `MissingBranchError`) and keeps the
 * original wording as `message` and the original code as `details.reason`
 * for anyone currently grepping logs for it. Status codes are unchanged.
 */
import { NotFoundError, ConflictError, MissingBranchError } from '../../core/errors';

export function tableNotFound(id?: string): NotFoundError {
  return new NotFoundError('Table', id);
}

export function branchNotFound(branchId: string): NotFoundError {
  return new NotFoundError('Branch', branchId);
}

export function branchRequiredForTable(): MissingBranchError {
  return new MissingBranchError('Please select a specific branch before adding a table.');
}

export function tablesDisabledForBranch(): ConflictError {
  return new ConflictError(
    'Tables are disabled for this branch — enable them from the Branches page first.',
    { reason: 'TABLES_DISABLED' },
  );
}

export function tableHasActiveOrder(): ConflictError {
  return new ConflictError(
    'This table has an active order — it cannot be changed until that order is closed or cancelled',
    { reason: 'TABLE_HAS_ACTIVE_ORDER' },
  );
}

export function tableHasOpenOrder(): ConflictError {
  return new ConflictError('This table has an open order and cannot be removed', {
    reason: 'TABLE_HAS_OPEN_ORDER',
  });
}
