import { ValidationError, DomainRuleError } from "@/core/errors";
import type { RowError } from "./menu-import-parser";

export const noFileUploaded = (): ValidationError => {
  return new ValidationError("No file uploaded", { reason: "NO_FILE" });
};

export const emptyImportFile = (): ValidationError => {
  return new ValidationError("File has no data rows", { reason: "EMPTY_FILE" });
};

export const importValidationFailed = (result: {
  inserted: number;
  updated: number;
  errors: RowError[];
}): DomainRuleError => {
  return new DomainRuleError("No rows were valid", {
    reason: "VALIDATION_FAILED",
    result,
  });
};
