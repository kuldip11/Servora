import { type InputHTMLAttributes, forwardRef } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  FieldLabel,
  FieldFooter,
  fieldBaseClasses,
  useFieldIds,
  describedBy,
} from "./shared";

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type"
> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  value?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;

  onChange?: (value: number) => void;

  showSteppers?: boolean | undefined;
}

function clamp(n: number, min?: number, max?: number) {
  let v = n;
  if (min !== undefined) v = Math.max(min, v);
  if (max !== undefined) v = Math.min(max, v);
  return v;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      hint,
      error,
      required,
      value,
      min,
      max,
      step = 1,
      onChange,
      showSteppers = true,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const { fieldId, hintId, errorId } = useFieldIds(id);
    const current = value ?? 0;

    const handleStep = (delta: number) => {
      onChange?.(clamp(current + delta, min, max));
    };

    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
        <div className="relative flex items-center">
          {showSteppers && (
            <button
              type="button"
              aria-label="Decrease value"
              onClick={() => handleStep(-step)}
              disabled={disabled || (min !== undefined && current <= min)}
              className="absolute left-1.5 p-1 rounded text-text-secondary hover:bg-surface-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
          <input
            ref={ref}
            id={fieldId}
            type="number"
            inputMode="decimal"
            className={cn(
              fieldBaseClasses(!!error),
              "px-3 py-2.5 text-center",
              showSteppers && "px-9",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              className,
            )}
            value={value ?? 0}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const next = e.target.valueAsNumber;
              onChange?.(Number.isNaN(next) ? 0 : next);
            }}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy(hintId, errorId, hint, error)}
            {...props}
          />
          {showSteppers && (
            <button
              type="button"
              aria-label="Increase value"
              onClick={() => handleStep(step)}
              disabled={disabled || (max !== undefined && current >= max)}
              className="absolute right-1.5 p-1 rounded text-text-secondary hover:bg-surface-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <FieldFooter
          hint={hint}
          error={error}
          hintId={hintId}
          errorId={errorId}
        />
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
