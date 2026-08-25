/**
 * Staff-specific error factories.
 *
 * The pre-refactor controller had no explicit not-found handling on
 * update/delete at all — `db.update(...).returning()` (or, for delete, no
 * `.returning()` at all) with zero rows affected still returned
 * `{ success: true, data: undefined }` at 200. Folding into the shared
 * `AppError` taxonomy adds a real `NotFoundError` (404) for those cases —
 * a disclosed, deliberate correction (same category as Sprint 1D's order
 * fix), not a silent behavior change. See docs/NEXT_STEPS.md.
 */
import { NotFoundError, MissingBranchError } from "../../core/errors";

export function staffNotFound(id: string): NotFoundError {
  return new NotFoundError("Staff member", id);
}

export function branchRequiredForStaff(): MissingBranchError {
  return new MissingBranchError(
    "Please select a specific branch before adding staff.",
  );
}
