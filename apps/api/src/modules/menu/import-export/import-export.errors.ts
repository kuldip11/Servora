/**
 * Menu import/export error factories.
 *
 * The legacy controller hand-rolled three response shapes for the import
 * endpoints: `{ code: 'NO_FILE' }` / `{ code: 'EMPTY_FILE' }` (both 400),
 * and `{ code: 'VALIDATION_FAILED', data: result }` (422, with the full
 * per-row result attached). No frontend client checks any of these three
 * code strings (verified — `ImportWizard.tsx` only reads
 * `err.response.data.message` in its catch blocks), so this migration
 * folds them into the shared `AppError` taxonomy. Status codes are
 * unchanged; the 422 case's `result` payload moves from a top-level
 * `data` key to `details.result` (same reasoning as `CATEGORY_HAS_ITEMS`
 * moving its extra field into `details` in Sprint 1F).
 */
import { ValidationError, DomainRuleError } from '../../../core/errors';
import type { RowError } from './menu-import-parser';

export function noFileUploaded(): ValidationError {
  return new ValidationError('No file uploaded', { reason: 'NO_FILE' });
}

export function emptyImportFile(): ValidationError {
  return new ValidationError('File has no data rows', { reason: 'EMPTY_FILE' });
}

export function importValidationFailed(result: {
  inserted: number;
  updated: number;
  errors: RowError[];
}): DomainRuleError {
  return new DomainRuleError('No rows were valid', { reason: 'VALIDATION_FAILED', result });
}
