/**
 * Kitchen-ticket-specific error factories.
 *
 * Thin wrappers over the shared `AppError` hierarchy — kept here (rather
 * than inlining `new NotFoundError(...)` at each call site) so the message
 * wording for this module lives in one place and reads consistently.
 */
import { NotFoundError, MissingBranchError } from '../../core/errors';

export function ticketNotFound(ticketId: string): NotFoundError {
  return new NotFoundError('Kitchen ticket', ticketId);
}

export function branchRequired(): MissingBranchError {
  return new MissingBranchError('Please select a specific branch to view its kitchen queue.');
}
