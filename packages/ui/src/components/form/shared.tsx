import { type ReactNode, useId } from "react";
import { cn } from "../../utils/cn";

/**
 * Shared building blocks for every Phase 3 form input
 * (docs/design-system/00-PLAN.md). Each input owns its own root markup
 * (they render very differently — segmented OTP boxes vs. a single
 * `<input>` vs. a `<textarea>`) but they all share the same label +
 * hint/error + char-count chrome and the same aria-describedby wiring.
 * Pulling that into one place means fixing an a11y bug here fixes it
 * for all seven inputs at once — same reasoning as `Modal` being the
 * single highest-leverage a11y fix per docs/frontend/COMPONENT_GUIDE.md.
 */

/** Stable field id (respects an explicit `id` prop) + the hint/error ids derived from it. */
export function useFieldIds(idProp?: string) {
  const autoId = useId();
  const fieldId = idProp ?? autoId;
  return {
    fieldId,
    hintId: `${fieldId}-hint`,
    errorId: `${fieldId}-error`,
  };
}

/** `aria-describedby` should point at the error when present, else the hint, else nothing. */
export function describedBy(
  hintId: string,
  errorId: string,
  hint?: string | undefined,
  error?: string | undefined,
) {
  if (error) return errorId;
  if (hint) return hintId;
  return undefined;
}

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean | undefined;
  children?: ReactNode | undefined;
}) {
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
}

export function FieldFooter({
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
}) {
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
}

/** Base chrome shared by every single-line/multi-line text-entry field. */
export function fieldBaseClasses(hasError: boolean) {
  return cn(
    "block w-full text-sm text-text-primary bg-surface border rounded-md",
    "placeholder:text-text-disabled transition-colors duration-fast ease-standard",
    "focus:outline-none focus:ring-2 focus:border-transparent",
    "disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed",
    hasError
      ? "border-danger focus:ring-danger"
      : "border-border focus:ring-primary",
  );
}
