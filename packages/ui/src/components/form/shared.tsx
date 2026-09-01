import { type ReactNode, useId } from "react";
import { cn } from "../../utils/cn";

export const useFieldIds = (idProp?: string) => {
  const autoId = useId();
  const fieldId = idProp ?? autoId;
  return {
    fieldId,
    hintId: `${fieldId}-hint`,
    errorId: `${fieldId}-error`,
  };
};

export const describedBy = (
  hintId: string,
  errorId: string,
  hint?: string | undefined,
  error?: string | undefined,
) => {
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
};

export const FieldLabel = ({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean | undefined;
  children?: ReactNode | undefined;
}) => {
  if (!children) return null;
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
      {children}
      {required && (
        <span className="text-danger ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
};

export const FieldFooter = ({
  hint,
  error,
  hintId,
  errorId,
  charCount,
  maxLength,
}: {
  hint?: string | undefined;
  error?: string | undefined;
  hintId: string;
  errorId: string;
  charCount?: number | undefined;
  maxLength?: number | undefined;
}) => {
  const hasMessage = !!error || !!hint;
  const hasCount = charCount !== undefined;
  if (!hasMessage && !hasCount) return null;

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-text-secondary">
            {hint}
          </p>
        )}
      </div>
      {hasCount && (
        <p
          className={cn(
            "text-xs shrink-0 tabular-nums",
            maxLength !== undefined && charCount! > maxLength
              ? "text-danger"
              : "text-text-secondary",
          )}
        >
          {charCount}
          {maxLength !== undefined ? `/${maxLength}` : ""}
        </p>
      )}
    </div>
  );
};

export const fieldBaseClasses = (hasError: boolean) => {
  return cn(
    "block w-full text-sm text-text-primary bg-surface border rounded-md",
    "placeholder:text-text-disabled transition-colors duration-fast ease-standard",
    "focus:outline-none focus:ring-2 focus:border-transparent",
    "disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed",
    hasError
      ? "border-danger focus:ring-danger"
      : "border-border focus:ring-primary",
  );
};
