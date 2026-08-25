import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { FieldLabel, FieldFooter, fieldBaseClasses, useFieldIds, describedBy } from './shared';

export interface CurrencyInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'defaultValue' | 'onChange' | 'type' | 'prefix'
  > {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  value?: number | undefined;
  /** Called with a number in the currency's major unit (e.g. dollars, not cents). */
  onChange?: (value: number) => void;
  /** @default '$' */
  currencySymbol?: string | undefined;
  /** @default 2 */
  decimalPlaces?: number | undefined;
}

/**
 * Controlled numeric field for money amounts — leading currency symbol,
 * formats to `decimalPlaces` on blur (`4` → `4.00`), and only ever
 * reports a plain `number` (major units) via `onChange`, never a
 * currency-formatted string, so callers don't have to re-parse it.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      hint,
      error,
      required,
      value,
      onChange,
      currencySymbol = '$',
      decimalPlaces = 2,
      className,
      id,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const { fieldId, hintId, errorId } = useFieldIds(id);
    // Text mid-edit ("12.", "") can't always round-trip through a
    // formatted number, so typing is tracked as a draft string and only
    // reconciled with the numeric `value` on blur.
    const [draft, setDraft] = useState<string | null>(null);
    const displayValue = draft ?? (value !== undefined ? value.toFixed(decimalPlaces) : '');

    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3 text-sm text-text-secondary">
            {currencySymbol}
          </span>
          <input
            ref={ref}
            id={fieldId}
            type="text"
            inputMode="decimal"
            className={cn(fieldBaseClasses(!!error), 'pl-7 pr-3 py-2.5', className)}
            value={displayValue}
            onChange={(e) => {
              const raw = e.target.value;
              // Allow only digits and a single decimal point while typing.
              if (!/^\d*\.?\d*$/.test(raw)) return;
              setDraft(raw);
              const parsed = parseFloat(raw);
              onChange?.(Number.isNaN(parsed) ? 0 : parsed);
            }}
            onBlur={(e) => {
              setDraft(null);
              onBlur?.(e);
            }}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy(hintId, errorId, hint, error)}
            {...props}
          />
        </div>
        <FieldFooter hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';
